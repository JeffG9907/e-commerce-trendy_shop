import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Card, CardContent, CardMedia, Typography, Button, 
  CardActions, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Snackbar, Alert
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import { useNavigate } from 'react-router-dom';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  query,
  where,
  updateDoc,
  doc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { convertGoogleDriveUrl } from '../utils/googleDriveUtils';    
import '../styles/CategoryFilter.css';

const CategoryNextArrow = (props) => {
  const { onClick } = props;
  return (
    <div className="slick-arrow category-next" onClick={onClick}>
      <span>&gt;</span>
    </div>
  );
};

const CategoryPrevArrow = (props) => {
  const { onClick } = props;
  return (
    <div className="slick-arrow category-prev" onClick={onClick}>
      <span>&lt;</span>
    </div>
  );
};

const categorySliderSettings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 4,
  slidesToScroll: 1,
  nextArrow: <CategoryNextArrow />,
  prevArrow: <CategoryPrevArrow />,
  responsive: [
    { breakpoint: 1024, settings: { slidesToShow: 3, slidesToScroll: 1 } },
    { breakpoint: 768, settings: { slidesToShow: 2, slidesToScroll: 1 } },
    { breakpoint: 480, settings: { slidesToShow: 1, slidesToScroll: 1 } }
  ]
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  const fetchCategories = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, [db]);

  const fetchProducts = useCallback(async () => {
    try {
      let productsQuery;

      if (selectedCategory && selectedCategory !== 'all') {
        productsQuery = query(
          collection(db, 'products'),
          where('categoryId', '==', selectedCategory)
        );
      } else {
        productsQuery = collection(db, 'products');
      }

      const querySnapshot = await getDocs(productsQuery);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [db, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = (product) => {
    if (!product) {
      console.error('No product provided');
      return;
    }
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      setOpenLoginDialog(true);
      return;
    }
    setSelectedProduct(product);
    setQuantity(1);
    setOpenDialog(true);
  };

  const handleConfirmAdd = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setOpenLoginDialog(true);
        return;
      }

      if (!selectedProduct) {
        console.error('No product selected');
        return;
      }

      const cartRef = collection(db, 'carts');
      const q = query(
        cartRef,
        where('userId', '==', user.uid),
        where('productId', '==', selectedProduct.id)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const existingCartItem = querySnapshot.docs[0];
        const currentQuantity = existingCartItem.data().quantity;
        const newQuantity = currentQuantity + quantity;
        
        if (newQuantity > selectedProduct.stock) {
          alert(`No se puede agregar esa cantidad. Stock disponible: ${selectedProduct.stock}`);
          return;
        }

        await updateDoc(doc(db, 'carts', existingCartItem.id), {
          quantity: newQuantity
        });
      } else {
        await addDoc(cartRef, {
          userId: user.uid,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          price: selectedProduct.price,
          quantity: quantity,
          imageUrls: selectedProduct.imageUrls || [],
          addedAt: new Date().toISOString()
        });
      }

      setOpenDialog(false);
      setQuantity(1);
      setSelectedProduct(null);
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const handleQuantityChange = (e) => {
    const inputQuantity = Math.max(1, parseInt(e.target.value) || 1);

    if (inputQuantity > selectedProduct?.stock) {
      alert(
        `La cantidad ingresada supera el stock disponible (${selectedProduct.stock}).`
      );
      setQuantity(selectedProduct.stock);
    } else {
      setQuantity(inputQuantity);
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleLoginRedirect = () => {
    setOpenLoginDialog(false);
    navigate('/login');
  };

  const productSliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
    adaptiveHeight: true,
    lazyLoad: 'ondemand',
    swipeToSlide: true,
    fade: true
  };

  return (
    <Container sx={{ py: 4 }} maxWidth="lg">
      {/* Título Categorías */}
      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        CATEGORÍAS
      </Typography>

      {/* Carrusel de Categorías */}
      <Box className="category-carousel" sx={{ mb: 5 }}>
        <Slider {...categorySliderSettings}>
          {categories.map((category) => (
            <Card 
              key={category.id} 
              className="category-card"
              onClick={() => handleCategorySelect(category.id)}
              sx={{ mx: 3, cursor: 'pointer', textAlign: 'center', boxShadow: 3 }}
            >
              <CardMedia
                component="img"
                className="category-image"
                image={convertGoogleDriveUrl(category.imageUrl)}
                alt={category.name}
                sx={{ height: '350px', objectFit: 'cover' }}
              />
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {category.name}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Slider>
      </Box>

      <Typography variant="h5" gutterBottom>
        {selectedCategory !== 'all' ? `${categories.find(c => c.id === selectedCategory)?.name || ''}` : 'Todos los productos'}
      </Typography>

      <Box className="products-grid">
        {products.map((product) => (
          <Card className="product-card" key={product.id} sx={{ height: '350px' }}>
            <Box sx={{ position: 'relative', height: '200px' }}>
              {product.imageUrls && product.imageUrls.length > 0 ? (
                <Slider {...productSliderSettings}>
                  {product.imageUrls.map((url, index) => (
                    <CardMedia
                      key={index}
                      component="img"
                      className="product-image"
                      image={convertGoogleDriveUrl(url)}
                      alt={`${product.name} ${index + 1}`}
                      sx={{ 
                        height: '100%',
                        width: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#f5f5f5'
                      }}
                      onClick={() => handleViewDetails(product.id)}
                    />
                  ))}
                </Slider>
              ) : (
                <CardMedia
                  component="img"
                  className="product-image"
                  image="/placeholder-image.jpg"
                  alt="No image available"
                  sx={{ 
                    height: '100%',
                    width: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#f5f5f5'
                  }}
                  onClick={() => handleViewDetails(product.id)}
                />
              )}
              {/* Display AGOTADO badge */}
              {product.stock === 0 && (
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
                    zIndex: 1
                  }}
                >
                  <Typography variant="h6" color="white" fontWeight="bold">
                    AGOTADO
                  </Typography>
                </Box>
              )}
              {/* Display PRÓXIMAMENTE badge */}
              {product.status === "PRÓXIMAMENTE" && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1
                  }}
                >
                  <Typography variant="h6" color="white" fontWeight="bold">
                    PRÓXIMAMENTE
                  </Typography>
                </Box>
              )}
            </Box>
            <CardContent className="product-content">
              <Typography sx={{ fontSize: '0.80rem', fontWeight: 'bold' }} >{product.name}</Typography>
              <Typography sx={{ fontSize: '0.75rem', lineHeight: 1, mt: 0.5 }}>{product.description}</Typography>
              <Typography sx={{ fontSize: '0.75rem', lineHeight: 1, mt: 0.5 }}>${product.price.toFixed(2)}</Typography>
            </CardContent>
            <CardActions className="product-actions">
              <Button 
                size="small" 
                className="details-button"
                onClick={() => handleViewDetails(product.id)}
              >
                Detalles
              </Button>
              <Button
                size="small"
                className="add-cart-button"
                startIcon={<AddShoppingCartIcon />}
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0 || product.status === "PRÓXIMAMENTE"}
              >
                Agregar
              </Button>
            </CardActions>
          </Card>
        ))}
      </Box>

      {/* Dialogo para login */}
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Agregar al Carrito</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {selectedProduct?.name}
          </Typography>
          <Typography gutterBottom color="primary">
            ${selectedProduct?.price?.toFixed(2)}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Cantidad"
            type="number"
            fullWidth
            value={quantity}
            onChange={handleQuantityChange}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleConfirmAdd} variant="contained" color="primary">
            Agregar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Producto agregado al carrito exitosamente
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Products;