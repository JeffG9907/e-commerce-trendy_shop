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
import { Autocomplete } from '@mui/material';  // Add this import
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
    isAuthorized: false, // Add isAuthorized to userData
  });
  const [mapCoordinates, setMapCoordinates] = useState({ longitude: -78.467834, latitude: -0.180653 }); // Coordenadas iniciales (Quito, Ecuador)
  const [zoom, setZoom] = useState(12); // Nivel de zoom inicial
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showAuthorization, setShowAuthorization] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  // Add these handler functions here
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

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = { ...userDoc.data(), email: user.email };
          setUserData(userData);

          // Si hay una dirección guardada, geocodifica para obtener las coordenadas
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
                  setMapCoordinates({ longitude, latitude }); // Actualizar coordenadas basadas en la dirección
                } else {
                  console.error('No se encontraron coordenadas para la dirección proporcionada.');
                }
              } catch (error) {
                console.error('Error al obtener las coordenadas:', error);
              }
            };

            fetchCoordinates(userData.address);
          } else {
            // Si no hay dirección guardada, se mantienen las coordenadas por defecto
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

  const handleLocationSelect = (location) => {
    const { longitude, latitude } = location;

    // Actualiza el estado con las coordenadas seleccionadas
    setMapCoordinates({ longitude, latitude });

    // Convierte las coordenadas en una dirección legible
    const fetchAddress = async () => {
      const MAPBOX_API_KEY = 'pk.eyJ1IjoiamNhZ3VhZjQ0NzciLCJhIjoiY205dGI4aXc5MDlwOTJrcHY2cmFibGV4cyJ9.mMKsZRycJNjAJR39s1n72A'; 
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          setUserData((prev) => ({
            ...prev,
            address: data.features[0].place_name,
          }));
        } else {
          setUserData((prev) => ({
            ...prev,
            address: `${latitude}, ${longitude}`,
          }));
        }
      } catch (error) {
        console.error('Error al obtener la dirección:', error);
        setUserData((prev) => ({
          ...prev,
          address: `${latitude}, ${longitude}`,
        }));
      }
    };

    fetchAddress();
  };

  return (
    <Container component="main" maxWidth="lg" className="profile-container">
      <Paper elevation={3} className="profile-paper">
        {message.text && (
          <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
        )}

        <Box className="profile-header">
        <Typography 
          component="h1" 
          variant="h5" 
          sx={{ 
            display: 'inline-block', // Asegura que el texto se comporte como un bloque ajustado al contenido
            margin: '0 auto',        // Centra horizontalmente el texto
            textAlign: 'center'      // Centra el contenido del texto
          }}
        >
          <strong>MI CUENTA</strong>
          </Typography>
        </Box>

        <Box className="profile-form">
          <Grid container spacing={2}>
            {isEditing ? (
              <>
                <Grid container spacing={2}>
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
                      onLocationSelect={handleLocationSelect} 
                      longitude={mapCoordinates.longitude} 
                      latitude={mapCoordinates.latitude} 
                      zoom={zoom}
                      
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ width: '100%' }}>
                    <TextField
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
                  <Grid item xs={12} sm={6} sx={{ width: '10%' }}>
                    <TextField
                      fullWidth
                      label="Código Postal"
                      value={userData.postalCode || ''}
                      onChange={(e) => setUserData({ ...userData, postalCode: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ width: '20%' }}>
                    <TextField
                      fullWidth
                      label="Número de Celular"
                      value={userData.phoneNumber || ''}
                      onChange={(e) => setUserData({ ...userData, phoneNumber: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ width: '50%' }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={userData.email || ''}
                      disabled
                    />
                  </Grid>
                </Grid>
                <Grid item xs={12}>
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
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                  >
                    Guardar Cambios
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => setShowAuthorization(!showAuthorization)}
                  >
                    Ver autorización de datos personales
                  </Button>
                  {showAuthorization && (
                    <Typography variant="body2" className="authorization-text">
                      <Typography variant="h6">
                        AUTORIZACIÓN PARA TRATAMIENTO DE DATOS PERSONALES
                      </Typography>
                      <br />
                      <Typography variant="h5">
                      De conformidad con lo dispuesto en las normas vigentes sobre protección de datos personales, al acceder autorizo libre, expresa e inequívocamente a Trendy Shop EC, en adelante “Trendy Shop”, para que trate mis datos personales, de acuerdo con la Ley Orgánica de Protección de Datos Personales y su Reglamento General, en los siguientes términos:
                      </Typography>
                      <br /><br />
                      <Typography variant="body2">
                        PRIMERA: ANTECEDENTES.
                      </Typography>
                      <Typography variant="h5">
                      Con la promulgación de la Ley Orgánica de Protección de Datos Personales (en adelante la “Ley”), en Ecuador se busca garantizar el derecho a la protección de datos personales de sus titulares. Estos derechos incluyen, pero no se limitan a:
                      <br />
                      i. Solicitar autorización del titular para el tratamiento sobre sus Datos Personales;
                      <br />
                      ii. Ser informado, previo al otorgamiento de la autorización, respecto de los tratamientos y finalidades para los cuales se tratarán sus Datos Personales;
                      <br />
                      iii. Garantizar la protección de la información personal objeto de tratamiento; y,
                      <br />
                      iv. Garantizar la aplicación de hábeas data; derecho a conocer, actualizar, rectificar y solicitar que se incluyan o supriman Datos Personales del titular en los casos que proceda, conforme con la Ley, o de revocar su autorización para alguna(s) de las finalidades contenidas en la presente Autorización Expresa.
                      <br /><br />
                      </Typography>
                      <Typography variant="body2">
                        SEGUNDA: AUTORIZACIÓN EXPRESA.
                      </Typography>
                      <Typography variant="h5">
                      Mediante la firma de este documento, el Otorgante acepta y autoriza de manera previa, libre, expresa, inequívoca e informada a Trendy Shop EC (en adelante “Trendy Shop”), en su condición de Responsable, para que consulte, solicite, recolecte, almacene, circule (reporte, transmita o transfiera), utilice, suprima o realice cualquier tratamiento sobre sus Datos Personales exclusivamente dentro del marco de las relaciones comerciales, para cualquiera de las finalidades determinadas a continuación:
                      <br />
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>No.</TableCell>
                              <TableCell>Finalidades</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>1</TableCell>
                              <TableCell>Conocimiento del cliente activo y potencial</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>2</TableCell>
                              <TableCell>Análisis de comportamiento, perfilamiento y segmentación del mercado</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>3</TableCell>
                              <TableCell>Ofrecimiento de productos y/o servicios de Trendy Shop y sus aliados estratégicos</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>4</TableCell>
                              <TableCell>Cumplimiento de normas y estándares internacionales</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>5</TableCell>
                              <TableCell>Gestión de clientes y atención de venta-postventa</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>6</TableCell>
                              <TableCell>Actualización de información</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>7</TableCell>
                              <TableCell>Evaluación de la calidad de los productos y/o servicios prestados por Trendy Shop, incluyendo encuestas de satisfacción</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>8</TableCell>
                              <TableCell>Realización de actividades de promoción, publicidad, mercadeo, ventas y mejora del servicio de facturación a través de diversos medios</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>9</TableCell>
                              <TableCell>Envio de comunicaciones sobre novedades, descuentos y eventos exclusivos para clientes</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                      <br />
                      <Typography variant="body2">
                        TERCERA: DECLARACIÓN.
                      </Typography>
                      <Typography variant="h5">
                      3.1. Con la suscripción de la presente Autorización Expresa, declara ser mayor de edad, titular y/o representante legal y que la información proporcionada es exacta, veraz y completa.
                      <br />
                      3.2. Declara conocer los derechos que le asisten como titular de Datos Personales.
                      <br />
                      3.3. Declara haber sido informado sobre el tratamiento de datos sensibles, entendiéndose estos como aquellos que afectan la intimidad del titular o cuyo uso indebido pueda generar discriminación.
                      <br />
                      3.4. Asimismo, declara conocer que, en caso de no autorizar el tratamiento de los Datos Personales para alguna de las finalidades contenidas en la presente Autorización Expresa, o si requiere información adicional, puede comunicarse con Trendy Shop a través del correo electrónico soporte@trendyshop.ec.
                      <br /><br />
                      </Typography>
                      <Typography variant="body2">
                        CUARTA: REVOCABILIDAD.
                      </Typography>
                      <Typography variant="h5">
                      El consentimiento otorgado para el tratamiento de los Datos Personales es revocable en cualquier momento, comunicándolo de la misma manera en la que se ha otorgado, de manera expresa, inequívoca y libre.
                    </Typography>
                    </Typography>
    
                  )}
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Nombres:</strong> {userData.firstName}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Apellidos:</strong> {userData.lastName}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Email:</strong> {userData.email}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Cédula:</strong> {userData.cedula}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Provincia:</strong> {userData.province}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Cantón:</strong> {userData.canton}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Parroquia:</strong> {userData.parroquia}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Código Postal:</strong> {userData.postalCode}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Dirección:</strong> {userData.address}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}><strong>Número de Celular:</strong> {userData.phoneNumber}</Typography>
                  <Typography variant="body1" sx={{ textAlign: 'left' }}>
                    <strong>Autorización de tratamiento de datos:</strong> {userData.isAuthorized ? 'Sí' : 'No'}
                  </Typography>
                </Grid>
                <Button 
                  className="profile-edit-button"
                  variant="contained" 
                  color="primary"
                  onClick={() => setIsEditing(!isEditing)}
                  sx={{ 
                    display: 'inline-block',  // Ajusta el contenido al tamaño del botón
                    width: 'auto',            // Ajusta el ancho automáticamente al contenido
                    padding: '4px 12px',      // Reduce el relleno interno (alto y ancho)
                    height: '40px',           // Define una altura fija del botón
                    fontSize: '14px',         // Ajusta el tamaño de la fuente
                    lineHeight: '1.2',        // Controla la altura de la línea
                    borderRadius: '8px',      // Bordes redondeados
                    margin: '0 auto',         // Centrado horizontal
                    textAlign: 'center',      // Centra el texto dentro del botón
                  }}
                >
                  {isEditing ? 'Cancelar' : 'Editar Datos'}
                </Button>
              </>
            )}
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default Profile;