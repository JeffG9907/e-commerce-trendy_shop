import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Button, Grid, Card, CardMedia, CardContent, Table,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Box, useTheme, useMediaQuery, CircularProgress,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject, getStorage } from 'firebase/storage';

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: '', description: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const db = getFirestore();

  // Update handleOpen to set categoryName
  const handleOpen = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setCategoryName(category.name);
      setEditMode(true);
    } else {
      setCurrentCategory({ name: '', description: '', imageUrl: '' });
      setCategoryName('');
      setEditMode(false);
    }
    setOpen(true);
  };

  // Add handleImageChange function
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update handleClose to reset form fields
  const handleClose = () => {
    setOpen(false);
    setCurrentCategory({ name: '', description: '', imageUrl: '' });
    setCategoryName('');
    setImageFile(null);
    setImagePreview('');
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Update handleSave to use categoryName
  // Update handleSave function
  const handleSave = async () => {
    try {
      const categoryData = {
        name: currentCategory.name,
        description: currentCategory.description,
        imageUrl: convertGoogleDriveUrl(currentCategory.imageUrl)
      };

      if (editMode) {
        await updateDoc(doc(db, 'categories', currentCategory.id), categoryData);
      } else {
        await addDoc(collection(db, 'categories'), categoryData);
      }
      handleClose();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  // Update Dialog content
  <DialogContent sx={{ pt: { xs: 1, sm: 2 } }}>
    <TextField
      autoFocus
      margin="dense"
      label="Nombre de la Categoría"
      fullWidth
      value={currentCategory.name}
      onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
      sx={{ mb: 2 }}
    />
    <TextField
      margin="dense"
      label="Descripción"
      fullWidth
      multiline
      rows={3}
      value={currentCategory.description}
      onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
      sx={{ mb: 2 }}
    />
    <TextField
      margin="dense"
      label="URL de Imagen"
      fullWidth
      value={currentCategory.imageUrl}
      onChange={(e) => setCurrentCategory({ ...currentCategory, imageUrl: e.target.value })}
      sx={{ mb: 2 }}
      helperText="Ingrese la URL de Google Drive de la imagen"
    />
  </DialogContent>
  // Add uploadImage function
  const uploadImage = async (file) => {
    const storage = getStorage();
    const storageRef = ref(storage, `categories/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleDelete = async (category) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta categoría?')) {
      try {
        await deleteDoc(doc(db, 'categories', category.id));
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4">Gestión de Categorías</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Agregar Categoría
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>
                  <img 
                    src={category.imageUrl} 
                    alt={category.name} 
                    style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                  />
                </TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(category)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{editMode ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
        <DialogContent sx={{ pt: { xs: 1, sm: 2 } }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la Categoría"
            fullWidth
            value={currentCategory.name}
            onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={currentCategory.description}
            onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL de Imagen"
            fullWidth
            value={currentCategory.imageUrl}
            onChange={(e) => setCurrentCategory({ ...currentCategory, imageUrl: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Ingrese la URL de Google Drive de la imagen"
          />
          {currentCategory.imageUrl && (
            <Box sx={{ 
              mt: 2, 
              textAlign: 'center',
              '& img': {
                maxWidth: '100%',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: 1
              }
            }}>
              <img src={currentCategory.imageUrl} alt="Preview" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminCategories;
