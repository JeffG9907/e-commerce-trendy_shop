import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField,
  Checkbox, FormControlLabel, Button, Box
} from '@mui/material';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

function CreateInventory({ reportData, inventoryData, setInventoryData, verifiedProducts, setVerifiedProducts }) {
  const db = getFirestore();
  const auth = getAuth();

  const handlePhysicalCountChange = (productId, value) => {
    const numValue = parseInt(value, 10) || 0;
    setInventoryData(prev => ({
      ...prev,
      [productId]: numValue
    }));
  };

  const handleVerifyProduct = (productId, checked) => {
    setVerifiedProducts(prev => ({
      ...prev,
      [productId]: checked
    }));
  };

  const calculateDifference = (systemStock, physicalStock) => {
    return (physicalStock || 0) - (systemStock || 0);
  };

  const calculatePriceDifference = (difference, price) => {
    return (difference * (price || 0)).toFixed(2);
  };

  const handleSaveInventory = async () => {
    try {
      const currentUser = auth.currentUser;
      const inventoryId = doc(collection(db, 'inventory-records')).id; // Genera un ID único para el inventario

      // Datos del inventario principal
      const inventoryDocData = {
        id: inventoryId,
        createdAt: serverTimestamp(),
        status: 'active',
        name: `Inventario ${new Date().toLocaleDateString()}`,
        userId: currentUser?.uid || 'unknown',
        userEmail: currentUser?.email || 'unknown',
        productsCount: Object.keys(verifiedProducts).filter(key => verifiedProducts[key]).length,
        totalDifference: reportData.reduce((acc, product) => {
          if (verifiedProducts[product.id]) {
            const difference = calculateDifference(product.stock, inventoryData[product.id]);
            return acc + difference;
          }
          return acc;
        }, 0),
        totalPriceDifference: reportData.reduce((acc, product) => {
          if (verifiedProducts[product.id]) {
            const difference = calculateDifference(product.stock, inventoryData[product.id]);
            const priceDifference = parseFloat(calculatePriceDifference(difference, product.price));
            return acc + priceDifference;
          }
          return acc;
        }, 0)
      };

      // Guarda el inventario principal
      await setDoc(doc(db, 'inventory-records', inventoryId), inventoryDocData);

      // Guarda los detalles de cada producto en una subcolección
      const productsRef = collection(db, `inventory-records/${inventoryId}/products`);
      const savePromises = reportData.map(async (product) => {
        if (verifiedProducts[product.id]) {
          const difference = calculateDifference(product.stock, inventoryData[product.id]);
          const priceDifference = calculatePriceDifference(difference, product.price);

          const productData = {
            inventoryId: inventoryId,
            productId: product.id,
            name: product.name,
            currentStock: product.stock,
            adjustedStock: inventoryData[product.id] || 0,
            difference: difference,
            priceDifference: parseFloat(priceDifference),
            price: product.price,
            verified: true,
            updatedAt: serverTimestamp()
          };

          await setDoc(doc(productsRef, product.id), productData);
        }
      });

      await Promise.all(savePromises);

      // Confirmación y limpieza
      alert('Inventario guardado exitosamente');
      setInventoryData({});
      setVerifiedProducts({});
    } catch (error) {
      console.error('Error al guardar el inventario:', error);
      alert('Error al guardar el inventario. Verifique la consola para más detalles.');
    }
  };

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Código</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Stock Sistema</TableCell>
              <TableCell align="right">Stock Físico</TableCell>
              <TableCell align="right">Diferencia</TableCell>
              <TableCell align="right">Diferencia ($)</TableCell>
              <TableCell align="center">Verificado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.map((product) => {
              const difference = calculateDifference(product.stock, inventoryData[product.id]);
              const priceDifference = calculatePriceDifference(difference, product.price);
              
              return (
                <TableRow key={product.id}>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell align="right">{product.stock || 0}</TableCell>
                  <TableCell align="right">
                    <TextField
                      type="number"
                      size="small"
                      value={inventoryData[product.id] || ''}
                      onChange={(e) => handlePhysicalCountChange(product.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell 
                    align="right"
                    style={{ 
                      color: difference !== 0 ? (difference > 0 ? 'green' : 'red') : 'inherit'
                    }}
                  >
                    {difference}
                  </TableCell>
                  <TableCell 
                    align="right"
                    style={{ 
                      color: priceDifference !== '0.00' ? (parseFloat(priceDifference) > 0 ? 'green' : 'red') : 'inherit'
                    }}
                  >
                    ${priceDifference}
                  </TableCell>
                  <TableCell align="center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={verifiedProducts[product.id] || false}
                          onChange={(e) => handleVerifyProduct(product.id, e.target.checked)}
                        />
                      }
                      label=""
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveInventory}
          disabled={Object.keys(verifiedProducts).length === 0}
        >
          Guardar Inventario
        </Button>
      </Box>
    </>
  );
}

export default CreateInventory;