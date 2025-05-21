import React, { useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  TextField, Button, Checkbox
} from '@mui/material';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const CreateInventory = ({ products, db, onInventoryCreated }) => {
  const [verifiedProducts, setVerifiedProducts] = useState({});
  const [physicalCounts, setPhysicalCounts] = useState({});
  const [differences, setDifferences] = useState({});
  const [createdInventoryInfo, setCreatedInventoryInfo] = useState(null);

  const user = getAuth().currentUser;

  // Información del "inventario a crear"
  const inventoryName = `Inventario ${new Date().toLocaleDateString()}`;
  const inventoryDate = new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const userEmail = user ? user.email : '';

  const getProductPrice = (product) => {
    if (typeof product.price === 'number') return product.price;
    if (typeof product.price === 'string' && !isNaN(product.price)) return parseFloat(product.price);
    return 0;
  };

  const handlePhysicalCountChange = (productId, value) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0) return;

    setPhysicalCounts(prev => ({
      ...prev,
      [productId]: numValue
    }));

    const product = products.find(p => p.id === productId);
    const systemCount = product?.stock || 0;
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

  const saveInventory = async () => {
    try {
      const hasVerifiedProducts = Object.values(verifiedProducts).some(value => value);
      if (!hasVerifiedProducts) {
        alert('Debe verificar al menos un producto');
        return;
      }

      const verifiedProductsCount = Object.values(verifiedProducts).filter(v => v).length;
      const totalDifference = Object.values(differences).reduce((sum, diff) => sum + diff, 0);
      const totalPriceDifference = products.reduce((sum, product) => {
        const diff = differences[product.id] || 0;
        const price = getProductPrice(product);
        return sum + diff * price;
      }, 0);

      const inventoryRef = collection(db, 'inventory-records');
      const inventoryDoc = await addDoc(inventoryRef, {
        createdAt: serverTimestamp(),
        status: 'active',
        name: inventoryName,
        totalProducts: verifiedProductsCount,
        totalDifference,
        totalPriceDifference,
        verifiedProducts: verifiedProductsCount,
        userId: user ? user.uid : null,
        userEmail: userEmail,
      });

      const productsRef = collection(db, `inventory-records/${inventoryDoc.id}/products`);

      for (const product of products) {
        if (verifiedProducts[product.id]) {
          await setDoc(doc(productsRef, product.id), {
            productId: product.id,
            name: product.name,
            currentStock: product.stock,
            adjustedStock: physicalCounts[product.id] ?? product.stock,
            difference: differences[product.id] ?? 0,
            price: getProductPrice(product),
            priceDifference: (differences[product.id] ?? 0) * getProductPrice(product),
            updatedAt: serverTimestamp()
          });
        }
      }

      // Muestra los detalles del inventario recién creado
      setCreatedInventoryInfo({
        id: inventoryDoc.id,
        name: inventoryName,
        userEmail: userEmail,
      });

      alert('Inventario guardado exitosamente');
      onInventoryCreated && onInventoryCreated();
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Error al guardar el inventario');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Crear Nuevo Inventario</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={saveInventory}
          disabled={!Object.values(verifiedProducts).some(v => v)}
        >
          Guardar Inventario
        </Button>
      </Box>

      {/* Detalles del inventario a crear */}
      <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h6" gutterBottom><strong>DETALLES DE INVENTARIO</strong></Typography>
        <Typography variant="body1"><strong>Nombre:</strong> {inventoryName}</Typography>
        <Typography variant="body1"><strong>Fecha:</strong> {inventoryDate}</Typography>
        <Typography variant="body1"><strong>Usuario:</strong> {userEmail}</Typography>
      </Box>

      {/* Detalles del inventario recién creado */}
      {createdInventoryInfo && (
        <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2, backgroundColor: '#e0f7fa' }}>
          <Typography variant="body1"><strong>ID:</strong> {createdInventoryInfo.id}</Typography>
          <Typography variant="body1"><strong>Nombre:</strong> {createdInventoryInfo.name}</Typography>
          <Typography variant="body1"><strong>Usuario:</strong> {createdInventoryInfo.userEmail}</Typography>
        </Box>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell align="right">Stock Sistema</TableCell>
              <TableCell align="right">Stock Físico</TableCell>
              <TableCell align="right">Diferencia</TableCell>
              <TableCell align="right">Diferencia ($)</TableCell>
              <TableCell>Verificar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => {
              const physicalCount = physicalCounts[product.id] ?? '';
              const systemCount = product?.stock ?? 0;
              const difference = physicalCount === '' ? 0 : (parseInt(physicalCount) - systemCount);
              const productPrice = getProductPrice(product);
              const priceDifference = difference * productPrice;

              return (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">{systemCount}</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      value={physicalCount}
                      onChange={(e) => handlePhysicalCountChange(product.id, e.target.value)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: difference < 0 ? 'error.main' :
                        difference > 0 ? 'success.main' : 'inherit'
                    }}
                  >
                    {physicalCount === '' ? '' : difference}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: priceDifference < 0 ? 'error.main' :
                        priceDifference > 0 ? 'success.main' : 'inherit',
                      fontWeight: 'bold'
                    }}
                  >
                    {physicalCount === '' ? '' : `$${priceDifference.toFixed(2)}`}
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={verifiedProducts[product.id] || false}
                      onChange={(e) => handleVerifyProduct(product.id, e.target.checked)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CreateInventory;