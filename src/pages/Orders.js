import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, CardMedia,
  Box, Chip
} from '@mui/material';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();

  // Fetch user orders
  useEffect(() => {
    let unsubscribe;
    const initAuth = async () => {
      try {
        unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (!user) {
            navigate('/login');
            return;
          }

          try {
            const ordersRef = collection(db, 'orders');
            const q = query(
              ordersRef,
              where('userId', '==', user.uid)
            );
            const querySnapshot = await getDocs(q);
            const ordersData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setOrders(ordersData);
          } catch (error) {
            console.error('Error fetching orders:', error);
          }
        });
      } catch (error) {
        console.error('Auth error:', error);
      }
    };

    initAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigate, db]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'review': return 'info';
      case 'paid': return 'success';
      case 'no_paid': return 'error';
      case 'shipped': return 'warning';
      case 'delivered': return 'primary';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'left' }}>
        Mis Órdenes
      </Typography>

      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            No tienes órdenes realizadas
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {orders.map((order) => (
            <Grid item xs={12} sm={6} md={5.5} key={order.id}>
              <Card sx={{ display: 'flex', flexDirection: 'column', textAlign: 'left', height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">
                      <strong>Orden #{order.orderNumber}</strong>
                    </Typography>
                    <Chip
                      label={
                        order.status === 'review' ? 'En Revisión' :
                        order.status === 'paid' ? 'Pago Recibido' :
                        order.status === 'no_paid' ? 'Pago No Recibido' :
                        order.status === 'shipped' ? 'Orden Enviada' :
                        order.status === 'delivered' ? 'Orden Recibida' :
                        order.status
                      }
                      color={getStatusColor(order.status)}
                    />
                  </Box>
                  <Typography color="textSecondary" gutterBottom>
                    <strong>Fecha:</strong> {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Datos del Cliente:</strong>
                    </Typography>
                    <Typography>
                      <strong>Email:</strong> {order.customerEmail || 'No especificado'}
                    </Typography>
                    <Typography>
                      <strong>Nombre:</strong> {order.customerName || 'No especificado'}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Datos de Envío:</strong>
                    </Typography>
                    <Typography>
                      <strong>Dirección:</strong> {order.shippingDetails?.address || 'No especificado'}
                    </Typography>
                    <Typography>
                      <strong>Provincia:</strong> {order.shippingDetails?.province || 'No especificado'}
                    </Typography>
                    <Typography>
                      <strong>Cantón:</strong> {order.shippingDetails?.canton || 'No especificado'}
                    </Typography>
                    <Typography>
                      <strong>Parroquia:</strong> {order.shippingDetails?.parroquia || 'No especificado'}
                    </Typography>
                    <Typography>
                      <strong>Código Postal:</strong> {order.shippingDetails?.postalCode || 'No especificado'}
                    </Typography>
                  </Box>
                  <Typography gutterBottom>
                    <strong>Método de Pago:</strong> {order.paymentMethod || 'No especificado'}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Productos:</strong>
                    </Typography>
                    {order.items.map((item, index) => (
                      <Card key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CardMedia
                          component="img"
                          sx={{ width: 100, height: 100, objectFit: 'cover' }}
                          image={item.imageUrls?.[0] || '/placeholder-image.jpg'}
                          alt={item.productName}
                        />
                        <Box sx={{ ml: 2, flex: 1 }}>
                          <Typography variant="subtitle1">{item.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Cantidad:</strong> {item.quantity} - <strong>Precio:</strong> ${item.price.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>Subtotal:</strong> ${(item.price * item.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      </Card>
                    ))}
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      <strong>Costo de Envío:</strong> ${order.shippingCost?.toFixed(2) || '0.00'}
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 2, textAlign: 'right' }}>
                    <Typography variant="h6" color="primary">
                      <strong>Total:</strong> ${(order.total).toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default Orders;