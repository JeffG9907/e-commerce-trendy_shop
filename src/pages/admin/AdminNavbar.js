import React, { useState } from 'react';
import { 
  AppBar, Toolbar, Button, Box, IconButton, Drawer, 
  List, ListItem, ListItemText, useTheme, useMediaQuery 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { getAuth } from 'firebase/auth';
import logo from '../../assets/SHOP.png';
import '../../styles/AdminNavbar.css';
import AssessmentIcon from '@mui/icons-material/Assessment'; // Add this import
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Menu, MenuItem } from '@mui/material';

function AdminNavbar() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };
  const auth = getAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('userRole');
      sessionStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const [configAnchorEl, setConfigAnchorEl] = useState(null);

  const handleConfigClick = (event) => {
    setConfigAnchorEl(event.currentTarget);
  };

  const handleConfigClose = () => {
    setConfigAnchorEl(null);
  };

  const handleConfigNavigation = (path) => {
    handleConfigClose();
    navigate(path);
  };

  const navItems = [
    { text: 'Categorías', path: '/admin/categories' },
    { text: 'Productos', path: '/admin/products' },
    { text: 'Usuarios', path: '/admin/users' },
    { text: 'Órdenes', path: '/admin/orders' },
    { text: 'Reportes', path: '/admin/reports' },
    { text: 'Soporte', path: '/admin/support' },
    { 
      text: 'Configuración',
      hasSubmenu: true,
      onClick: handleConfigClick
    }
  ];

  const configMenuItems = [
    { text: 'Empresa', path: '/admin/company' },
    { text: 'Métodos de Pago', path: '/admin/payment-methods' }
  ];

  // Modify the drawer content
  const drawer = (
    <List>
      {navItems.map((item) => (
        <ListItem 
          key={item.text}
          component="div"
          onClick={item.hasSubmenu ? item.onClick : () => handleNavigation(item.path)}
          sx={{ textAlign: 'center', cursor: 'pointer' }}
        >
          <ListItemText primary={item.text} />
          {item.hasSubmenu && <ExpandMoreIcon />}
        </ListItem>
      ))}
      <ListItem 
        component="div"
        onClick={handleLogout}
        sx={{ textAlign: 'center', color: 'error.main', cursor: 'pointer' }}
      >
        <ListItemText primary="Cerrar Sesión" />
      </ListItem>
    </List>
  );

  return (
    <AppBar position="static" className="admin-navbar">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box className="logo-container" sx={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Logo" className="admin-logo" />
        </Box>

        {isMobile ? (
          <>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            <Drawer
              variant="temporary"
              anchor="right"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true // Better open performance on mobile.
              }}
            >
              {drawer}
            </Drawer>
          </>
        ) : (
          <Box className="nav-buttons" sx={{ display: 'flex', gap: 1 }}>
            {navItems.map((item) => (
              <Button 
                key={item.text}
                color="inherit" 
                onClick={item.hasSubmenu ? item.onClick : () => handleNavigation(item.path)}
                className="nav-button"
                endIcon={item.hasSubmenu ? <ExpandMoreIcon /> : null}
              >
                {item.text}
              </Button>
            ))}
            <Button 
              color="inherit" 
              onClick={handleLogout}
              className="exit-button nav-button"
              startIcon={<LogoutIcon />}
            >
              Cerrar Sesión
            </Button>
          </Box>
        )}
        
        <Menu
          anchorEl={configAnchorEl}
          open={Boolean(configAnchorEl)}
          onClose={handleConfigClose}
        >
          {configMenuItems.map((item) => (
            <MenuItem 
              key={item.text} 
              onClick={() => handleConfigNavigation(item.path)}
            >
              {item.text}
            </MenuItem>
          ))}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}

export default AdminNavbar;