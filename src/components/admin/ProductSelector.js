import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, Button, Grid, Avatar, Box, Typography } from '@mui/material';
import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { convertGoogleDriveUrl } from '../../utils/googleDriveUtils';

function ProductSelector({ onAddProduct }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      const db = getFirestore();
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productsData = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        // Convert all image urls
        const imageUrls = (data.imageUrls || []).map(url => convertGoogleDriveUrl(url));
        productsData.push({ id: doc.id, ...data, imageUrls });
      });
      setProducts(productsData);
    };
    fetchProducts();
  }, []);

  const handleAdd = () => {
    if (!selectedProduct || !quantity || quantity < 1) return;
    onAddProduct({
      ...selectedProduct,
      quantity: parseInt(quantity, 10),
      addedAt: new Date().toISOString(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      price: selectedProduct.price,
      imageUrls: selectedProduct.imageUrls || [],
    });
    setSelectedProduct(null);
    setQuantity(1);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={7} sx={{ width: { xs: '100%', sm: '80%' } }}>
          <Autocomplete
            options={products}
            value={selectedProduct}
            onChange={(e, value) => setSelectedProduct(value)}
            getOptionLabel={(option) => option.name || ''}
            renderOption={(props, option) => (
              <li {...props}>
                <Avatar src={option.imageUrls?.[0]} sx={{ width: 30, height: 30, mr: 1 }} />
                {option.id} · {option.name} · {option.description} · $ {option.price.toFixed(2)}
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Producto" />}
            isOptionEqualToValue={(option, value) => option.id === value.id}
          />
        </Grid>
        <Grid item xs={6} sm={2} sx={{ width: { xs: '100%', sm: '6%' } }}>
          <TextField
            label="Cant."
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            inputProps={{ min: 1 }}
            fullWidth
          />
        </Grid>
        <Grid item xs={6} sm={3} sx={{ width: { xs: '100%', sm: '11%' } }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAdd}
            disabled={!selectedProduct || quantity < 1}
            fullWidth
          >
            Agregar
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ProductSelector;