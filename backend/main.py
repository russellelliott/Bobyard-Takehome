"""
Main application module for the Comments API.
This module sets up the FastAPI application, database connection, and API endpoints.
"""

import json
import os
from datetime import datetime
from typing import List
import uuid

import lancedb
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- CORS Configuration ---
# Allow requests from the frontend application
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

# --- Database Setup ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_URI = os.path.join(BASE_DIR, "data/lancedb")
os.makedirs(DB_URI, exist_ok=True)
db = lancedb.connect(DB_URI)

TABLE_NAME = "comments"

# --- Pydantic Models ---

class CommentBase(BaseModel):
    """Base model for comment data."""
    text: str

class CommentCreate(CommentBase):
    """Model for creating a new comment."""
    pass

class CommentUpdate(BaseModel):
    """Model for updating an existing comment."""
    text: str

class Comment(BaseModel):
    """
    Model representing a full comment object as stored in the database
    and returned to the client.
    """
    id: str
    author: str
    text: str
    date: str
    likes: int
    image: str

# --- Database Initialization ---

def init_db():
    """
    Initialize the LanceDB database.
    
    Checks if the 'comments' table exists. 
    If not, it tries to load initial data from 'comments.json'.
    If the JSON file is missing, it creates an empty table with the correct schema.
    """
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
            # This requires creating a dummy empty dataframe with the correct columns
            df = pd.DataFrame(columns=["id", "author", "text", "date", "likes", "image"])
            db.create_table(TABLE_NAME, data=df)
    else:
        print(f"Table '{TABLE_NAME}' already exists.")

# Run initialization on startup
@app.on_event("startup")
async def startup_event():
    """Event handler to initialize the database when the application starts."""
    init_db()

# --- API Endpoints ---

@app.get("/comments/{state}", response_model=List[Comment])
async def get_comments(state):
    """
    Retrieve a list of comments sorted based on the provided state.

    Args:
        state (str): The sorting criteria. 
                     Options: 'date-up', 'date-down', 'id-up', 'id-down'.

    Returns:
        List[dict]: A list of comments sorted according to the criteria.
    """
    print("backend state: ", state)
    table = db.open_table(TABLE_NAME)
    
    # LanceDB returns a pyarrow table or pandas dataframe. 
    # to_pandas() returns a DataFrame, which we then sort and convert to a dict.
    df = table.to_pandas()
    
    # Sort the DataFrame based on the 'state' parameter
    if state == 'date-up':
        df = df.sort_values(by="date", ascending=True)
    elif state == 'date-down':
        df = df.sort_values(by="date", ascending=False)
    elif state == 'id-up':
        df = df.sort_values(by="id", ascending=True)
    elif state == 'id-down':
        df = df.sort_values(by="id", ascending=False)
        
    return df.to_dict(orient="records")

@app.post("/comments", response_model=Comment)
async def create_comment(comment: CommentCreate):
    """
    Create a new comment.

    Args:
        comment (CommentCreate): The comment data containing the text.

    Returns:
        dict: The newly created comment object including generated fields.
    """
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
    table.add([new_comment])
    
    return new_comment

@app.put("/comments/{comment_id}", response_model=Comment)
async def update_comment(comment_id: str, comment_update: CommentUpdate):
    """
    Update an existing comment's text.

    Args:
        comment_id (str): The ID of the comment to update.
        comment_update (CommentUpdate): The new text for the comment.

    Returns:
        dict: The updated comment object.

    Raises:
        HTTPException: If the comment is not found.
    """
    table = db.open_table(TABLE_NAME)
    
    # Check if the comment exists using a filter query
    results = table.search().where(f"id = '{comment_id}'").limit(1).to_pandas()
    
    if results.empty:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    existing_comment = results.iloc[0].to_dict()
    
    # Update fields in the object specifically for the return value
    existing_comment["text"] = comment_update.text
    
    # Perform the update in the database
    try:
        # Try to use the update method if available
        table.update(where=f"id = '{comment_id}'", values={"text": comment_update.text})
        return existing_comment
    except Exception as e:
        # Fallback for older versions or if update fails: delete and re-insert
        print(f"Update failed using .update(): {e}. Falling back to delete and insert.")
        table.delete(f"id = '{comment_id}'")
        table.add([existing_comment])
        return existing_comment

@app.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str):
    """
    Delete a comment by its ID.

    Args:
        comment_id (str): The ID of the comment to delete.

    Returns:
        dict: A confirmation message.

    Raises:
        HTTPException: If the comment is not found.
    """
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
