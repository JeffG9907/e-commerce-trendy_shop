import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  TextField,
  Grid,
  Alert,
  FormControlLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow 
} from '@mui/material';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import MapboxPicker from '../components/MapboxPicker'; // Importa el componente MapboxPicker
import '../styles/Profile.css';
import { Autocomplete } from '@mui/material';
import { ecuadorLocations } from '../components/EcuadorLocations'; // Importa el archivo de ubicaciones de Ecuador

function Profile() {
  const [availableCantons, setAvailableCantons] = useState([]);
  const [availableParroquias, setAvailableParroquias] = useState([]);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cedula: '',
    province: '',
    canton: '',
    parroquia: '',  
    postalCode: '',
    address: '',
    phoneNumber: '',
    isAuthorized: false,
  });
  const [mapCoordinates, setMapCoordinates] = useState({ longitude: -78.467834, latitude: -0.180653 }); // Quito, Ecuador
  const [zoom, setZoom] = useState(12); // Nivel de zoom inicial
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAuthorization, setShowAuthorization] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

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
      setMapCoordinates({ longitude: -78.467834, latitude: -0.180653 }); // Quito por defecto
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

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = { ...userDoc.data(), email: user.email };
          setUserData(userData);
          if (userData.address && userData.address.trim() !== '') {
            const fetchCoordinates = async (address) => {
              const MAPBOX_API_KEY = 'pk.eyJ1IjoiamNhZ3VhZjQ0NzciLCJhIjoiY205dGI4aXc5MDlwOTJrcHY2cmFibGV4cyJ9.mMKsZRycJNjAJR39s1n72A';
              try {
                const response = await fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                    address
                  )}.json?access_token=${MAPBOX_API_KEY}`
                );
                const data = await response.json();
                if (data.features && data.features.length > 0) {
                  const [longitude, latitude] = data.features[0].center;
                  setMapCoordinates({ longitude, latitude });
                } else {
                  console.error('No se encontraron coordenadas para la dirección proporcionada.');
                }
              } catch (error) {
                console.error('Error al obtener las coordenadas:', error);
              }
            };
            fetchCoordinates(userData.address);
          } else {
            console.log('No hay dirección guardada. Usando coordenadas por defecto.');
          }
        }
      } else {
        navigate('/login');
      }
    };
    fetchUserData();
  }, [auth, db, navigate]);

  const handleSave = async () => {
    if (!userData.isAuthorized) {
      setMessage({ type: 'error', text: 'Debe aceptar la autorización de tratamiento de datos personales' });
      return;
    }
    try {
      const user = auth.currentUser;
      if (user) {
        await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Datos actualizados correctamente' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Error al actualizar datos' });
    }
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
    <Container component="main" maxWidth="lg" className="profile-container">
      <Paper elevation={3} className="profile-paper">
        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
        )}
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          MI CUENTA
        </Typography>
        <Box className="profile-form">
          <Grid container spacing={2}>
            {isEditing ? (
              <>
                <Grid item xs={12} sm={6} sx={{ width: '40%' }}>
                    <TextField
                    fullWidth
                    label="Nombres"
                    value={userData.firstName || ''}
                    onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6} sx={{ width: '40%' }}>
                    <TextField
                    fullWidth
                    label="Apellidos"
                    value={userData.lastName || ''}
                    onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '15%' }}>
                    <TextField
                    fullWidth
                    label="Cédula"
                    value={userData.cedula || ''}
                    onChange={(e) => setUserData({ ...userData, cedula: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '35%' }}>
                  <Autocomplete
                    options={ecuadorLocations.map((p) => p.province)}
                    value={userData.province || null}
                    onChange={handleProvinceChange}
                    renderInput={(params) => (
                      <TextField {...params} label="Provincia" className="form-field provincia-field" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '30%' }}>
                  <Autocomplete
                    options={availableCantons}
                    value={userData.canton || null}
                    onChange={handleCantonChange}
                    disabled={!userData.province}
                    renderInput={(params) => (
                      <TextField {...params} label="Cantón" className="form-field canton-field" />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '30%' }}>
                  <Autocomplete
                    options={availableParroquias}
                    value={userData.parroquia || null}
                    onChange={handleParroquiaChange}
                    disabled={!userData.canton}
                    renderInput={(params) => (
                      <TextField {...params} label="Parroquia" className="form-field"/>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <Typography variant="h6">Selecciona tu ubicación:</Typography>
                  <div style={{ width: '100%' }}>
                    <MapboxPicker
                      longitude={mapCoordinates.longitude}
                      latitude={mapCoordinates.latitude}
                      zoom={zoom}
                      onLocationChange={handleLocationChange}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    label="Dirección Exacta"
                    className="direccion-field"
                    value={userData.address || ''}
                    onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '40%' }}>
                  <TextField
                    fullWidth
                    label="Código Postal"
                    className="form-field"
                    value={userData.postalCode || ''}
                    onChange={(e) => setUserData({ ...userData, postalCode: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '40%' }}>
                  <TextField
                    fullWidth
                    label="Número de Celular"
                    className="form-field"
                    value={userData.phoneNumber || ''}
                    onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sx={{ width: '100%' }}>
                  <TextField
                    fullWidth
                    label="Email"
                    className="form-field"
                    value={userData.email || ''}
                    disabled
                  />
                </Grid>
                <Grid item xs={12} className="form-item">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={userData.isAuthorized}
                        onChange={(e) => setUserData({ ...userData, isAuthorized: e.target.checked })}
                      />
                    }
                    label="Aceptar autorización de tratamiento de datos personales"
                  />
                </Grid>
                <Grid item xs={12} className="form-item profile-actions">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                  >
                    Guardar Cambios
                  </Button>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} className="profile-info">
                  <Typography variant="body1"><strong>Nombres:</strong> {userData.firstName}</Typography>
                  <Typography variant="body1"><strong>Apellidos:</strong> {userData.lastName}</Typography>
                  <Typography variant="body1"><strong>Email:</strong> {userData.email}</Typography>
                  <Typography variant="body1"><strong>Cédula:</strong> {userData.cedula}</Typography>
                  <Typography variant="body1"><strong>Provincia:</strong> {userData.province}</Typography>
                  <Typography variant="body1"><strong>Cantón:</strong> {userData.canton}</Typography>
                  <Typography variant="body1"><strong>Parroquia:</strong> {userData.parroquia}</Typography>
                  <Typography variant="body1"><strong>Dirección:</strong> {userData.address}</Typography>
                </Grid>
                <Grid item xs={12} className="profile-actions">
                  <Button
                    variant="contained"
                    color="primary"
                    className="profile-edit-button"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar Datos
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default Profile;