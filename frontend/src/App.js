import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardHeader,
  Avatar,
  Box,
  Stack,
  TextField,
  Button,
  IconButton
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { red } from '@mui/material/colors';
import './App.css';

import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

/**
 * App Component
 * 
 * Main application component that handles displaying, adding, editing, 
 * and deleting comments. It interacts with the backend API to persist data.
 */
function App() {
  // --- State Management ---
  
  // State for sorting criteria (persisted in localStorage)
  const [sort, setSort] = React.useState(localStorage.getItem('sort') || 'date-down');

  // State for storing the list of comments fetched from the backend
  const [comments, setComments] = useState([]);
  
  // State for the new comment input field
  const [newComment, setNewComment] = useState('');
  
  // State to track which comment is currently being edited
  const [editingId, setEditingId] = useState(null);
  
  // State to hold the text of the comment being edited
  const [editText, setEditText] = useState('');

  // --- Effects ---

  // Effect to perist the sort preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sort', sort);
  }, [sort]);

  // Effect to fetch initial comments on component mount
  useEffect(() => {
    fetchComments(localStorage.getItem("sort"));
  }, []);

  // --- Handlers ---

  /**
   * Handles changes to the sort dropdown.
   * Updates state, localStorage, and refetches comments with the new sort order.
   * @param {object} event - The change event from the Select component
   */
  const handleChange = (event) => {
    setSort(event.target.value);
    fetchComments(event.target.value);
    localStorage.setItem('sort', event.target.value);
  };

  /**
   * Fetches comments from the backend based on the current sort order.
   * @param {string} state - The sort order identifier (e.g., 'date-up')
   */
  const fetchComments = (state) => {
    console.log("current state: ", state);
    console.log("current state localstorage: ", localStorage.getItem("sort"));
    fetch('http://localhost:8000/comments/' + state)
      .then(response => response.json())
      .then(data => setComments(data))
      .catch(error => console.error('Error fetching comments:', error));
  };

  /**
   * Submits a new comment to the backend.
   * Clears the input and refreshes the list upon success.
   */
  const handleAddComment = () => {
    if (!newComment.trim()) return;

    fetch('http://localhost:8000/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: newComment }),
    })
      .then(response => response.json())
      .then(() => {
        setNewComment('');
        fetchComments(sort); // Ensure we fetch with current sort
      })
      .catch(error => console.error('Error adding comment:', error));
  };

  /**
   * Deletes a comment by ID.
   * @param {string} id - The unique identifier of the comment to delete
   */
  const handleDeleteComment = (id) => {
    fetch(`http://localhost:8000/comments/${id}`, {
      method: 'DELETE',
    })
      .then(() => fetchComments(sort))
      .catch(error => console.error('Error deleting comment:', error));
  };

  /**
   * Initiates the edit mode for a specific comment.
   * @param {object} comment - The comment object to be edited
   */
  const handleStartEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  /**
   * Cancels the current edit operation and resets edit state.
   */
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  /**
   * Saves the edited text for a comment to the backend.
   * @param {string} id - The unique identifier of the comment being updated
   */
  const handleSaveEdit = (id) => {
    fetch(`http://localhost:8000/comments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: editText }),
    })
      .then(() => {
        setEditingId(null);
        fetchComments(sort);
      })
      .catch(error => console.error('Error updating comment:', error));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Community Comments
      </Typography>

      {/* Input Section */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Add a comment..."
          variant="outlined"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button
          variant="contained"
          size="large"
          onClick={handleAddComment}
          disabled={!newComment.trim()}
        >
          Post
        </Button>
      </Box>

      {/* Sort Controls */}
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Sort</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={sort}
          label="Sort"
          onChange={handleChange}
        >
          <MenuItem value={'date-up'}>Date (Ascending)</MenuItem>
          <MenuItem value={'date-down'}>Date (Descending)</MenuItem>
          <MenuItem value={'id-up'}>ID (Ascending)</MenuItem>
          <MenuItem value={'id-down'}>ID (Descending)</MenuItem>
        </Select>
      </FormControl>

      {/* Comment List */}
      <Stack spacing={3} sx={{ mt: 4 }}>
        {comments.map((comment) => (
          <Card key={comment.id} sx={{ width: '100%' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
                  {comment.author ? comment.author[0].toUpperCase() : '?'}
                </Avatar>
              }
              action={
                <Box>
                  {editingId === comment.id ? (
                    <>
                      <IconButton onClick={() => handleSaveEdit(comment.id)} color="primary">
                        <SaveIcon />
                      </IconButton>
                      <IconButton onClick={handleCancelEdit} color="default">
                        <CancelIcon />
                      </IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton onClick={() => handleStartEdit(comment)} color="primary">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteComment(comment.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </Box>
              }
              title={comment.author}
              subheader={comment.date ? new Date(comment.date).toLocaleString() : ''}
            />
            {comment.image && (
              <CardMedia
                component="img"
                image={comment.image}
                alt="Comment attachment"
                sx={{
                  maxHeight: 400,
                  objectFit: 'contain',
                  bgcolor: 'background.default'
                }}
              />
            )}
            <CardContent>
              {editingId === comment.id ? (
                <TextField
                  fullWidth
                  multiline
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  variant="outlined"
                />
              ) : (
                <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                  {comment.text}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <FavoriteIcon color="error" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {comment.likes} Likes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}

export default App;
