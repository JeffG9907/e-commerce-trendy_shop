import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Button, Table, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Box, useTheme, useMediaQuery, CircularProgress, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

function convertGoogleDriveUrl(url) {
  // Puedes adaptar esta función según tus necesidades de conversión
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    // Extrae el ID del archivo
    const match = url.match(/\/file\/d\/([^/]+)/);
    if (match) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url;
}

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({ name: '', description: '', imageUrl: '' });
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState('');
  const db = getFirestore();

  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));

  const handleOpen = (category = null) => {
    if (category) {
      setCurrentCategory(category);
      setImagePreview(category.imageUrl);
      setEditMode(true);
    } else {
      setCurrentCategory({ name: '', description: '', imageUrl: '' });
      setImagePreview('');
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentCategory({ name: '', description: '', imageUrl: '' });
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

  // Responsive: la tabla se convierte en tarjetas en mobile
  const renderResponsiveList = () => {
    if (!isXs) {
      // Tabla para desktop y tablet
      return (
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
                      style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }}
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
      );
    } else {
      // Cards para mobile
      return (
        <Grid container spacing={2}>
          {categories.map((category) => (
            <Grid item xs={12} key={category.id}>
              <Paper sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                <img
                  src={category.imageUrl}
                  alt={category.name}
                  style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, marginRight: 16 }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight="bold">{category.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </Box>
                <Box>
                  <IconButton onClick={() => handleOpen(category)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category)} color="error" size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      );
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: isXs ? 2 : 4 }}>
      <Box sx={{
        display: 'flex',
        flexDirection: isXs ? 'column' : 'row',
        alignItems: isXs ? 'stretch' : 'center',
        justifyContent: 'space-between',
        mb: isXs ? 2 : 4,
        gap: isXs ? 2 : 0
      }}>
        <Typography variant={isXs ? "h5" : "h4"}>Gestión de Categorías</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          sx={{ alignSelf: isXs ? 'flex-end' : 'center', width: isXs ? '100%' : 'auto' }}
        >
          Agregar Categoría
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderResponsiveList()
      )}

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            m: isXs ? 1 : 4
          }
        }}
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
            rows={isXs ? 2 : 3}
            value={currentCategory.description}
            onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL de Imagen"
            fullWidth
            value={currentCategory.imageUrl}
            onChange={(e) => {
              setCurrentCategory({ ...currentCategory, imageUrl: e.target.value });
              setImagePreview(e.target.value);
            }}
            sx={{ mb: 2 }}
            helperText="Ingrese la URL de Google Drive de la imagen"
          />
          {imagePreview && (
            <Box sx={{
              mt: 2,
              textAlign: 'center',
              '& img': {
                maxWidth: isXs ? '90vw' : 300,
                maxHeight: isXs ? 160 : 200,
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: 1,
                border: `1px solid ${theme.palette.divider}`
              }
            }}>
              <img src={imagePreview} alt="Preview" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
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