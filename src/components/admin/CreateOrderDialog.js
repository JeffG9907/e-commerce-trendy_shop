import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogActions, DialogContent, DialogTitle,
  TableContainer, Paper, Table, TableHead, TableRow,
  TableCell, TableBody,
  TextField, Button, Typography, Box, MenuItem, Select,
  Grid, FormControl, InputLabel, Avatar, Autocomplete
} from '@mui/material';
import { addDoc, collection, getFirestore } from 'firebase/firestore';
import ProductSelector from './ProductSelector';
import { ecuadorLocations } from '../../components/EcuadorLocations';

const emptyOrder = {
  createdAt: new Date().toISOString(),
  customerEmail: "",
  customerName: "",
  customerLastname: "",
  cedula: "",
  phone: "",
  items: [],
  orderNumber: "",
  paymentDetails: "",
  paymentMethod: "efectivo",
  shippingCost: 0,
  shippingDetails: {
    address: "",
    canton: "",
    parroquia: "",
    postalCode: "",
    province: "",
  },
  status: "review",
  subtotal: 0,
  total: 0,
  // userId: "", <-- NO USAR userId
};

function CreateOrderDialog({ open, onClose, onOrderCreated }) {
  const db = getFirestore();
  const [manualOrder, setManualOrder] = useState({ ...emptyOrder });
  const [availableCantons, setAvailableCantons] = useState([]);
  const [availableParroquias, setAvailableParroquias] = useState([]);

  // Cascada: Provincia seleccionada -> Cantones
  useEffect(() => {
    if (manualOrder.shippingDetails.province) {
      const provinceObj = ecuadorLocations.find(
        (p) => p.province === manualOrder.shippingDetails.province
      );
      setAvailableCantons(provinceObj ? provinceObj.cantons.map(c => c.canton) : []);
    } else {
      setAvailableCantons([]);
    }
    setManualOrder(prev => ({
      ...prev,
      shippingDetails: {
        ...prev.shippingDetails,
        canton: "",
        parroquia: "",
      }
    }));
    setAvailableParroquias([]);
    // eslint-disable-next-line
  }, [manualOrder.shippingDetails.province]);

  // Cascada: Cantón seleccionado -> Parroquias
  useEffect(() => {
    if (manualOrder.shippingDetails.province && manualOrder.shippingDetails.canton) {
      const provinceObj = ecuadorLocations.find(
        (p) => p.province === manualOrder.shippingDetails.province
      );
      const cantonObj = provinceObj?.cantons.find(
        (c) => c.canton === manualOrder.shippingDetails.canton
      );
      setAvailableParroquias(cantonObj ? cantonObj.parroquias.map(p => p.parroquia) : []);
    } else {
      setAvailableParroquias([]);
    }
    setManualOrder(prev => ({
      ...prev,
      shippingDetails: {
        ...prev.shippingDetails,
        parroquia: "",
      }
    }));
    // eslint-disable-next-line
  }, [manualOrder.shippingDetails.canton]);

  // Generar número de orden automáticamente al abrir el diálogo
  useEffect(() => {
    if (open) {
      const generatedOrderNumber = Date.now().toString(36).toUpperCase();
      setManualOrder(prev => ({
        ...prev,
        orderNumber: generatedOrderNumber,
      }));
    }
  }, [open]);

  // Calcular shippingCost automáticamente según parroquia/cantón/provincia
  useEffect(() => {
    const { parroquia, canton, province } = manualOrder.shippingDetails;
    let cost = 5;
    const normalizedParroquia = (parroquia || '').trim().toLowerCase();
    const normalizedCanton = (canton || '').trim().toLowerCase();
    const normalizedProvince = (province || '').trim().toLowerCase();

    if (normalizedParroquia === 'calderón') {
      cost = 0;
    } else if (normalizedCanton === 'quito' || normalizedProvince === 'pichincha') {
      cost = 3;
    } else {
      cost = 5;
    }
    setManualOrder(prev => ({ ...prev, shippingCost: cost }));
  }, [
    manualOrder.shippingDetails.parroquia,
    manualOrder.shippingDetails.canton,
    manualOrder.shippingDetails.province,
  ]);

  // Calcular subtotal y total automáticamente
  useEffect(() => {
    const subtotal = manualOrder.items.reduce((sum, item) =>
      sum + (Number(item.price) * Number(item.quantity)), 0);
    const total = subtotal + (parseFloat(manualOrder.shippingCost) || 0);

    setManualOrder(prev => ({
      ...prev,
      subtotal,
      total,
    }));
  }, [manualOrder.items, manualOrder.shippingCost]);

  // Actualizar automáticamente paymentDetails según paymentMethod
  useEffect(() => {
    let paymentDetailsText = "";
    if (manualOrder.paymentMethod === "efectivo") {
      paymentDetailsText = "Pago en Efectivo";
    } else if (manualOrder.paymentMethod === "transferencia") {
      paymentDetailsText = "Pago con Transferencia";
    } else if (manualOrder.paymentMethod === "deuna") {
      paymentDetailsText = "Pago con DeUna";
    }
    setManualOrder(prev => ({
      ...prev,
      paymentDetails: paymentDetailsText
    }));
    // eslint-disable-next-line
  }, [manualOrder.paymentMethod]);

  const handleChange = (field, value) => {
    if (field.startsWith('shippingDetails.')) {
      const subField = field.split('.')[1];
      setManualOrder(prev => ({
        ...prev,
        shippingDetails: { ...prev.shippingDetails, [subField]: value }
      }));
    } else {
      setManualOrder(prev => ({ ...prev, [field]: value }));
    }
  };

  // Handlers para Autocomplete
  const handleProvinceChange = (e, value) => {
    setManualOrder(prev => ({
      ...prev,
      shippingDetails: {
        ...prev.shippingDetails,
        province: value || "",
      }
    }));
  };

  const handleCantonChange = (e, value) => {
    setManualOrder(prev => ({
      ...prev,
      shippingDetails: {
        ...prev.shippingDetails,
        canton: value || "",
      }
    }));
  };

  const handleParroquiaChange = (e, value) => {
    setManualOrder(prev => ({
      ...prev,
      shippingDetails: {
        ...prev.shippingDetails,
        parroquia: value || "",
      }
    }));
  };

  const handleProductChange = (idx, field, value) => {
    setManualOrder(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...prev, items };
    });
  };

  const handleRemoveProduct = (idx) => {
    setManualOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  // Validación de campos obligatorios
  const isFormComplete = () => {
    const { customerEmail, customerName, customerLastname, cedula, phone, items, shippingDetails } = manualOrder;
    return (
      !!customerEmail &&
      !!customerName &&
      !!customerLastname &&
      !!cedula &&
      !!phone &&
      items.length > 0 &&
      !!shippingDetails.address &&
      !!shippingDetails.province &&
      !!shippingDetails.canton &&
      !!shippingDetails.parroquia &&
      !!shippingDetails.postalCode
    );
  };

  const handleSave = async () => {
    if (!isFormComplete()) {
      alert('Por favor, complete todos los campos obligatorios y agregue al menos un producto.');
      return;
    }
    try {
      const subtotal = manualOrder.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
      const total = subtotal + (parseFloat(manualOrder.shippingCost) || 0);

      const orderToSave = {
        createdAt: new Date(manualOrder.createdAt).toISOString(),
        orderNumber: manualOrder.orderNumber,
        customerEmail: manualOrder.customerEmail,
        customerName: manualOrder.customerName,
        customerLastname: manualOrder.customerLastname,
        cedula: manualOrder.cedula,
        phone: manualOrder.phone,
        items: manualOrder.items.map(item => {
          // Remueve userId si existe en el producto
          const { userId, ...itemData } = item;
          return {
            ...itemData,
            addedAt: item.addedAt || new Date().toISOString(),
          };
        }),
        paymentDetails: manualOrder.paymentDetails,
        paymentMethod: manualOrder.paymentMethod,
        shippingCost: Number(manualOrder.shippingCost) || 0,
        shippingDetails: manualOrder.shippingDetails,
        status: manualOrder.status,
        subtotal,
        total,
      };

      await addDoc(collection(db, 'orders'), orderToSave);
      if (onOrderCreated) onOrderCreated();
      setManualOrder({ ...emptyOrder });
      onClose();
    } catch (error) {
      alert('Error al crear la orden');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sx" fullWidth>
      <DialogTitle>Crear Orden Manualmente</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1}>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '15%' } }}>
              <TextField
                margin="dense"
                label="No. Orden"
                value={manualOrder.orderNumber}
                onChange={e => handleChange('orderNumber', e.target.value)}
                disabled
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '15%' } }}>
              <TextField
                margin="dense"
                label="No. Cédula"
                value={manualOrder.cedula}
                onChange={e => handleChange('cedula', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sx={{ width: { xs: '100%', sm: '52.5%' } }}>
              <TextField
                margin="dense"
                label="Email"
                value={manualOrder.customerEmail}
                onChange={e => handleChange('customerEmail', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '15%' } }}>
              <TextField
                margin="dense"
                label="No. Celular"
                value={manualOrder.phone}
                onChange={e => handleChange('phone', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '20%' } }}>
              <TextField
                margin="dense"
                label="Nombres"
                value={manualOrder.customerName}
                onChange={e => handleChange('customerName', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '20%' } }}>
              <TextField
                margin="dense"
                label="Apellidos"
                value={manualOrder.customerLastname}
                onChange={e => handleChange('customerLastname', e.target.value)}
                fullWidth
              />
            </Grid>

            <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '20%' } }}>
              <Autocomplete
                options={ecuadorLocations.map((p) => p.province)}
                value={manualOrder.shippingDetails.province || null}
                onChange={handleProvinceChange}
                renderInput={(params) => <TextField {...params} label="Provincia" margin="dense" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '20%' } }}>
              <Autocomplete
                options={availableCantons}
                value={manualOrder.shippingDetails.canton || null}
                onChange={handleCantonChange}
                disabled={!manualOrder.shippingDetails.province}
                renderInput={(params) => <TextField {...params} label="Cantón" margin="dense" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '17%' } }}>
              <Autocomplete
                options={availableParroquias}
                value={manualOrder.shippingDetails.parroquia || null}
                onChange={handleParroquiaChange}
                disabled={!manualOrder.shippingDetails.canton}
                renderInput={(params) => <TextField {...params} label="Parroquia" margin="dense" fullWidth />}
              />
            </Grid>

            <Grid item xs={12} sm={8} sx={{ width: { xs: '100%', sm: '80%' } }}>
              <TextField
                margin="dense"
                label="Dirección"
                value={manualOrder.shippingDetails.address}
                onChange={e => handleChange('shippingDetails.address', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '19%' } }}>
              <TextField
                margin="dense"
                label="Código Postal"
                value={manualOrder.shippingDetails.postalCode}
                onChange={e => handleChange('shippingDetails.postalCode', e.target.value)}
                fullWidth
              />
            </Grid>
          </Grid>
          {/* Selector de productos */}
          <ProductSelector
            onAddProduct={product =>
              setManualOrder(prev => ({
                ...prev,
                items: [...prev.items, product],
              }))
            }
          />
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>Productos</Typography>
            {manualOrder.items.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No hay productos agregados.</Typography>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>DESCRIPCIÓN</TableCell>
                      <TableCell>CANTIDAD</TableCell>
                      <TableCell>P.V.P</TableCell>
                      <TableCell>SUBTOTAL</TableCell>
                      <TableCell>ACCIÓN</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {manualOrder.items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar src={item.imageUrls?.[0]} sx={{ width: 40, height: 40 }} />
                            <Box>
                              <Typography>{item.productName || item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.productId || item.id}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography>{item.quantity}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{item.price}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Button color="error" onClick={() => handleRemoveProduct(idx)}>Quitar</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
          {/* Subtotales */}
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1">
              <b>Subtotal:</b> ${manualOrder.subtotal.toFixed(2)}
            </Typography>
            <Typography variant="body1">
              <b>Costo de envío:</b> ${manualOrder.shippingCost.toFixed(2)}
            </Typography>
            <Typography variant="body1">
              <b>Total:</b> {(manualOrder.subtotal + manualOrder.shippingCost).toFixed(2)}
            </Typography>
          </Box>
          {/* Métodos de pago */}
          <Grid container spacing={1} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6}>
              <FormControl margin="dense" fullWidth>
                <InputLabel>Método de Pago</InputLabel>
                <Select
                  label="Método de Pago"
                  value={manualOrder.paymentMethod}
                  onChange={e => handleChange('paymentMethod', e.target.value)}
                >
                  <MenuItem value="efectivo">Efectivo</MenuItem>
                  <MenuItem value="transferencia">Transferencia</MenuItem>
                  <MenuItem value="deuna">DeUna</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* No más campo de detalles de pago, se llena automático */}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button
          onClick={handleSave}
          color="primary"
          variant="contained"
          disabled={!isFormComplete()}
        >
          Guardar Orden
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CreateOrderDialog;