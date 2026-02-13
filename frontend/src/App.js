import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardHeader,
  Avatar,
  Box,
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

// Helper to convert flat list to tree
const buildCommentTree = (flatComments) => {
  const map = {};
  const roots = [];

  // Initialize map with all comments and empty children arrays
  flatComments.forEach(comment => {
    map[comment.id] = { ...comment, children: [] };
  });

  // Link children to parents
  flatComments.forEach(comment => {
    if (comment.parent && map[comment.parent]) {
      map[comment.parent].children.push(map[comment.id]);
    } else {
      roots.push(map[comment.id]);
    }
  });

  return roots;
};

// Recursive Comment Item Component
const CommentItem = ({ 
  comment, 
  depth = 0, 
  editingId, 
  editText, 
  onEdit, 
  onDelete, 
  onSave, 
  onCancel, 
  setEditText 
}) => {
  return (
    <Box sx={{ ml: depth > 0 ? 4 : 0, mt: 2, width: '100%' }}>
      <Card sx={{ width: '100%', borderLeft: depth > 0 ? `4px solid ${red[100]}` : 'none' }}>
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
                  <IconButton onClick={() => onSave(comment.id)} color="primary">
                    <SaveIcon />
                  </IconButton>
                  <IconButton onClick={onCancel} color="default">
                    <CancelIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton onClick={() => onEdit(comment)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => onDelete(comment.id)} color="error">
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
      
      {/* Recursive rendering of children */}
      {comment.children && comment.children.length > 0 && (
        <Box>
          {comment.children.map(child => (
            <CommentItem 
              key={child.id} 
              comment={child} 
              depth={depth + 1}
              editingId={editingId}
              editText={editText}
              onEdit={onEdit}
              onDelete={onDelete}
              onSave={onSave}
              onCancel={onCancel}
              setEditText={setEditText}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

function App() {
  // --- State Management ---
  const [sort, setSort] = React.useState(localStorage.getItem('sort') || 'date-down');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('sort', sort);
  }, [sort]);

  useEffect(() => {
    fetchComments(localStorage.getItem("sort") || 'date-down');
  }, []);

  // --- Handlers ---
  const handleChange = (event) => {
    setSort(event.target.value);
    fetchComments(event.target.value);
    localStorage.setItem('sort', event.target.value);
  };

  const fetchComments = (state) => {
    fetch('http://localhost:8000/comments/' + state)
      .then(response => response.json())
      .then(data => setComments(data))
      .catch(error => console.error('Error fetching comments:', error));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    fetch('http://localhost:8000/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment }),
    })
      .then(response => response.json())
      .then(() => {
        setNewComment('');
        fetchComments(sort);
      })
      .catch(error => console.error('Error adding comment:', error));
  };

  const handleDeleteComment = (id) => {
    fetch(`http://localhost:8000/comments/${id}`, {
      method: 'DELETE',
    })
      .then(() => fetchComments(sort))
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText }),
    })
      .then(() => {
        setEditingId(null);
        fetchComments(sort);
      })
      .catch(error => console.error('Error updating comment:', error));
  };

  // Build the tree dynamically when comments change
  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

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

      {/* Comment List Tree */}
      <Box sx={{ mt: 4 }}>
        {commentTree.map((comment) => (
          <CommentItem 
            key={comment.id}
            comment={comment}
            editingId={editingId}
            editText={editText}
            onEdit={handleStartEdit}
            onDelete={handleDeleteComment}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
            setEditText={setEditText}
          />
        ))}
      </Box>
    </Container>
  );
}

export default App;