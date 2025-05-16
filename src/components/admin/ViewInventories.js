import React, { useState } from 'react';
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
} from '@mui/material';
import { getFirestore, doc, updateDoc, collection, getDocs } from 'firebase/firestore';

function ViewInventories({ savedInventories, onSelectInventory }) {
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editedStock, setEditedStock] = useState('');
  const db = getFirestore();

  const handleViewDetails = async (inventoryId) => {
    const productsRef = collection(db, `inventory-records/${inventoryId}/products`);
    const snapshot = await getDocs(productsRef);
    const productsData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setSelectedInventory(inventoryId);
    setProducts(productsData);
  };

  const handleCloseDetails = () => {
    setSelectedInventory(null);
    setProducts([]);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditedStock(product.adjustedStock || '');
  };

  const handleSaveProduct = async () => {
    try {
      const productRef = doc(db, `inventory-records/${selectedInventory}/products`, editingProduct.id);
      await updateDoc(productRef, {
        adjustedStock: parseInt(editedStock, 10),
        difference: parseInt(editedStock, 10) - editingProduct.currentStock,
      });

      // Actualizar la lista local de productos
      const updatedProducts = products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              adjustedStock: parseInt(editedStock, 10),
              difference: parseInt(editedStock, 10) - p.currentStock,
            }
          : p
      );
      setProducts(updatedProducts);

      alert('¡Stock Físico actualizado con éxito!');
    } catch (error) {
      console.error('Error al guardar los cambios del producto:', error);
      alert('Error al guardar los cambios del producto');
    }
    setEditingProduct(null);
    setEditedStock('');
  };

  const handleAdjustStockInProducts = async () => {
    try {
      const updatePromises = products.map(async (product) => {
        const productRef = doc(db, 'products', product.productId);
        return updateDoc(productRef, {
          stock: product.adjustedStock,
        });
      });

      await Promise.all(updatePromises);

      alert('¡Stock ajustado con éxito!');
      handleCloseDetails();
    } catch (error) {
      console.error('Error al ajustar el stock en la colección products:', error);
      alert('Error al ajustar el stock en la colección products');
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Productos Totales</TableCell>
              <TableCell>Estado de Verificación</TableCell>
              <TableCell>Diferencia Total ($)</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {savedInventories.map((inventory) => {
              const createdAt = inventory.createdAt
                ? new Date(inventory.createdAt).toLocaleString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Fecha no disponible';

              const verificationStatus =
                inventory.productsCount > 0 ? 'Verificado' : 'Sin verificar';

              return (
                <TableRow key={inventory.id}>
                  <TableCell>{createdAt}</TableCell>
                  <TableCell>{inventory.productsCount}</TableCell>
                  <TableCell>{verificationStatus}</TableCell>
                  <TableCell>${inventory.totalPriceDifference?.toFixed(2)}</TableCell>
                  <TableCell>{inventory.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleViewDetails(inventory.id)}
                    >
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal para Detalles del Inventario */}
      {selectedInventory && (
        <Dialog open={Boolean(selectedInventory)} onClose={handleCloseDetails} fullWidth maxWidth="lg">
          <DialogTitle>Detalles del Inventario</DialogTitle>
          <DialogContent>
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
            <Button onClick={handleCloseDetails}>Cerrar</Button>
            <Button variant="contained" color="primary" onClick={handleAdjustStockInProducts}>
              Ajustar Stock
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Modal para Editar Producto */}
      {editingProduct && (
        <Dialog open={Boolean(editingProduct)} onClose={() => setEditingProduct(null)} fullWidth>
          <DialogTitle>Modificar Stock Físico</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Stock Físico"
              type="number"
              value={editedStock}
              onChange={(e) => setEditedStock(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingProduct(null)}>Cancelar</Button>
            <Button variant="contained" color="primary" onClick={handleSaveProduct}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export default ViewInventories;