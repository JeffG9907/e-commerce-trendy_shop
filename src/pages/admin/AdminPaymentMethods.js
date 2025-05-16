import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Card, CardContent, Switch,
  TextField, Button, Box, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton,
  Select, MenuItem // Add these imports
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { getFirestore, collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';


const convertGoogleDriveUrl = (url) => {
  if (!url) return '';
  if (url.includes('uc?export=view')) return url;

  let id = '';
  if (url.includes('drive.google.com/file/d/')) {
    id = url.split('/file/d/')[1].split('/')[0];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  } else if (url.includes('drive.google.com/open?id=')) {
    id = url.split('open?id=')[1];
  } else if (url.includes('drive.google.com/uc?id=')) {
    id = url.split('uc?id=')[1];
  } else {
    const matches = url.match(/[-\w]{25,}/);
    id = matches ? matches[0] : '';
  }

  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
};


function PaymentMethods() {
  const [methods, setMethods] = useState({
    transfer: { 
      enabled: false, 
      details: {
        holderName: '',
        identification: '',
        accounts: [{
          bank: 'Banco Bolivariano',
          accountType: '',
          accountNumber: '',
          url_image: ''
        }]
      }
    },
    deuna: { enabled: false, details: {} },
    paypal: { enabled: false, details: {} }
  });
  const [editingMethod, setEditingMethod] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const db = getFirestore();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'paymentMethods'));
      const methodsData = {};
      querySnapshot.forEach((doc) => {
        methodsData[doc.id] = doc.data();
      });
      setMethods(methodsData);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  const handleMethodToggle = async (methodId) => {
    const updatedMethods = {
      ...methods,
      [methodId]: {
        ...methods[methodId],
        enabled: !methods[methodId]?.enabled,
        details: methodId === 'transfer' ? {
          holderName: '',
          identification: '',
          accounts: [{
            bank: 'Banco Bolivariano',
            accountType: '',
            accountNumber: '',
            url_image: ''
          }]
        } : methods[methodId]?.details || {}
      }
    };
    setMethods(updatedMethods);
    await saveMethod(methodId, updatedMethods[methodId]);
  };

  const handleEditMethod = (methodId) => {
    setEditingMethod(methodId);
    setDialogOpen(true);
  };

  const handleSaveDetails = async () => {
    if (editingMethod) {
      await saveMethod(editingMethod, methods[editingMethod]);
      setDialogOpen(false);
      setEditingMethod(null);
    }
  };

  const saveMethod = async (methodId, methodData) => {
    try {
      await setDoc(doc(db, 'paymentMethods', methodId), methodData);
    } catch (error) {
      console.error('Error saving payment method:', error);
    }
  };

  const handleAddBankAccount = () => {
    const updatedMethods = { ...methods };
    updatedMethods.transfer.details.accounts.push({
      bank: '',
      accountType: '',
      accountNumber: '',
      url_image: ''
    });
    setMethods(updatedMethods);
  };

  const handleRemoveBankAccount = (index) => {
    const updatedMethods = { ...methods };
    updatedMethods.transfer.details.accounts.splice(index, 1);
    setMethods(updatedMethods);
  };

  const handleBankAccountChange = (index, field, value) => {
    const updatedMethods = { ...methods };
    updatedMethods.transfer.details.accounts[index][field] = value;
    setMethods(updatedMethods);
  };

  // Modify getMethodFields function
  const getMethodFields = (methodId) => {
    switch (methodId) {
      case 'transfer':
        return (
          <>
            <Typography variant="h6" gutterBottom>Datos del Titular</Typography>
            <TextField
              fullWidth
              label="Nombre del Titular"
              value={methods.transfer.details.holderName || ''}
              onChange={(e) => {
                setMethods({
                  ...methods,
                  transfer: {
                    ...methods.transfer,
                    details: {
                      ...methods.transfer.details,
                      holderName: e.target.value
                    }
                  }
                });
              }}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Número de Cédula"  // Changed from "Identificación"
              value={methods.transfer.details.identification || ''}
              onChange={(e) => {
                setMethods({
                  ...methods,
                  transfer: {
                    ...methods.transfer,
                    details: {
                      ...methods.transfer.details,
                      identification: e.target.value
                    }
                  }
                });
              }}
              margin="normal"
            />
            <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Cuentas Bancarias</Typography>
            {methods.transfer.details.accounts.map((account, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle1">Cuenta {index + 1}</Typography>
                  {index > 0 && (
                    <IconButton onClick={() => handleRemoveBankAccount(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                <TextField
                  fullWidth
                  label="Banco"
                  value={account.bank}
                  onChange={(e) => handleBankAccountChange(index, 'bank', e.target.value)}
                  margin="normal"
                />
                <Select
                  fullWidth
                  value={account.accountType}
                  onChange={(e) => handleBankAccountChange(index, 'accountType', e.target.value)}
                  margin="normal"
                  sx={{ mt: 2, mb: 1 }}
                >
                  <MenuItem value="Cta. Ahorros">Cta. Ahorros</MenuItem>
                  <MenuItem value="Cta. Corriente">Cta. Corriente</MenuItem>
                </Select>
                <TextField
                  fullWidth
                  label="Número de Cuenta"
                  value={account.accountNumber}
                  onChange={(e) => handleBankAccountChange(index, 'accountNumber', e.target.value)}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="URL de la Imagen"
                  value={account.url_image}
                  onChange={(e) => handleBankAccountChange(index, 'url_image', e.target.value)}
                  margin="normal"
                />
                {account.url_image && (
                  <Box sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
                    <img
                      src={convertGoogleDriveUrl(account.url_image)}
                      alt={`Logo ${account.bank}`}
                      style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'contain' }}
                    />
                  </Box>
                )}
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddBankAccount}
              variant="outlined"
              fullWidth
              sx={{ mt: 1 }}
            >
              Agregar Cuenta Bancaria
            </Button>
          </>
        );

      case 'deuna':
        return (
          <>
            <TextField
              fullWidth
              label="URL de la Imagen QR"
              value={methods.deuna?.details?.qrImageUrl || ''}
              onChange={(e) => {
                setMethods({
                  ...methods,
                  deuna: {
                    ...methods.deuna,
                    details: {
                      ...methods.deuna?.details,
                      qrImageUrl: e.target.value
                    }
                  }
                });
              }}
              margin="normal"
            />
            {methods.deuna?.details?.qrImageUrl && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img
                  src={convertGoogleDriveUrl(methods.deuna.details.qrImageUrl)}
                  alt="QR Code"
                  style={{ maxWidth: '200px', maxHeight: '200px' }}
                />
              </Box>
            )}
          </>
        );

      case 'paypal':
        return [
          { name: 'clientId', label: 'Client ID' },
          { name: 'secretKey', label: 'Secret Key' }
        ];
      default:
        return [];
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Configuración de Métodos de Pago
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Transferencia Bancaria</Typography>
            <Box>
              <Switch
                checked={methods.transfer?.enabled || false}
                onChange={() => handleMethodToggle('transfer')}
              />
              <Button 
                onClick={() => handleEditMethod('transfer')}
                disabled={!methods.transfer?.enabled}
              >
                Configurar
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">DeUna</Typography>
            <Box>
              <Switch
                checked={methods.deuna?.enabled || false}
                onChange={() => handleMethodToggle('deuna')}
              />
              <Button 
                onClick={() => handleEditMethod('deuna')}
                disabled={!methods.deuna?.enabled}
              >
                Configurar
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">PayPal</Typography>
            <Box>
              <Switch
                checked={methods.paypal?.enabled || false}
                onChange={() => handleMethodToggle('paypal')}
              />
              <Button 
                onClick={() => handleEditMethod('paypal')}
                disabled={!methods.paypal?.enabled}
              >
                Configurar
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth>
        <DialogTitle>
          Configurar {editingMethod === 'transfer' ? 'Transferencia Bancaria' : 
                     editingMethod === 'deuna' ? 'DeUna' : 'PayPal'}
        </DialogTitle>
        <DialogContent>
          {editingMethod && (
            Array.isArray(getMethodFields(editingMethod)) ? (
              getMethodFields(editingMethod).map((field) => (
                <TextField
                  key={field.name}
                  fullWidth
                  label={field.label}
                  value={methods[editingMethod]?.details?.[field.name] || ''}
                  onChange={(e) => {
                    setMethods({
                      ...methods,
                      [editingMethod]: {
                        ...methods[editingMethod],
                        details: {
                          ...methods[editingMethod]?.details,
                          [field.name]: e.target.value
                        }
                      }
                    });
                  }}
                  margin="normal"
                />
              ))
            ) : (
              getMethodFields(editingMethod)
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveDetails} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PaymentMethods;