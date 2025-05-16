import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  Button, Select, MenuItem 
} from '@mui/material';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';


const SupportRequests = () => {
  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(true);
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const fetchSupports = async () => {
      const supportQuery = query(collection(db, 'support'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(supportQuery);
      const supportsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSupports(supportsData);
      setLoading(false);
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSupports();
      }
    });
  }, [auth, db]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateDoc(doc(db, 'support', id), { status });
      setSupports(supports.map(support => support.id === id ? { ...support, status } : support));
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>Gestionar Soportes</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha y Hora</TableCell>
              <TableCell>Nombres</TableCell>
              <TableCell>Apellidos</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Motivo</TableCell>
              <TableCell>Mensaje</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : supports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">No se encontraron solicitudes de soporte</TableCell>
              </TableRow>
            ) : (
              supports.map(support => (
                <TableRow key={support.id}>
                  <TableCell>{new Date(support.timestamp.seconds * 1000).toLocaleString()}</TableCell>
                  <TableCell>{support.firstName}</TableCell>
                  <TableCell>{support.lastName}</TableCell>
                  <TableCell>{support.email}</TableCell>
                  <TableCell>{support.phone}</TableCell>
                  <TableCell>{support.reason}</TableCell>
                  <TableCell>{support.message}</TableCell>
                  <TableCell>
                    <Select
                      value={support.status || 'No Resuelto'}
                      onChange={(e) => handleStatusChange(support.id, e.target.value)}
                      size="small"
                    >
                      <MenuItem value="Resuelto">Resuelto</MenuItem>
                      <MenuItem value="No Resuelto">No Resuelto</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small" 
                      onClick={() => handleStatusChange(support.id, 'Resuelto')}
                    >
                      Marcar como Resuelto
                    </Button>
                    <Button 
                      variant="contained" 
                      color="secondary" 
                      size="small" 
                      onClick={() => handleStatusChange(support.id, 'No Resuelto')}
                    >
                      Marcar como No Resuelto
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default SupportRequests;