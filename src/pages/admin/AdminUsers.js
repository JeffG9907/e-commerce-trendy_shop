import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { getFirestore, collection, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const db = getFirestore();

  const filteredUsers = users.filter(user => 
    (user.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpen = (user = null) => {
    setCurrentUser(user || {
      firstName: '',
      lastName: '',
      email: '',
      role: 'client',
      isAuthorized: true
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentUser(null);
  };

  const handleSave = async () => {
    try {
      const updateData = {
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || '',
        address: currentUser.address || '',
        canton: currentUser.canton || '',
        parroquia: currentUser.parroquia || '',
        province: currentUser.province || '',
        postalCode: currentUser.postalCode || '',
        role: currentUser.role || 'client',
        isAuthorized: typeof currentUser.isAuthorized === 'boolean' ? currentUser.isAuthorized : true
      };

      if (currentUser.id) {
        await updateDoc(doc(db, 'users', currentUser.id), updateData);
      } else {
        updateData.createdAt = new Date().toISOString();
        await addDoc(collection(db, 'users'), updateData);
      }
      handleClose();
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Gestión de Usuarios</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Nuevo Usuario
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        label="Buscar por nombre o correo"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role || 'client'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpen(user)}>
                    <EditIcon />
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
        maxWidth="md"
      >
        <DialogTitle>{currentUser?.id ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Nombre"
                fullWidth
                value={currentUser?.firstName || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Apellido"
                fullWidth
                value={currentUser?.lastName || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Email"
                fullWidth
                value={currentUser?.email || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Teléfono"
                fullWidth
                value={currentUser?.phoneNumber || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, phoneNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Código Postal"
                fullWidth
                value={currentUser?.postalCode || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, postalCode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Dirección"
                fullWidth
                multiline
                rows={2}
                value={currentUser?.address || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                margin="dense"
                label="Provincia"
                fullWidth
                value={currentUser?.province || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, province: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                margin="dense"
                label="Cantón"
                fullWidth
                value={currentUser?.canton || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, canton: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                margin="dense"
                label="Parroquia"
                fullWidth
                value={currentUser?.parroquia || ''}
                onChange={(e) => setCurrentUser({ ...currentUser, parroquia: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Rol</InputLabel>
                <Select
                  value={currentUser?.role || 'client'}
                  onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                  label="Rol"
                >
                  <MenuItem value="client">Cliente</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense">
                <InputLabel>Autorizado</InputLabel>
                <Select
                  value={currentUser?.isAuthorized || false}
                  onChange={(e) => setCurrentUser({ ...currentUser, isAuthorized: e.target.value })}
                  label="Autorizado"
                >
                  <MenuItem value={true}>Sí</MenuItem>
                  <MenuItem value={false}>No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
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

export default AdminUsers;