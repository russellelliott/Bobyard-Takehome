# Backend Service

This directory contains the backend service for the Bobyard application. It is built using **FastAPI** and uses **LanceDB** as an embedded database to store comments.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Server

To start the backend server, use `uvicorn`:

```bash
uvicorn main:app --reload
```

The server will start at `http://localhost:8000`.

## API Endpoints

The API provides the following endpoints for managing comments:

- **GET /comments**: Retrieve a list of all comments.
- **POST /comments**: Create a new comment.
  - Body: `{"text": "Your comment here"}`
- **PUT /comments/{id}**: Update an existing comment.
  - Body: `{"text": "Updated comment text"}`
- **DELETE /comments/{id}**: Delete a comment by its ID.

## How it Works

- **FastAPI**: The web framework used to define the API endpoints and handle HTTP requests.
- **LanceDB**: An embedded vector database used here to store structured comment data.
  - On startup, the application checks if the `comments` table exists.
  - If not, it initializes the database using data from `comments.json`.
  - Data is stored locally in the `data/lancedb` directory.
- **CORS**: The application is configured to allow Cross-Origin Resource Sharing (CORS) from `http://localhost:3000` (the frontend).

## Project Structure

- `main.py`: The main application file containing the API logic and database connection.
- `requirements.txt`: List of Python dependencies.
- `comments.json`: Initial data used to seed the database.
- `data/`: Directory where the LanceDB database files are stored.