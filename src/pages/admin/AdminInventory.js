import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, TextField,
  Button, Box, Checkbox, FormControlLabel, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  List, ListItem, ListItemText, Divider
} from '@mui/material';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc, query, orderBy, where } from 'firebase/firestore';
import { addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { generatePdfReport } from '../../components/PdfReportTemplate';

function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [verifiedProducts, setVerifiedProducts] = useState({});
  const [physicalCounts, setPhysicalCounts] = useState({});
  const [differences, setDifferences] = useState({});
  const [lastInventoryDate, setLastInventoryDate] = useState(null);
  const [inventoryListOpen, setInventoryListOpen] = useState(false);
  const [savedInventories, setSavedInventories] = useState([]);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    fetchProducts();
    fetchLastInventoryDate();
  }, []);

  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);

      // Initialize physical counts with current system values
      const initialCounts = {};
      productsData.forEach(product => {
        initialCounts[product.id] = product.stock || 0;
      });
      setPhysicalCounts(initialCounts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchLastInventoryDate = async () => {
    try {
      const inventoryRef = collection(db, 'inventoryHistory');
      const snapshot = await getDocs(inventoryRef);
      if (!snapshot.empty) {
        const lastInventory = snapshot.docs
          .map(doc => doc.data())
          .sort((a, b) => b.date - a.date)[0];
        setLastInventoryDate(lastInventory.date);
      }
    } catch (error) {
      console.error('Error fetching inventory history:', error);
    }
  };

  const handlePhysicalCountChange = (productId, value) => {
    const numValue = parseInt(value) || 0;
    setPhysicalCounts(prev => ({
      ...prev,
      [productId]: numValue
    }));

    // Calculate difference
    const systemCount = products.find(p => p.id === productId)?.stock || 0;
    setDifferences(prev => ({
      ...prev,
      [productId]: numValue - systemCount
    }));
  };

  const handleVerifyProduct = (productId, checked) => {
    setVerifiedProducts(prev => ({
      ...prev,
      [productId]: checked
    }));
  };

  const handleSaveInventory = async () => {
    try {
      // Update products with new counts and create inventory record
      const updates = products.map(async (product) => {
        if (verifiedProducts[product.id]) {
          const productRef = doc(db, 'products', product.id);
          const newStock = physicalCounts[product.id];
          await updateDoc(productRef, { stock: newStock });

          // Record inventory check
          const inventoryRecord = {
            productId: product.id,
            previousStock: product.stock,
            newStock: newStock,
            difference: differences[product.id],
            verifiedAt: new Date().toISOString(),
          };
          await addDoc(collection(db, 'inventoryHistory'), inventoryRecord);
        }
      });

      await Promise.all(updates);
      alert('Inventario actualizado exitosamente');
      fetchProducts();
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Error al guardar el inventario');
    }
  };

  const saveInventory = async () => {
    try {
      // First, create the main inventory document
      const inventoryRef = collection(db, 'inventory-records');
      const inventoryDoc = await addDoc(inventoryRef, {
        createdAt: serverTimestamp(),
        status: 'active',
        name: `Inventario ${new Date().toLocaleDateString()}`,
        // Add any other relevant inventory metadata
      });

      // Then save each product inventory record
      const productsRef = collection(db, `inventory-records/${inventoryDoc.id}/products`);
      
      for (const product of products) {
        if (verifiedProducts[product.id]) {
          await setDoc(doc(productsRef, product.id), {
            productId: product.id,
            name: product.name,
            currentStock: product.stock,
            adjustedStock: physicalCounts[product.id],
            difference: differences[product.id],
            reason: product.reason || '',
            updatedAt: serverTimestamp()
          });
        }
      }

      // Show success message
      alert('Inventario guardado exitosamente');
      
      // Optionally reset form or redirect
      // resetForm();
      // navigate('/admin/inventory-list');

    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Error al guardar el inventario');
    }
  };

  const handleOpenInventoryList = async () => {
    try {
      // Fetch saved inventories
      const inventoriesRef = collection(db, 'inventory-records');
      const q = query(inventoriesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const inventoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      setSavedInventories(inventoriesData);
      setInventoryListOpen(true);
    } catch (error) {
      console.error('Error fetching saved inventories:', error);
      alert('Error al cargar los inventarios guardados');
    }
  };

  const handleSelectInventory = async (inventoryId) => {
    try {
      // Fetch the selected inventory details
      const inventoryDoc = await getDoc(doc(db, 'inventory-records', inventoryId));
      if (!inventoryDoc.exists()) {
        alert('El inventario seleccionado no existe');
        return;
      }
      
      const inventoryData = {
        id: inventoryDoc.id,
        ...inventoryDoc.data(),
        createdAt: inventoryDoc.data().createdAt?.toDate?.() || new Date()
      };
      
      // Fetch the products in this inventory
      const productsRef = collection(db, `inventory-records/${inventoryId}/products`);
      const productsSnapshot = await getDocs(productsRef);
      
      const inventoryProducts = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update the UI with the selected inventory data
      setSelectedInventory({
        ...inventoryData,
        products: inventoryProducts
      });
      
      // Update physical counts with the values from this inventory
      const newCounts = {};
      const newVerified = {};
      const newDifferences = {};
      
      inventoryProducts.forEach(product => {
        newCounts[product.productId] = product.adjustedStock;
        newVerified[product.productId] = true;
        newDifferences[product.productId] = product.difference;
      });
      
      setPhysicalCounts(newCounts);
      setVerifiedProducts(newVerified);
      setDifferences(newDifferences);
      
      setInventoryListOpen(false);
    } catch (error) {
      console.error('Error loading selected inventory:', error);
      alert('Error al cargar el inventario seleccionado');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Inventario
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenInventoryList}
            sx={{ mr: 2 }}
          >
            Ver Inventarios
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={saveInventory}
          >
            Generar Inventario
          </Button>
        </Box>
      </Box>

      {selectedInventory ? (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedInventory.name} - {new Date(selectedInventory.createdAt).toLocaleDateString()}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => generatePdfReport(
                `Reporte de Inventario - ${selectedInventory.name}`,
                selectedInventory.products,
                ['Código', 'Nombre', 'Stock Sistema', 'Stock Físico', 'Diferencia']
              )}
            >
              Generar PDF
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell align="right">Stock Sistema</TableCell>
                  <TableCell align="right">Stock Físico</TableCell>
                  <TableCell align="right">Diferencia</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedInventory.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.productId}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell align="right">{product.currentStock}</TableCell>
                    <TableCell align="right">{product.adjustedStock}</TableCell>
                    <TableCell align="right">{product.difference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Código</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell align="right">Stock Sistema</TableCell>
                <TableCell align="right">Stock Físico</TableCell>
                <TableCell align="right">Diferencia</TableCell>
                <TableCell>Verificar</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">{product.stock}</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={physicalCounts[product.id] || ''}
                      onChange={(e) => handlePhysicalCountChange(product.id, e.target.value)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">{differences[product.id] || 0}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={verifiedProducts[product.id] || false}
                      onChange={(e) => handleVerifyProduct(product.id, e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={inventoryListOpen} onClose={() => setInventoryListOpen(false)}>
        <DialogTitle>Inventarios Guardados</DialogTitle>
        <List sx={{ minWidth: 300 }}>
          {savedInventories.map((inventory) => (
            <ListItem
              key={inventory.id}
              button
              onClick={() => {
                handleSelectInventory(inventory.id);
                setInventoryListOpen(false);
              }}
            >
              <ListItemText
                primary={inventory.name}
                secondary={new Date(inventory.createdAt).toLocaleDateString()}
              />
            </ListItem>
          ))}
        </List>
      </Dialog>
    </Container>
  );
}

export default AdminInventory;