# Frontend Application

This directory contains the frontend application for the Bobyard project. It is a **React** application initialized with Create React App and uses **Material UI (MUI)** for styling.

## Prerequisites

- Node.js (v14 or higher recommended)
- npm (Node Package Manager)

## Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

## Running the Application

To start the development server:

```bash
npm start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

## Features & How it Works

- **Comment Feed**: Displays a list of comments fetched from the backend API.
- **Add Comment**: A text input field allows users to post new comments.
- **Edit/Delete**: Users can edit or delete existing comments directly from the feed.
- **Material UI**: The UI is built using MUI components like `Card`, `Typography`, `Button`, and `TextField` for a modern and responsive design.

## API Integration

The frontend is configured to communicate with the backend server at `http://localhost:8000`.
- It uses the native `fetch` API to perform GET, POST, PUT, and DELETE requests to the `/comments` endpoints.

## Project Structure

- `src/App.js`: The main component containing the application logic and UI.
- `src/App.css`: Custom styles for the application.
- `public/`: Static assets.