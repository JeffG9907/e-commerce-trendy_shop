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
  CardMedia
} from '@mui/material';
import { Menu as MenuIcon, Search as SearchIcon, ShoppingCart as ShoppingCartIcon, AccountCircle as AccountCircleIcon, Home as HomeIcon, ListAlt as ListAltIcon } from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import logo from '../assets/SHOP.png';
import '../styles/Navbar.css';

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
    return () => unsubscribe();
  }, []);

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
              <img src={logo} alt="Shop Logo" className="navbar-logo" />
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
  
          <IconButton color="inherit" component={Link} to="/cart">
            <ShoppingCartIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={handleMenu}>
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
            top: 64,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'background.paper',
            zIndex: 1000,
            overflow: 'auto',
            p: 3
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h4" gutterBottom>
                  Resultados de búsqueda para: "{searchTerm}"
                </Typography>
              </Grid>
              {searchResults.map((product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleProductClick(product.id)}
                  >
                    <CardMedia
                      component="img"
                      sx={{ height: 200, objectFit: 'cover' }}
                      image={product.imageUrl}
                      alt={product.name}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography gutterBottom variant="h6">
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {product.description}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 2 }}>
                        ${product.price}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}
    </>
  );
}

export default Navbar;