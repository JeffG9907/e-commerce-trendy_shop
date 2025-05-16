import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, TextField, Button, CircularProgress, Paper, Box 
} from '@mui/material';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { convertGoogleDriveUrl } from '../../utils/googleDriveUtilsID';

const CompanySettings = () => {
  const [companyData, setCompanyData] = useState({
    name: '',
    description: '',
    logoUrl: '',
    address: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const fetchOrCreateCompanyData = async () => {
      const docRef = doc(db, 'config', 'company');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Si el documento existe, cargar los datos
        setCompanyData(docSnap.data());
      } else {
        // Si el documento no existe, crearlo con valores predeterminados
        const defaultData = {
          name: '',
          description: '',
          logoUrl: '',
          address: '',
          email: '',
          phone: ''
        };
        await setDoc(docRef, defaultData);
        setCompanyData(defaultData);
      }
      setLoading(false);
    };

    onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchOrCreateCompanyData();
      }
    });
  }, [auth, db]);

  const handleInputChange = (field, value) => {
    setCompanyData((prevData) => ({
      ...prevData,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const docRef = doc(db, 'config', 'company');
      await updateDoc(docRef, companyData);
      alert('Datos de la empresa guardados con éxito.');
    } catch (error) {
      console.error('Error al guardar los datos:', error.message);
      alert(`Hubo un error al guardar los datos: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>Configuración de la Empresa</Typography>
      {loading ? (
        <Paper style={{ padding: '20px', textAlign: 'center' }}>
          <CircularProgress />
        </Paper>
      ) : (
        <Paper style={{ padding: '20px' }}>
          <TextField
            autoFocus
            margin="dense"
            label="Nombre de la Empresa"
            fullWidth
            value={companyData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
          />
          <TextField
            margin="dense"
            label="Descripción"
            fullWidth
            multiline
            rows={3}
            value={companyData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
          <TextField
            margin="dense"
            label="Logotipo (URL de Google Drive)"
            fullWidth
            value={companyData.logoUrl}
            onChange={(e) => handleInputChange('logoUrl', e.target.value)}
            helperText="Pega el enlace para compartir de Google Drive"
          />
          {companyData.logoUrl && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <img 
                src={convertGoogleDriveUrl(companyData.logoUrl)} 
                alt="Vista previa del Logotipo"
                style={{ maxWidth: '200px', maxHeight: '200px', objectFit: 'contain' }}
              />
            </Box>
          )}
          <TextField
            margin="dense"
            label="Dirección"
            fullWidth
            multiline
            rows={2}
            value={companyData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />
          <TextField
            margin="dense"
            label="Correo Electrónico"
            fullWidth
            type="email"
            value={companyData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
          />
          <TextField
            margin="dense"
            label="Teléfono"
            fullWidth
            type="tel"
            value={companyData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            fullWidth
            disabled={saving}
            style={{ marginTop: '16px' }}
          >
            {saving ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </Paper>
      )}
    </Container>
  );
};

export default CompanySettings;