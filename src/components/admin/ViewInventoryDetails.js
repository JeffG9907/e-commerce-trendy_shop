import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import { getFirestore, doc, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';

function ViewInventoryDetails({ inventoryId, onBack, open }) {
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editedStock, setEditedStock] = useState('');
  const [inventoryInfo, setInventoryInfo] = useState({});
  const db = getFirestore();

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!inventoryId) return;
      // Carga info general inventario
      const inventoryDocRef = doc(db, 'inventory-records', inventoryId);
      const inventoryDoc = await getDoc(inventoryDocRef);
      if (inventoryDoc.exists()) {
        setInventoryInfo({
          id: inventoryDoc.id,
          ...inventoryDoc.data(),
        });
      }
      // Carga productos de ese inventario
      const productsRef = collection(db, `inventory-records/${inventoryId}/products`);
      const snapshot = await getDocs(productsRef);
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchInventoryData();
  }, [inventoryId, db]);

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditedStock(product.adjustedStock || '');
  };

  const handleSaveProduct = async () => {
    try {
      const productRef = doc(db, `inventory-records/${inventoryId}/products`, editingProduct.id);
      await updateDoc(productRef, {
        adjustedStock: parseInt(editedStock, 10),
        difference: parseInt(editedStock, 10) - editingProduct.currentStock,
      });
      // Actualizar local
      setProducts(products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              adjustedStock: parseInt(editedStock, 10),
              difference: parseInt(editedStock, 10) - p.currentStock,
            }
          : p
      ));
      setEditingProduct(null);
      setEditedStock('');
      alert('¡Stock Físico actualizado con éxito!');
    } catch (error) {
      console.error('Error al guardar los cambios del producto:', error);
      alert('Error al guardar los cambios del producto');
    }
  };

  const handleAdjustStockInProducts = async () => {
    try {
      const updatePromises = products.map(async (product) => {
        const mainProductRef = doc(db, 'products', product.productId);
        return updateDoc(mainProductRef, {
          stock: product.adjustedStock,
        });
      });
      await Promise.all(updatePromises);
      alert('¡Stock ajustado con éxito!');
      onBack && onBack();
    } catch (error) {
      console.error('Error al ajustar el stock en la colección products:', error);
      alert('Error al ajustar el stock en la colección products');
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onBack} fullWidth maxWidth="lg">
        <DialogTitle><strong>DETALLES DE INVENTARIO</strong></DialogTitle> 
        <DialogContent>
          <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2, backgroundColor: '#f9f9f9' }}>
            <Typography><strong>ID:</strong> {inventoryInfo.id}</Typography>
            <Typography><strong>Nombre:</strong> {inventoryInfo.name}</Typography>
            <Typography><strong>Productos Totales:</strong> {inventoryInfo.totalProducts}</Typography>
            <Typography><strong>Estatus:</strong> {inventoryInfo.status}</Typography>
            <Typography><strong>Diferencia Total:</strong> {inventoryInfo.totalDifference}</Typography>
            <Typography><strong>Diferencia Total ($):</strong> ${inventoryInfo.totalPriceDifference?.toFixed(2) || '0.00'}</Typography>
            <Typography><strong>Usuario:</strong> {inventoryInfo.userEmail}</Typography>
          </Box>
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
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.productId}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.currentStock}</TableCell>
                    <TableCell>{product.adjustedStock}</TableCell>
                    <TableCell
                      style={{
                        color:
                          product.difference !== 0
                            ? product.difference > 0
                              ? 'green'
                              : 'red'
                            : 'inherit',
                      }}
                    >
                      {product.difference}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleEditProduct(product)}
                        sx={{ mr: 1 }}
                      >
                        EDITAR
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={onBack}>Cerrar</Button>
          <Button variant="contained" color="primary" onClick={handleAdjustStockInProducts}>
            Ajustar Stock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal para Editar Producto */}
      {editingProduct && (
      <Dialog open={Boolean(editingProduct)} onClose={() => setEditingProduct(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 0 }}>Modificar Stock Físico</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Stock Físico"
            type="number"
            value={editedStock}
            onChange={(e) => setEditedStock(e.target.value)}
            inputProps={{ min: 0 }}
            sx={{ mt: 2 }}
            autoFocus
          />
          <div style={{ marginTop: 12, color: '#888', fontSize: 13 }}>
            Producto: <strong>{editingProduct.name}</strong><br/>
            Stock actual: <strong>{editingProduct.adjustedStock}</strong>
          </div>
        </DialogContent>
        <DialogActions sx={{ pr: 3, pb: 2 }}>
          <Button onClick={() => setEditingProduct(null)} color="inherit">
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={handleSaveProduct}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    )}
    </>
  );
}

export default ViewInventoryDetails;