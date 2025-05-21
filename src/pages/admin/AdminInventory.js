import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import CreateInventory from '../../components/admin/CreateInventory';
import ViewInventories from '../../components/admin/ViewInventories';
import ViewInventoryDetails from '../../components/admin/ViewInventoryDetails';

function AdminInventory() {
  const [viewMode, setViewMode] = useState('list'); // 'list', 'create', 'detail'
  const [products, setProducts] = useState([]);
  const [inventories, setInventories] = useState([]);     // <-- NUEVO estado para inventarios
  const [selectedInventory, setSelectedInventory] = useState(null);
  const db = getFirestore();

  useEffect(() => {
    fetchProducts();
    fetchInventories(); // <-- Carga inventarios al montar
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
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // NUEVA función para cargar los inventarios
  const fetchInventories = async () => {
    try {
      const inventoriesRef = collection(db, 'inventory-records');
      const q = query(inventoriesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const inventoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));
      setInventories(inventoriesData);
    } catch (error) {
      console.error('Error fetching inventories:', error);
    }
  };

  const handleInventoryCreated = () => {
    setViewMode('list');
    fetchInventories(); // <-- Refresca la lista al crear uno nuevo
  };

  const handleInventorySelected = (inventory) => {
    setSelectedInventory(inventory);
    setViewMode('detail');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gestión de Inventario
        </Typography>
        <Box>
          {viewMode !== 'create' ? (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setViewMode('create')}
              sx={{ mr: 2 }}
            >
              Crear Inventario
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={() => setViewMode('list')}
              sx={{ mr: 2 }}
            >
              Volver a Lista
            </Button>
          )}
        </Box>
      </Box>

      {viewMode === 'create' && (
        <CreateInventory 
          products={products}
          db={db}
          onInventoryCreated={handleInventoryCreated}
        />
      )}

      {viewMode === 'list' && (
        <ViewInventories
          inventories={inventories}               // <--- PASA LA LISTA DE INVENTARIOS
          onInventorySelect={handleInventorySelected}
        />
      )}

      {viewMode === 'detail' && selectedInventory && (
        <ViewInventoryDetails
          inventory={selectedInventory}
          onBack={() => setViewMode('list')}
        />
      )}
    </Container>
  );
}

export default AdminInventory;