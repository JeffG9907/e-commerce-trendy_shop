import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Box, Button, Grid, Paper,
  CircularProgress, IconButton
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Slider from 'react-slick';
import { convertGoogleDriveUrl } from '../utils/googleDriveUtils';
import '../styles/ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Container>
        <Typography variant="h5" sx={{ mt: 4, textAlign: 'center' }}>
          Producto no encontrado
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <IconButton 
        onClick={() => navigate(-1)} 
        className="back-button"
        sx={{ mb: 2 }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} className="image-container">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <Slider {...sliderSettings}>
                {product.imageUrls.map((url, index) => (
                  <div key={index} className="slider-image-wrapper">
                    <img
                      src={convertGoogleDriveUrl(url)}
                      alt={`${product.name} ${index + 1}`}
                      className="product-detail-image"
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <img
                src="/placeholder-image.jpg"
                alt="No image available"
                className="product-detail-image"
              />
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box className="product-info">
            <Typography variant="h4" component="h1" className="product-title">
              {product.name}
            </Typography>
            
            <Typography variant="h5" color="primary" className="product-price">
              ${product.price?.toFixed(2)}
            </Typography>

            <Typography variant="body1" className="product-description">
              {product.description}
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" className="stock-status">
                {product.stock > 0 ? (
                  <span className="in-stock">En Stock ({product.stock} disponibles)</span>
                ) : (
                  <span className="out-of-stock">Agotado</span>
                )}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddShoppingCartIcon />}
              className="add-to-cart-button"
              disabled={product.stock === 0 || product.status === "PRÓXIMAMENTE"}
              fullWidth
              sx={{ mt: 4 }}
            >
              Agregar al Carrito
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default ProductDetail;