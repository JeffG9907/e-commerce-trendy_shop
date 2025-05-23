import React, { useState, useEffect } from 'react';
import {
  Button, Container, Paper, Typography,
  Box, Grid, Card, CardMedia, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from '@mui/material';
import { NavigateNext, NavigateBefore } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getFirestore, doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { convertGoogleDriveUrl } from '../utils/googleDriveUtils';
import Slider from 'react-slick';

function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [openDialog, setOpenDialog] = useState(false);
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const db = getFirestore();
  const navigate = useNavigate();

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
      setOpenLoginDialog(true);
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

  const handleLoginRedirect = () => {
    setOpenLoginDialog(false);
    navigate("/login");
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
      <Container sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <Typography variant="h5">Cargando...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 5 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, width: '100%' }}>
        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="center"
          textAlign="center"
        >
          {/* Imagen del producto */}
          <Grid item xs={12}>
            <Box sx={{ position: 'relative', mx: 'auto', maxWidth: { xs: 200, sm: 200, md: 200 } }}>
              <Card>
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <Slider {...sliderSettings}>
                    {product.imageUrls.map((url, index) => (
                      <CardMedia
                        key={index}
                        component="img"
                        image={convertGoogleDriveUrl(url)}
                        alt={`${product.name} ${index + 1}`}
                        sx={{
                          width: '100%',
                          maxWidth: 200,
                          height: 'auto',
                          maxHeight: 200,
                          objectFit: 'contain'
                        }}
                      />
                    ))}
                  </Slider>
                ) : (
                  <CardMedia
                    component="img"
                    image="https://via.placeholder.com/300"
                    alt="No image available"
                    sx={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'contain' }}
                  />
                )}
              </Card>

              {(product.stock === 0 || product.status === "PRÓXIMAMENTE") && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1,
                    borderRadius: 2
                  }}
                >
                  <Typography variant="h6" color="white" fontWeight="bold">
                    {product.stock === 0 ? "AGOTADO" : "PRÓXIMAMENTE"}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Información del producto */}
          <Grid item xs={12}>
            <Typography sx={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {product.name}
            </Typography>
            <Typography sx={{ fontSize: '1rem', mt: 2 }}>
              {product.description}
            </Typography>
            <Typography sx={{ fontSize: '1.25rem', color: 'gray', mt: 1 }}>
              ${product.price.toFixed(2)}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddToCart}
              sx={{ mt: 3 }}
              disabled={product.stock === 0 || product.status === "PRÓXIMAMENTE"}
            >
              {product.stock === 0 || product.status === "PRÓXIMAMENTE" ? "NO DISPONIBLE" : "AGREGAR"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Diálogo para login */}
      <Dialog open={openLoginDialog} onClose={() => setOpenLoginDialog(false)}>
        <DialogTitle>Necesitas iniciar sesión</DialogTitle>
        <DialogContent>
          <Typography>
            Por favor, inicia sesión para agregar productos al carrito.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoginDialog(false)}>Cancelar</Button>
          <Button onClick={handleLoginRedirect} variant="contained" color="primary">
            Iniciar sesión
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Agregar al Carrito</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>{product?.name}</Typography>
          <Typography gutterBottom color="primary">${product?.price.toFixed(2)}</Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1, max: product?.stock }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmAdd} variant="contained" color="primary">
            Agregar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default ProductDetail;