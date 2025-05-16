import React, { useState, useEffect, useRef } from 'react';
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
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { getFirestore, collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import logo from '../../assets/perfil_1.png';
import logo_1 from '../../assets/perfil_1.1.png';
import { useTheme, useMediaQuery } from '@mui/material';

function Orders() {
  // Add these near the top with other state declarations
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
  const db = getFirestore();

  const pdfContentRef = useRef(null);

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
        arrivalDate: selectedDate.toISOString(), // Guardar día de llegada como ISO string
        pickupTime: pickupTime.toISOString(), // Guardar hora de retiro como ISO string
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
              .includes(searchTerm.toLowerCase()))
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
    fetchCompanyInfo(); // Obtiene los datos de la empresa
    fetchOrders(); // Obtiene los datos de las órdenes
  }, []);

  // Función para generar el PDF con html2canvas
  const generatePDF = async (order) => {
    const doc = new jsPDF();
    let yPos = 20;

    // Add logos side by side
    const logoWidth = 30;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;

    // Left logo
    doc.addImage(logo, 'PNG', margin, yPos, logoWidth, 30);
    
    // Right logo
    doc.addImage(logo_1, 'PNG', pageWidth - margin - logoWidth, yPos, logoWidth, 30);

    // Add company info in the center
    if (companyInfo) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(companyInfo.description || '', pageWidth / 2, yPos + 10, { align: 'center' });
      yPos += 35;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(companyInfo.address || '', pageWidth / 2, yPos, { align: 'center' });
      yPos += 7;
      doc.text(companyInfo.phone || '', pageWidth / 2, yPos, { align: 'center' });
      yPos += 7;
      doc.text(companyInfo.email || '', pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
    }

    // Add order details
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORDEN #${order.orderNumber || order.id || 'N/A'}`, margin, yPos);
    yPos += 10;

    // Add customer info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    if (order.userData) {
      doc.text(`Cliente: ${order.userData.firstName} ${order.userData.lastName}`, margin, yPos);
      yPos += 7;
      doc.text(`CI/RUC: ${order.userData.cedula || 'N/A'}`, margin, yPos);
      yPos += 7;
      doc.text(`Email: ${order.userData.email || 'N/A'}`, margin, yPos);
      yPos += 7;
      doc.text(`Teléfono: ${order.userData.phone || 'N/A'}`, margin, yPos);
      yPos += 15;
    }

    // Add items table
    const columns = ['Código', 'Producto', 'Cantidad', 'Precio Unit.', 'Total'];
    const data = order.items?.map(item => [
      item.productId || 'N/A',
      item.productName || item.name || 'N/A',
      item.quantity || 0,
      `$${(item.price || 0).toFixed(2)}`,
      `$${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [columns],
      body: data || [],
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // Add totals
    const totalsX = pageWidth - margin - 40;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPos);
    doc.text(`$${(order.subtotal || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.text('IVA (12%):', totalsX, yPos);
    doc.text(`$${(order.tax || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', totalsX, yPos);
    doc.text(`$${(order.total || 0).toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 20;

    // Add thank you message
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.text("Gracias por elegir TRENDY SHOP", pageWidth / 2, yPos, { align: 'center' });
    yPos += 5; // Add spacing between lines
    doc.text("¡Estilo, calidad y actitud en cada prenda!", pageWidth / 2, yPos, { align: 'center' });

    // Save the PDF
    doc.save(`order-${order.orderNumber}.pdf`);
  };

  // Add this function after generatePDF function
  const generateThermalPDF = async (order) => {
    try {
      // Create PDF with thermal paper dimensions (50mm width, auto height)
      const pdf = new jsPDF({
        unit: "mm",
        format: [50, 150], // Initial height, will adjust based on content
        orientation: "portrait",
      });
  
      const pageWidth = 50;
      const margin = 2;
      let yPos = -7;
      const lineHeight = 3;
  
      // Logo
      const rightImg = new Image();
      rightImg.src = logo_1;
      rightImg.onload = () => {
        // Add centered logo with better proportions
        pdf.addImage(
          rightImg,
          "PNG",
          margin + 1.5, // Center the 45mm wide image
          yPos,
          45,
          35
        );
        yPos += 30;
  
        // Company info with better formatting
        if (companyInfo) {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.text(companyInfo.description || "Descripción de la Empresa", pageWidth / 2, yPos, { align: "center" }
          );
          yPos += lineHeight;
          
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(6);
          pdf.text(companyInfo.address || "", pageWidth / 2, yPos, { align: "center" });
          yPos += lineHeight;
          pdf.text(companyInfo.phone || "", pageWidth / 2, yPos, { align: "center" });
          yPos += lineHeight;
          pdf.text(companyInfo.email || "N/A" , pageWidth / 2, yPos, { align: "center" });
          yPos += lineHeight;
        }
  
        // Divider line
        yPos += 1;
        pdf.setLineWidth(0.1);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += lineHeight;
  
        // Order details
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "bold");
        pdf.text(`ORDEN #${order.orderNumber || order.id || 'N/A'}`, pageWidth / 2, yPos, { align: "center" });
        yPos += lineHeight;

        // Divider line
        yPos += 1;
        pdf.setLineWidth(0.1);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += lineHeight;
  
        pdf.setFontSize(7);
        pdf.text("Fecha:", margin, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, margin + 14, yPos);
        yPos += lineHeight;

        pdf.setFont("helvetica", "bold");
        pdf.text("No. Cédula:", margin, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${order.userData?.cedula || 'N/A'}`, margin + 14, yPos);
        yPos += lineHeight;
  
        pdf.setFont("helvetica", "bold");
        pdf.text("Cliente:", margin, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${order.userData?.firstName} ${order.userData?.lastName}`, margin + 14, yPos);
        yPos += lineHeight;
  
        pdf.setFont("helvetica", "bold");
        pdf.text("No. Celular:", margin, yPos);
        pdf.setFont("helvetica", "normal");
        pdf.text(`${order.userData?.phone || 'N/A'}`, margin + 14, yPos);
        yPos += lineHeight;

        // Divider line
        yPos += 1;
        pdf.setLineWidth(0.1);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += lineHeight;

        // Items header
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.text("DETALLE DE PRODUCTOS", pageWidth / 2, yPos, { align: "center" });
        yPos += lineHeight;

        // Items
        pdf.setFontSize(6);
        order.items?.forEach((item) => {
          const itemTotal = (item.quantity || 0) * (item.price || 0);
          
          pdf.setFont("helvetica", "bold");
          pdf.text(item.productName || item.name || "N/A", margin, yPos);
          yPos += lineHeight;
          
          pdf.setFont("helvetica", "normal");
          pdf.text(`${item.quantity || 0} x $${(item.price || 0).toFixed(2)}`, margin, yPos);
          pdf.text(`$${itemTotal.toFixed(2)}`, pageWidth - margin - 10, yPos, { align: "right" });
          yPos += lineHeight;
        });

        // Divider line
        yPos += 1;
        pdf.setLineWidth(0.1);
        pdf.line(margin, yPos, pageWidth - margin, yPos);
        yPos += lineHeight;

        // Totals
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "bold");
        pdf.text("Subtotal:", margin, yPos);
        pdf.text(`$${(order.subtotal || 0).toFixed(2)}`, pageWidth - margin - 10, yPos, { align: "right" });
        yPos += lineHeight;

        pdf.text("IVA (12%):", margin, yPos);
        pdf.text(`$${(order.tax || 0).toFixed(2)}`, pageWidth - margin - 10, yPos, { align: "right" });
        yPos += lineHeight;

        pdf.setFontSize(8);
        pdf.text("TOTAL:", margin, yPos);
        pdf.text(`$${(order.total || 0).toFixed(2)}`, pageWidth - margin - 10, yPos, { align: "right" });
        yPos += lineHeight * 2;

        // Thank you message
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "italic");
        pdf.text("Gracias por elegir TRENDY SHOP", pageWidth / 2, yPos, { align: 'center' });
        yPos += 5; // Add spacing between lines
        pdf.text("¡Estilo, calidad y actitud en cada prenda!", pageWidth / 2, yPos, { align: 'center' });

        // Save the PDF
        pdf.save(`thermal-order-${order.orderNumber}.pdf`);
      };
    } catch (error) {
      console.error("Error generating thermal PDF:", error);
      alert("Error al generar el PDF térmico");
    }
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
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 3, 
          boxShadow: 3, 
          borderRadius: 2, 
          overflow: 'auto',
          '& .MuiTable-root': {
            minWidth: 1200, // Makes table scrollable horizontally
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
                    backgroundColor: order.status === 'delivered' ? '#d0f0c0' : '#f5f5f5', // Verde claro para "shipped", gris claro para otros
                    '&:hover': {
                      backgroundColor: order.status === 'delivered' ? '#c8e6b9' : '#e0e0e0', // Hover más oscuro para cada estado
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
                    <Typography variant="body2">
                      Cédula: {order.userData?.cedula || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Nombre: {order.userData?.firstName}{' '}
                      {order.userData?.lastName}
                    </Typography>
                    <Typography variant="body2">
                      Email: {order.userData?.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Teléfono: {order.userData?.phone || 'N/A'}
                    </Typography>
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
                        <Typography variant="body2">• {item.productName}</Typography>
                        <Typography variant="caption">
                          Código: {item.productId || 'N/A'}
                        </Typography>
                        <Typography variant="caption">
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
                            // Mostrar el formulario para otros cambios de estado
                            handleDispatch(order);
                          }
                        }}
                        size="small"
                        displayEmpty
                        disabled={order.status === 'delivered'} // Deshabilitar si la orden ya está recibida
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
                    <IconButton
                      color="primary"
                      onClick={() => generatePDF(order)}
                    >
                      <PictureAsPdf />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => generateThermalPDF(order)}
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

      {orders.map((order) => (
        <div
        key={order.id}
        id={`order-details-${order.id}`}
        style={{
          position: "absolute",
          left: "-9999px",
          top: "-9999px",
          padding: "20px",
          fontFamily: "Arial, sans-serif",
        }} // Oculta el contenido fuera de la pantalla
      >
      </div>
    ))}
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