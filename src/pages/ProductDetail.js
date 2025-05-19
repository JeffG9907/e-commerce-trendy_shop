import React, { useState, useEffect } from 'react';
import {
  Button, Container, Paper, Typography,
  Box, Grid, Card, CardMedia, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from '@mui/material';
import { NavigateNext, NavigateBefore } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { convertGoogleDriveUrl } from '../utils/googleDriveUtils';
import Slider from 'react-slick';
import '../styles/ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'products', id));
        if (productDoc.exists()) {
          setProduct({ id: productDoc.id, ...productDoc.data() });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      }
    };

    fetchProduct();
  }, [id, db]);

  const handleAddToCart = () => {
    if (!user) {
      alert("Por favor, inicia sesión para agregar productos al carrito.");
      return;
    }
    if (product.stock === 0) return;
    setOpenDialog(true);
  };

  const handleConfirmAdd = async () => {
    try {
      const cartItem = {
        userId: user.uid,
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: quantity,
        imageUrls: product.imageUrls,
        addedAt: new Date().toISOString()
      };

      const cartRef = collection(db, 'carts');
      await addDoc(cartRef, cartItem);
      setOpenDialog(false);
      setQuantity(1);
      alert("Producto agregado al carrito con éxito.");
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    adaptiveHeight: true,
    arrows: true,
    nextArrow: <NavigateNext style={{ color: 'black', fontSize: 40 }} />,
    prevArrow: <NavigateBefore style={{ color: 'black', fontSize: 40 }} />
  };

  if (!product) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Typography align="center" variant="h5">Cargando...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="main-container">
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          {/* Imagen del producto - Lado izquierdo */}
          <Grid item xs={12} sm={5}>
            <Box
              className="image-box"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                width: '100%',
              }}
            >
              <Card
                className="product-card"
                sx={{
                  width: '100%',
                  maxWidth: 300,
                  position: 'relative',
                  mx: 'auto',
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    width: '100%',
                    height: { xs: 100, sm: 200 }, // Ajuste de altura por pantalla
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f5f5f5', // Opcional: fondo neutro
                  }}
                >
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <Slider {...sliderSettings}>
                      {product.imageUrls.map((url, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '100%',
                          }}
                        >
                          <CardMedia
                            component="img"
                            image={convertGoogleDriveUrl(url)}
                            alt={`${product.name} ${index + 1}`}
                            sx={{
                              maxHeight: '100%',
                              maxWidth: '100%',
                              objectFit: 'contain',
                            }}
                          />
                        </Box>
                      ))}
                    </Slider>
                  ) : (
                    <CardMedia
                      component="img"
                      image="https://via.placeholder.com/300"
                      alt="No image available"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  )}
                </Box>
              </Card>
            </Box>
          </Grid>
  
          {/* Descripción del producto - Lado derecho */}
          <Grid
            item
            xs={12}
            sm={7}
            sx={{
              textAlign: { xs: 'center', sm: 'left' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', sm: 'flex-start' },
            }}
          >
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {product.name}
            </Typography>
            <Typography sx={{ fontSize: '1rem', lineHeight: 1.5, mt: 2 }}>
              {product.description}
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', color: 'gray', mt: 1 }}>
              ${product.price.toFixed(2)}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddToCart}
              sx={{ mt: 3, width: { xs: '100%', sm: 'auto' } }}
              disabled={product.stock === 0 || product.status === 'PRÓXIMAMENTE'}
            >
              {product.stock === 0 || product.status === 'PRÓXIMAMENTE'
                ? 'NO DISPONIBLE'
                : 'AGREGAR'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
  
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Agregar al Carrito</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>{product?.name}</Typography>
          <Typography gutterBottom color="primary">
            ${product?.price.toFixed(2)}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) =>
              setQuantity(Math.max(1, parseInt(e.target.value) || 1))
            }
            inputProps={{ min: 1, max: product?.stock }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleConfirmAdd}
            variant="contained"
            color="primary"
          >
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ProductDetail;