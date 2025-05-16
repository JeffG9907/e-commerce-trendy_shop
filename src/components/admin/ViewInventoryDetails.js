import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Box,
  TextField,
} from '@mui/material';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

function ViewInventoryDetails({ inventoryId, onBack }) {
  const [inventoryDetails, setInventoryDetails] = useState([]);
  const [inventoryInfo, setInventoryInfo] = useState({});
  const [adjustedStock, setAdjustedStock] = useState({});
  const db = getFirestore();

  // Cargar los detalles generales del inventario y los productos asociados
  useEffect(() => {
    const fetchInventoryDetails = async () => {
      try {
        // Obtener datos generales del inventario
        const inventoryDocRef = doc(db, 'inventory-records', inventoryId);
        const inventoryDoc = await getDoc(inventoryDocRef);

        if (inventoryDoc.exists()) {
          setInventoryInfo({
            id: inventoryDoc.id,
            ...inventoryDoc.data(),
          });
        } else {
          console.error('El inventario no existe.');
          return;
        }

        // Obtener productos asociados al inventario
        const productsRef = collection(db, `inventory-records/${inventoryId}/products`);
        const snapshot = await getDocs(productsRef);

        if (!snapshot.empty) {
          const productsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // Inicializar los valores de stock ajustado
          const initialAdjustedStock = {};
          productsData.forEach((product) => {
            initialAdjustedStock[product.productId] = product.adjustedStock || 0;
          });

          setInventoryDetails(productsData);
          setAdjustedStock(initialAdjustedStock);
        } else {
          console.warn('No se encontraron productos asociados a este inventario.');
          setInventoryDetails([]);
        }
      } catch (error) {
        console.error('Error al cargar los detalles del inventario:', error);
      }
    };

    fetchInventoryDetails();
  }, [inventoryId, db]);

  const handleStockChange = (productId, value) => {
    setAdjustedStock((prev) => ({
      ...prev,
      [productId]: parseInt(value, 10) || 0, // Asegurarse de que es un número
    }));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Detalles del Inventario
      </Typography>

      {/* Mostrar detalles generales del inventario */}
      <Box sx={{ mb: 4, p: 2, border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
        <Typography variant="body1"><strong>ID:</strong> {inventoryInfo.id}</Typography>
        <Typography variant="body1"><strong>Nombre:</strong> {inventoryInfo.name}</Typography>
        <Typography variant="body1"><strong>Productos Totales:</strong> {inventoryInfo.productsCount}</Typography>
        <Typography variant="body1"><strong>Estatus:</strong> {inventoryInfo.status}</Typography>
        <Typography variant="body1"><strong>Diferencia Total:</strong> {inventoryInfo.totalDifference}</Typography>
        <Typography variant="body1"><strong>Diferencia Total ($):</strong> ${inventoryInfo.totalPriceDifference?.toFixed(2)}</Typography>
        <Typography variant="body1"><strong>Usuario:</strong> {inventoryInfo.userEmail}</Typography>
      </Box>

      {/* Tabla de productos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Producto ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Stock Sistema</TableCell>
              <TableCell>Stock Físico</TableCell>
              <TableCell>Diferencia</TableCell>
              <TableCell>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inventoryDetails.length > 0 ? (
              inventoryDetails.map((product) => {
                const difference = adjustedStock[product.productId] - product.currentStock;

                return (
                  <TableRow key={product.id}>
                    <TableCell>{product.productId}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.currentStock}</TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        size="small"
                        value={adjustedStock[product.productId] || ''}
                        onChange={(e) => handleStockChange(product.productId, e.target.value)}
                      />
                    </TableCell>
                    <TableCell
                      style={{
                        color: difference !== 0 ? (difference > 0 ? 'green' : 'red') : 'inherit',
                      }}
                    >
                      {difference}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No hay productos asociados a este inventario.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={onBack}>
          Regresar
        </Button>
      </Box>
    </Box>
  );
}

export default ViewInventoryDetails;