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

function App() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const fetchComments = () => {
    fetch('http://localhost:8000/comments')
      .then(response => response.json())
      .then(data => setComments(data))
      .catch(error => console.error('Error fetching comments:', error));
  };

  useEffect(() => {
    fetchComments();
  }, []);

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
        fetchComments();
      })
      .catch(error => console.error('Error adding comment:', error));
  };

  const handleDeleteComment = (id) => {
    fetch(`http://localhost:8000/comments/${id}`, {
      method: 'DELETE',
    })
      .then(() => fetchComments())
      .catch(error => console.error('Error deleting comment:', error));
  };

  const handleStartEdit = (comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

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
        fetchComments();
      })
      .catch(error => console.error('Error updating comment:', error));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Community Comments
      </Typography>

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

      <Stack spacing={3}>
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
