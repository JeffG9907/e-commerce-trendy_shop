import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Box, 
  TextField, 
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardMedia,
  CardActions
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Menu as MenuIcon, Search as SearchIcon, ShoppingCart as ShoppingCartIcon, AccountCircle as AccountCircleIcon, Home as HomeIcon, ListAlt as ListAltIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import logo from '../assets/SHOP.png';
import '../styles/Navbar.css';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { convertGoogleDriveUrl } from '../utils/googleDriveUtils';

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

function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(auth.currentUser);
  const [isFullPageSearch, setIsFullPageSearch] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    // Add scroll lock when search is active
    if (isFullPageSearch) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      unsubscribe();
      // Reset scroll when component unmounts
      document.body.style.overflow = 'auto';
    };
  }, [isFullPageSearch]);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsDrawerOpen(open);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleClose();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = async (event) => {
    const value = event.target.value;
    setSearchTerm(value);
  
    if (value.length > 0) {
      try {
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        const results = [];
        
        querySnapshot.forEach((doc) => {
          const product = doc.data();
          if (product.name.toLowerCase().includes(value.toLowerCase())) {
            results.push({
              id: doc.id,
              ...product
            });
          }
        });
        
        setSearchResults(results);
        setIsFullPageSearch(true);
      } catch (error) {
        console.error('Error searching products:', error);
      }
    } else {
      setSearchResults([]);
      setIsFullPageSearch(false);
    }
  };

  const handleProductClick = (productId) => {
    setSearchTerm('');
    setIsFullPageSearch(false);
    navigate(`/product/${productId}`);
  };

  const handleNavigation = () => {
    setIsDrawerOpen(false);
    setSearchTerm('');
    setIsFullPageSearch(false);
  };

  // Add after handleNavigation function and before the return statement
  const handleAddToCart = (product) => {
    // Implement your add to cart logic here
    console.log('Adding to cart:', product);
  };
  
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            aria-label="menu" 
            onClick={toggleDrawer(true)} 
            sx={{ display: { xs: 'block', sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box className="navbar-brand">
            <Link to="/" onClick={handleNavigation}>
              <img src={logo} alt="Shop Logo" class="navbar-logo img-fluid" width="120" height="40"></img>
            </Link>
          </Box>
          
          <Box className="navbar-search">
            <TextField
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={handleSearch}
              variant="outlined"
              size="small"
              className="search-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchTerm('');
                        setIsFullPageSearch(false);
                      }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
  
          <Box className="navbar-links" sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Button color="inherit" component={Link} to="/" onClick={handleNavigation}>
              Inicio
            </Button>
            <Button color="inherit" component={Link} to="/orders" onClick={handleNavigation}>
              Mis Órdenes
            </Button>
          </Box>
  
          <IconButton color="inherit" component={Link} to="/cart" aria-label="Ver carrito">
            <ShoppingCartIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={handleMenu} aria-label={user ? "Abrir menú de usuario" : "Abrir menú de acceso"}>
            {user ? (
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </Avatar>
            ) : (
              <AccountCircleIcon />
            )}
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {user ? (
              [
                <MenuItem 
                  key="profile" 
                  component={Link} 
                  to="/profile" 
                  onClick={handleClose} 
                  className="navbar-menu-item"
                >
                  Perfil
                </MenuItem>,
                <MenuItem 
                  key="logout" 
                  onClick={handleLogout} 
                  className="navbar-menu-item"
                >
                  Cerrar Sesión
                </MenuItem>
              ]
            ) : (
              <MenuItem 
                key="login" 
                component={Link} 
                to="/login" 
                onClick={handleClose} 
                className="navbar-menu-item"
              >
                Iniciar Sesión
              </MenuItem>
            )}
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Drawer anchor="left" open={isDrawerOpen} onClose={toggleDrawer(false)}>
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <List>
            <ListItem button component={Link} to="/" onClick={handleNavigation}>
              <ListItemIcon>
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Inicio" />
            </ListItem>
            <ListItem button component={Link} to="/orders" onClick={handleNavigation}>
              <ListItemIcon>
                <ListAltIcon />
              </ListItemIcon>
              <ListItemText primary="Mis Órdenes" />
            </ListItem>
            <ListItem button component={Link} to="/cart" onClick={handleNavigation}>
              <ListItemIcon>
                <ShoppingCartIcon />
              </ListItemIcon>
              <ListItemText primary="Carrito" />
            </ListItem>
            {user ? (
              <>
                <ListItem button component={Link} to="/profile" onClick={handleClose}>
                  <ListItemIcon>
                    <AccountCircleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Perfil" />
                </ListItem>
                <ListItem button onClick={handleLogout}>
                  <ListItemIcon>
                    <AccountCircleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Cerrar Sesión" />
                </ListItem>
              </>
            ) : (
              <ListItem button component={Link} to="/login" onClick={handleClose}>
                <ListItemIcon>
                  <AccountCircleIcon />
                </ListItemIcon>
                <ListItemText primary="Iniciar Sesión" />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
      
      {isFullPageSearch && (
        <Box
          sx={{
            position: 'fixed',
            top: '80px',  // Changed from '70px' to move it lower
            left: 0,
            right: 0,
            height: 'calc(100vh - 80px)',  // Adjusted to match new top value
            bgcolor: '#ffffff',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            p: 3,
          }}
        >
          <Container maxWidth="lg" sx={{ 
            flex: 1,
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1'
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '4px'
            }
          }}>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(1, 1fr)', // 1 column for mobile
                sm: 'repeat(2, 1fr)', // 2 columns for tablets
                md: 'repeat(3, 1fr)', // 3 columns for small desktops
                lg: 'repeat(4, 1fr)'  // 4 columns for larger screens
              },
              gap: { xs: 2, sm: 2, md: 3 },
              width: '100%'
            }}>
              {searchResults.length === 0 ? (
                <Box sx={{ 
                  gridColumn: { 
                    xs: 'span 1',
                    sm: 'span 2',
                    md: 'span 3',
                    lg: 'span 4'
                  }, 
                  textAlign: 'center', 
                  py: 8 
                }}>
                  <SearchIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No se encontraron resultados
                  </Typography>
                </Box>
              ) : (
                searchResults.map((product) => (
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
                              onClick={() => handleProductClick(product.id)}
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
                          onClick={() => handleProductClick(product.id)}
                        />
                      )}
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
                      <Typography sx={{ fontSize: '0.80rem', fontWeight: 'bold' }}>{product.name}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', lineHeight: 1, mt: 0.5 }}>{product.description}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', lineHeight: 1, mt: 0.5 }}>${product.price?.toFixed(2)}</Typography>
                    </CardContent>
                    <CardActions className="product-actions">
                      <Button 
                        size="small" 
                        className="details-button"
                        onClick={() => handleProductClick(product.id)}
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
                ))
              )}
            </Box>
          </Container>
        </Box>
      )}
    </>
  );
}

export default Navbar;