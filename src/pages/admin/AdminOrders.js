import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  IconButton, Select, MenuItem, FormControl, Box, Button, TextField,
  Dialog, DialogActions, DialogContent, DialogTitle, InputLabel
} from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import { es } from 'date-fns/locale';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import logo from '../../assets/perfil_1.png';
import logo_1 from '../../assets/perfil_1.1.png';
import { useTheme, useMediaQuery } from '@mui/material';

// Importa las utilidades de generación de PDF
import {
  generateOrderPDFNormal,
  generateOrderPDFThermal
} from '../../components/admin/pdfUtils';

// Importa el componente de crear orden manual
import CreateOrderDialog from '../../components/admin/CreateOrderDialog';

function Orders() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [open, setOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [transport, setTransport] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [pickupTime, setPickupTime] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(null);

  // Estado para el diálogo de creación manual
  const [openCreateOrder, setOpenCreateOrder] = useState(false);

  const db = getFirestore();

  // Función para obtener la información de la empresa
  const fetchCompanyInfo = async () => {
    try {
      const companyDoc = await getDoc(doc(db, "config", "company"));
      if (companyDoc.exists()) {
        setCompanyInfo(companyDoc.data());
      } else {
        console.error("El documento de la empresa no existe.");
      }
    } catch (error) {
      console.error("Error al obtener la información de la empresa:", error);
    }
  };

  const orderStatuses = [
    { value: 'review', label: 'En Revisión' },
    { value: 'paid', label: 'Pago Recibido' },
    { value: 'no_paid', label: 'Pago No Recibido' },
    { value: 'shipped', label: 'Orden Enviada' },
    { value: 'delivered', label: 'Orden Recibida' },
  ];

  // Traer órdenes y asociar usuario
  const fetchOrders = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'orders'));
      const ordersData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const orderData = { id: docSnap.id, ...docSnap.data() };
          if (orderData.userId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', orderData.userId));
              if (userDoc.exists()) {
                orderData.userData = userDoc.data();
              }
            } catch (userError) {
              console.error('Error fetching user data:', userError);
            }
          }
          return orderData;
        })
      );
      setOrders(
        ordersData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      );
      setFilteredOrders(
        ordersData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = (order) => {
    setCurrentOrder(order);
    setSelectedProducts(
      order.items?.map((item) => ({ ...item, packedQuantity: 0 }))
    );
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentOrder(null);
    setSelectedProducts([]);
    setTransport('');
    setSelectedDate(null);
    setPickupTime(null);
  };

  const handleProductPacking = (index, packedQuantity) => {
    setSelectedProducts((prev) =>
      prev.map((product, i) =>
        i === index ? { ...product, packedQuantity } : product
      )
    );
  };

  const handleOrderDispatch = async () => {
    if (!transport || !selectedDate || !pickupTime) {
      alert('Por favor completa todos los campos requeridos.');
      return;
    }

    try {
      // Actualizar el stock de los productos seleccionados
      for (const product of selectedProducts) {
        const productRef = doc(db, 'products', product.productId);
        const productDoc = await getDoc(productRef);
        if (productDoc.exists()) {
          const productData = productDoc.data();
          const newStock = (productData.stock || 0) - product.packedQuantity;
          await updateDoc(productRef, { stock: newStock });
        }
      }

      // Guardar los nuevos campos en la colección de órdenes
      await updateDoc(doc(db, 'orders', currentOrder.id), {
        status: 'shipped',
        transport,
        arrivalDate: selectedDate.toISOString(),
        pickupTime: pickupTime.toISOString(),
      });

      // Actualizar el estado de las órdenes en la interfaz
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === currentOrder.id
            ? {
                ...order,
                status: 'shipped',
                transport,
                arrivalDate: selectedDate,
                pickupTime,
              }
            : order
        )
      );

      alert('Orden despachada con éxito');
      handleClose();
    } catch (error) {
      console.error('Error dispatching order:', error);
      alert('Error al despachar la orden. Por favor, intenta nuevamente.');
    }
  };

  // Filtros de búsqueda
  const applyFilters = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          (order.userData?.cedula &&
            order.userData.cedula
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (order.userData?.firstName &&
            order.userData.firstName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (order.userData?.lastName &&
            order.userData.lastName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (order.cedula &&
            order.cedula.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.customerName &&
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.customerLastname &&
            order.customerLastname.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (startDate) {
      filtered = filtered.filter(
        (order) =>
          order.createdAt && new Date(order.createdAt) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(
        (order) =>
          order.createdAt && new Date(order.createdAt) <= new Date(endDate)
      );
    }

    setFilteredOrders(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [searchTerm, startDate, endDate, orders]);

  // useEffect para cargar la información de la empresa y las órdenes
  useEffect(() => {
    fetchCompanyInfo();
    fetchOrders();
  }, []);

  // -------- GENERACIÓN DE PDF NORMAL --------
  const handleGeneratePDFNormal = (order) => {
    generateOrderPDFNormal(order, companyInfo, logo, logo_1);
  };

  // -------- GENERACIÓN DE PDF TÉRMICO --------
  const handleGeneratePDFThermal = (order) => {
    generateOrderPDFThermal(order, companyInfo, logo_1);
  };

  // Cuando se crea una orden, recarga las órdenes
  const handleOrderCreated = () => {
    setOpenCreateOrder(false);
    fetchOrders();
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Gestionar Órdenes
      </Typography>
      <Box 
        display="flex" 
        flexDirection={isMobile ? 'column' : 'row'} 
        gap={2} 
        mb={3}
      >
        <TextField
          label="Buscar por cédula, nombre o apellido"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Box 
          display="flex" 
          flexDirection={isMobile ? 'column' : 'row'} 
          gap={2}
          width={isMobile ? '100%' : 'auto'}
        >
          <TextField
            label="Fecha Inicio"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            fullWidth={isMobile}
          />
          <TextField
            label="Fecha Fin"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            fullWidth={isMobile}
          />
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreateOrder(true)}
          sx={{ mb: 2 }}
        >
          Crear Orden
        </Button>

        <CreateOrderDialog
          open={openCreateOrder}
          onClose={() => setOpenCreateOrder(false)}
          onOrderCreated={handleOrderCreated}
        />
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 3, 
          boxShadow: 3, 
          borderRadius: 2, 
          overflow: 'auto',
          '& .MuiTable-root': {
            minWidth: 1200,
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Detalles de Orden</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cliente</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Dirección de Envío</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Productos</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Detalles de Envío</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total y Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No se encontraron órdenes
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow
                  key={order.id}
                  sx={{
                    backgroundColor: order.status === 'delivered' ? '#d0f0c0' : '#f5f5f5',
                    '&:hover': {
                      backgroundColor: order.status === 'delivered' ? '#c8e6b9' : '#e0e0e0',
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="subtitle2">
                      No. de Órden: {order.orderNumber}
                    </Typography>
                    <Typography variant="body2">
                      Fecha:{' '}
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Método de Pago: {order.paymentMethod || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {order.userId && order.userData ? (
                      <>
                        <Typography variant="body2">
                          Cédula: {order.userData.cedula || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Nombre: {order.userData.firstName} {order.userData.lastName}
                        </Typography>
                        <Typography variant="body2">
                          Email: {order.userData.email || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Teléfono: {order.userData.phone || 'N/A'}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2">
                          Cédula: {order.cedula || 'N/A'}
                        </Typography>
                        <Typography variant="body2">
                          Nombre: {order.customerName} {order.customerLastname}
                        </Typography>
                        <Typography variant="body2">
                          Email: {order.customerEmail || 'N/A'}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.shippingDetails?.address || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      {order.shippingDetails?.province}, {order.shippingDetails?.canton}
                    </Typography>
                    <Typography variant="body2">
                      {order.shippingDetails?.parroquia}
                    </Typography>
                    <Typography variant="body2">
                      CP: {order.shippingDetails?.postalCode || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {order.items?.map((item, index) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="body2">• {item.productName || item.name}</Typography>
                        <Typography variant="caption">
                          Código: {item.productId || item.id}
                        </Typography>
                        <Typography variant="caption" sx={{ display: 'block' }}>
                          Cantidad: {item.quantity} x ${item.price?.toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      Transporte: {order.transport || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Día de Llegada:{' '}
                      {order.arrivalDate
                        ? new Date(order.arrivalDate).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Hora de Retiro:{' '}
                      {order.pickupTime
                        ? new Date(order.pickupTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" color="primary">
                      Total: ${order.total?.toFixed(2) || '0.00'}
                    </Typography>
                    <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                      <Select
                        value={order.status || 'review'}
                        onChange={async (e) => {
                          const newStatus = e.target.value;

                          if (order.status === 'shipped' && newStatus === 'delivered') {
                            try {
                              // Actualizar el estado en Firebase
                              await updateDoc(doc(db, 'orders', order.id), {
                                status: 'delivered',
                              });

                              // Actualizar el estado local para reflejar los cambios en la UI
                              setOrders((prevOrders) =>
                                prevOrders.map((o) =>
                                  o.id === order.id ? { ...o, status: 'delivered' } : o
                                )
                              );

                              alert('Estado cambiado a Orden Recibida');
                            } catch (error) {
                              console.error('Error al actualizar el estado:', error);
                              alert('Hubo un error al actualizar el estado. Intenta nuevamente.');
                            }
                          } else {
                            handleDispatch(order);
                          }
                        }}
                        size="small"
                        displayEmpty
                        disabled={order.status === 'delivered'}
                      >
                        {orderStatuses.map((status) => (
                          <MenuItem
                            key={status.value}
                            value={status.value}
                            disabled={
                              order.status === 'shipped' && status.value !== 'delivered'
                            }
                          >
                            {status.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {/* Botón para PDF Normal */}
                    <IconButton
                      color="primary"
                      onClick={() => handleGeneratePDFNormal(order)}
                      title="Generar PDF (Normal)"
                    >
                      <PictureAsPdf />
                    </IconButton>
                    {/* Botón para PDF Térmico */}
                    <IconButton
                      color="primary"
                      onClick={() => handleGeneratePDFThermal(order)}
                      title="Generar PDF Térmico"
                    >
                      <PictureAsPdf />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Despachar Orden</DialogTitle>
        <DialogContent>
          {selectedProducts.map((product, index) => (
            <Box
              key={index}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
            >
              <Box>
                <Typography variant="caption">
                  <strong>Código:</strong> {product.productId || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Producto:</strong> {product.productName}
                </Typography>
                <Typography variant="caption">
                  <strong>Cantidad Disponible:</strong> {product.quantity}
                </Typography>
              </Box>
              <TextField
                type="number"
                label="Empacar"
                InputProps={{
                  inputProps: { min: 0, max: product.quantity },
                }}
                value={product.packedQuantity}
                onChange={(e) =>
                  handleProductPacking(
                    index,
                    Math.min(
                      product.quantity,
                      Math.max(0, parseInt(e.target.value) || 0)
                    )
                  )
                }
                size="small"
                style={{ width: '100px' }}
              />
            </Box>
          ))}

          {/* Selección de Transporte */}
          <FormControl fullWidth margin="normal">
            <InputLabel id="transport-select-label">Transporte</InputLabel>
            <Select
              labelId="transport-select-label"
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
            >
              <MenuItem value="Servientrega">Servientrega</MenuItem>
              <MenuItem value="Tramaco">Tramaco</MenuItem>
              <MenuItem value="Transporte Local">Transporte Local</MenuItem>
              <MenuItem value="Entrega a Domicilio">Entrega a Domicilio</MenuItem>
            </Select>
          </FormControl>

          {/* Selección del Día de Llegada */}
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <DatePicker
              label="Seleccione el día de llegada"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>

          {/* Selección de la Hora de Retiro */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label="Hora de Retiro"
              value={pickupTime}
              onChange={(time) => setPickupTime(time)}
              renderInput={(params) => (
                <TextField {...params} fullWidth margin="normal" />
              )}
            />
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancelar
          </Button>
          <Button
            onClick={handleOrderDispatch}
            color="primary"
            variant="contained"
            disabled={
              !transport ||
              !selectedDate ||
              !pickupTime ||
              selectedProducts.some((product) => product.packedQuantity <= 0)
            }
          >
            Despachar Orden
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Orders;