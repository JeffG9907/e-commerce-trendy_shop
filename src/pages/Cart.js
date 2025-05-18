import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, CardMedia,
  Button, IconButton, Box, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Autocomplete
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { getFirestore, collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { sessionManager } from '../utils/sessionManager';
import { convertGoogleDriveUrl } from '../utils/googleDriveUtils'; // Importa la función
import MapboxPicker from '../components/MapboxPicker'; // Componente de mapa
import { ecuadorLocations } from '../components/EcuadorLocations'; // Importa las ubicaciones de Ecuador
import '../styles/Cart.css';
import { useNotification } from '../context/NotificationContext';

const MAPBOX_ACCESS_TOKEN = 'tu_token_de_acceso_mapbox_aquí'; // Reemplaza con tu token de acceso de Mapbox

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [userData, setUserData] = useState({
    province: '',
    canton: '',
    parroquia: '',
    postalCode: '',
    address: '',
  });
  // Remove unused orderShippingAddress state
  const [orderShippingAddress, setOrderShippingAddress] = useState({
    province: '',
    canton: '',
    parroquia: '',
    postalCode: '',
    address: '',
  }); // Estado separado para la dirección de la orden

  const [availableCantons, setAvailableCantons] = useState([]);
  const [availableParroquias, setAvailableParroquias] = useState([]);
  const [mapCoordinates, setMapCoordinates] = useState({ latitude: -0.22985, longitude: -78.52495 });
  const [zoom, setZoom] = useState(12); // Nivel de zoom inicial para el mapa

  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    sessionManager.init();
    return () => sessionManager.cleanup();
  }, []);

  const fetchUserAuthorization = useCallback(async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        setIsAuthorized(userDocSnap.data().isAuthorized);
        setUserProfile(userDocSnap.data());
      } else {
        console.warn('User document does not exist.');
      }
    } catch (error) {
      console.error('Error fetching user authorization:', error);
    }
  }, [auth.currentUser, db, navigate]);

  const fetchCartItems = useCallback(async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    try {
      const cartRef = collection(db, 'carts');
      const q = query(cartRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);

      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCartItems(items);
      calculateTotal(items);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  }, [auth.currentUser, db, navigate]);

  useEffect(() => {
    fetchUserAuthorization();
    fetchCartItems();
  }, [fetchUserAuthorization, fetchCartItems]);

  const handleProvinceChange = (event, newValue) => {
    setUserData((prev) => ({
      ...prev,
      province: newValue,
      canton: '',
      parroquia: '',
    }));

    const selectedProvince = ecuadorLocations.find((p) => p.province === newValue);
    if (selectedProvince) {
      setAvailableCantons(selectedProvince.cantons.map((c) => c.canton));
      setMapCoordinates(selectedProvince.coordinates); // Centrar el mapa en la provincia
      setZoom(9); // Ajusta el zoom para la provincia
    } else {
      setAvailableCantons([]);
      setMapCoordinates({ longitude: -78.467834, latitude: -0.180653 }); // Coordenadas de Quito por defecto
      setZoom(12); // Zoom predeterminado
    }
    setAvailableParroquias([]);
  };

  const handleCantonChange = (event, newValue) => {
    setUserData((prev) => ({
      ...prev,
      canton: newValue,
      parroquia: '',
    }));

    const selectedProvince = ecuadorLocations.find((p) => p.province === userData.province);
    if (selectedProvince) {
      const selectedCanton = selectedProvince.cantons.find((c) => c.canton === newValue);
      if (selectedCanton) {
        setAvailableParroquias(selectedCanton.parroquias.map((p) => p.parroquia));
        setMapCoordinates(selectedCanton.coordinates); // Centrar el mapa en el cantón
        setZoom(11); // Ajusta el zoom para el cantón
      } else {
        setAvailableParroquias([]);
      }
    }
  };

  const handleParroquiaChange = (event, newValue) => {
    setUserData((prev) => ({
      ...prev,
      parroquia: newValue,
    }));

    const selectedProvince = ecuadorLocations.find((p) => p.province === userData.province);
    if (selectedProvince) {
      const selectedCanton = selectedProvince.cantons.find((c) => c.canton === userData.canton);
      if (selectedCanton) {
        const selectedParroquia = selectedCanton.parroquias.find((p) => p.parroquia === newValue);
        if (selectedParroquia) {
          setMapCoordinates(selectedParroquia.coordinates); // Centrar el mapa en la parroquia
          setZoom(15); // Acercar el zoom a la parroquia
        }
      }
    }
  };

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'carts', itemId));
      const updatedItems = cartItems.filter(item => item.id !== itemId);
      setCartItems(updatedItems);
      calculateTotal(updatedItems);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleCheckout = () => {
    if (!isAuthorized) {
      alert('Usted no ha aceptado la autorización de datos personales para poder procesar su orden. Esta autorización nos permite poder realizar el envío de la orden con sus datos.');
      return;
    }
    setShowAddressDialog(true);
  };

  const handleConfirmAddress = () => {
    if (!useDefaultAddress) {
      const { province, canton, parroquia, postalCode, address } = userData;
      if (!province || !canton || !parroquia || !postalCode || !address) {
        alert('Por favor complete todos los campos de la nueva dirección.');
        return;
      }
    } else {
      // Validate if user profile has address information
      if (!userProfile?.province || !userProfile?.canton || !userProfile?.parroquia || !userProfile?.postalCode || !userProfile?.address) {
        alert('No tiene una dirección guardada en su perfil. Por favor ingrese una nueva dirección.');
        setUseDefaultAddress(false);
        return;
      }
    }

    const selectedAddress = useDefaultAddress
      ? {
          province: userProfile.province,
          canton: userProfile.canton,
          parroquia: userProfile.parroquia,
          postalCode: userProfile.postalCode,
          address: userProfile.address,
        }
      : userData;

    console.log('Selected address for checkout:', selectedAddress);

    setShowAddressDialog(false);
    navigate('/checkout', { 
      state: { 
        cartItems: cartItems,
        total: total,
        shippingAddress: selectedAddress 
      } 
    });
  };

  // Manejar cambio de ubicación al arrastrar el marcador
  const handleLocationChange = ({ longitude, latitude, address }) => {
    setMapCoordinates({ longitude, latitude }); // Actualizar coordenadas del mapa
    setUserData((prev) => ({
      ...prev,
      address, // Actualizar dirección exacta
    }));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mi Carrito
      </Typography>

      {!isAuthorized && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Usted no ha aceptado la autorización de datos personales para poder procesar su orden.
        </Alert>
      )}

      {cartItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            No tienes productos en tu carrito
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/')} // Redirige a la página de productos
            sx={{ mt: 2 }}
          >
            AGREGAR PRODUCTOS AL CARRITO
          </Button>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {cartItems.map((item) => (
              <Grid item xs={12} md={8} key={item.id}>
                <Card className="cart-item" sx={{ display: 'flex', flexDirection: 'row' }}>
                  <CardMedia
                    component="img"
                    sx={{ width: 200, height: 200, objectFit: 'contain', backgroundColor: '#f5f5f5' }}
                    image={convertGoogleDriveUrl(item.imageUrls?.[0] || '/placeholder-image.jpg')}
                    alt={item.productName || 'Producto'}
                  />
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="h6">{item.productName}</Typography>
                    <Typography variant="body1" color="text.secondary">
                      Precio: ${item.price.toFixed(2)}
                    </Typography>
                    <Typography variant="body1">
                      Cantidad: {item.quantity}
                    </Typography>
                    <Typography variant="body1" color="primary">
                      Subtotal: ${(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 2 }}>
                    <IconButton 
                      onClick={() => handleRemoveItem(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'right' }}>
            <Typography variant="h5" gutterBottom>
              Total: ${total.toFixed(2)}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleCheckout}
            >
              Procesar Órden
            </Button>
          </Box>
        </>
      )}

      {/* Diálogo para seleccionar dirección */}
      <Dialog 
        open={showAddressDialog} 
        onClose={() => setShowAddressDialog(false)}
        maxWidth="md" // Establece el ancho máximo del diálogo
        fullWidth // Asegura que el diálogo use todo el ancho disponible
      >
        <DialogTitle>Seleccionar Dirección de Envío</DialogTitle>
        <DialogContent sx={{ minWidth: '600px' }}> {/* Ajusta el ancho mínimo */}
          <Typography variant="h6">¿Desea usar la dirección guardada en su perfil o ingresar una nueva?</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 2, gap: 2 }}>
            <Button
              variant={useDefaultAddress ? 'contained' : 'outlined'}
              onClick={() => setUseDefaultAddress(true)}
            >
              Usar Dirección Guardada
            </Button>
            <Button
              variant={!useDefaultAddress ? 'contained' : 'outlined'}
              onClick={() => setUseDefaultAddress(false)}
            >
              Ingresar Nueva Dirección
            </Button>
          </Box>
          {!useDefaultAddress && (
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sx={{ width: '35%' }}>
                  <Autocomplete
                    options={ecuadorLocations.map((p) => p.province)}
                    value={userData.province || null}
                    onChange={handleProvinceChange}
                    renderInput={(params) => <TextField {...params} label="Provincia" />}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '30%' }}>
                  <Autocomplete
                    options={availableCantons}
                    value={userData.canton || null}
                    onChange={handleCantonChange}
                    disabled={!userData.province}
                    renderInput={(params) => <TextField {...params} label="Cantón" />}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '30%' }}>
                  <Autocomplete
                    options={availableParroquias}
                    value={userData.parroquia || null}
                    onChange={handleParroquiaChange}
                    disabled={!userData.canton}
                    renderInput={(params) => <TextField {...params} label="Parroquia" />}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <Typography variant="h6">Selecciona tu ubicación:</Typography>
                  <MapboxPicker
                      longitude={mapCoordinates.longitude}
                      latitude={mapCoordinates.latitude}
                      zoom={zoom}
                      onLocationChange={handleLocationChange}
                    />
                </Grid>
                <Grid item xs={12} sx={{ width: '65%' }}>
                  <TextField
                    key={userData.address || 'unique-key'} // Asegúrate de que React detecte el cambio
                    fullWidth
                    multiline
                    rows={3}
                    label="Dirección Exacta"
                    value={userData.address || ''}
                    onChange={(e) =>
                      setUserData({ ...userData, address: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ width: '30%' }}>
                  <TextField
                    fullWidth
                    label="Código Postal"
                    value={userData.postalCode || ''}
                    onChange={(e) => setUserData({ ...userData, postalCode: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddressDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmAddress}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Cart;