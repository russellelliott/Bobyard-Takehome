import json
import os
from datetime import datetime
from typing import List, Optional
import uuid

import lancedb
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_URI = os.path.join(BASE_DIR, "data/lancedb")
os.makedirs(DB_URI, exist_ok=True)
db = lancedb.connect(DB_URI)

TABLE_NAME = "comments"

# Pydantic models
class CommentBase(BaseModel):
    text: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    text: str

class Comment(BaseModel):
    id: str
    author: str
    text: str
    date: str
    likes: int
    image: str

# Initialize database
def init_db():
    if TABLE_NAME not in db.table_names():
        try:
            json_path = os.path.join(BASE_DIR, "comments.json")
            with open(json_path, "r") as f:
                data = json.load(f)
                comments_data = data.get("comments", [])
                
            # Convert to DataFrame for LanceDB
            df = pd.DataFrame(comments_data)
            db.create_table(TABLE_NAME, data=df)
            print(f"Table '{TABLE_NAME}' created with {len(df)} records.")
        except FileNotFoundError:
            print("comments.json not found. Creating empty table.")
            # Create empty table with schema
            schema = Comment.model_json_schema()
            # This is a bit tricky with LanceDB without data, let's try creating with a dummy empty dataframe with columns
            df = pd.DataFrame(columns=["id", "author", "text", "date", "likes", "image"])
            db.create_table(TABLE_NAME, data=df)
    else:
        print(f"Table '{TABLE_NAME}' already exists.")

# Run initialization on startup
@app.on_event("startup")
async def startup_event():
    init_db()

@app.get("/comments/{state}", response_model=List[Comment])
async def get_comments(state):
    print("backend state: ", state)
    table = db.open_table(TABLE_NAME)
    # LanceDB returns pyarrow table or pandas dataframe. 
    # to_pandas() returns a DataFrame, then we convert to dict
    df = table.to_pandas()
    # Sort by date descending (optional but usually good for comments)
    
    #do a given sort depending on the state
    
    #       <MenuItem value={'date-up'}>Date (Ascending)</MenuItem>
    #       <MenuItem value={'date-down'}>Date (Decending)</MenuItem>
    #       <MenuItem value={'id-up'}>id (Ascending)</MenuItem>
    #       <MenuItem value={'id-down'}>id (Descending)</MenuItem>
          
          
    if state == 'date-up':
        df = df.sort_values(by="date", ascending=True) # date up
    elif state == 'date-down':
        df = df.sort_values(by="date", ascending=False) # date descending
    elif state == 'id-up':
        df = df.sort_values(by="id", ascending=True) # date descending
    elif state == 'id-down':
        df = df.sort_values(by="id", ascending=False) # date descending
        
        
    # df = df.sort_values(by="date", ascending=False) # date descending
    
    '''
    different logic
    
    df = df.sort_values(by="date", ascending=True) 
    
    df = df.sort_values(by="date", ascending=False) 
    
    df = df.sort_values(by="date", ascending=True) 
    '''
    return df.to_dict(orient="records")

@app.post("/comments", response_model=Comment)
async def create_comment(comment: CommentCreate):
    table = db.open_table(TABLE_NAME)
    
    new_comment = {
        "id": str(uuid.uuid4()),
        "author": "Admin",
        "text": comment.text,
        "date": datetime.utcnow().isoformat() + "Z",
        "likes": 0,
        "image": "https://via.placeholder.com/150" # Placeholder image for Admin
    }
    
    # Add to database
    # LanceDB expects a list of dicts or a dataframe
    table.add([new_comment])
    
    return new_comment

@app.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(comment_id: str, comment_update: CommentUpdate):
    table = db.open_table(TABLE_NAME)
    
    # LanceDB update is a bit different. It supports SQL-like updates or deletion and re-insertion.
    # For simplicity and since we are using LanceDB, let's check if it exists first.
    # We can use a filter query.
    
    results = table.search().where(f"id = '{comment_id}'").limit(1).to_pandas()
    
    if results.empty:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    existing_comment = results.iloc[0].to_dict()
    
    # Update fields
    existing_comment["text"] = comment_update.text
    
    # LanceDB currently supports updates via `update` method in newer versions or delete+insert.
    # Let's try the `update` method if available, otherwise delete and insert.
    # Checking documentation (simulated): table.update(where=..., values=...)
    
    try:
        table.update(where=f"id = '{comment_id}'", values={"text": comment_update.text})
        return existing_comment
    except Exception as e:
        # Fallback if update is not supported in the installed version or fails
        print(f"Update failed: {e}. Trying delete and insert.")
        table.delete(f"id = '{comment_id}'")
        table.add([existing_comment])
        return existing_comment

@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str):
    table = db.open_table(TABLE_NAME)
    
    # Check if exists
    results = table.search().where(f"id = '{comment_id}'").limit(1).to_pandas()
    if results.empty:
        raise HTTPException(status_code=404, detail="Comment not found")
        
    table.delete(f"id = '{comment_id}'")
    
    return {"detail": "Comment deleted"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
