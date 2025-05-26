import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, CircularProgress
} from '@mui/material';
import {
  getFirestore, collection, query, where, getDocs, deleteDoc,
  doc, setDoc, getDoc
} from 'firebase/firestore';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import QrCodeIcon from '@mui/icons-material/QrCode';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { getAuth } from 'firebase/auth';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Checkout.css';

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

function Checkout() {
  // Inicializa el estado con valores predeterminados
  const location = useLocation();
  const { shippingAddress = {}, cartItems = [], subtotal: initialBubTotal = 0,  total: initialTotal = 0 } = location.state || {};
  const [shippingCost, setShippingCost] = useState(initialBubTotal);
  const [subTotal, setSubTotal] = useState(0);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  // Add this after other state declarations
  const [selectedBank, setSelectedBank] = useState('');
  
  // Add this function before the return statement
  const handleBankSelection = (bankName) => {
    setSelectedBank(bankName);
  };
  const [orderNumber, setOrderNumber] = useState('');
  const [paymentMethods, setPaymentMethods] = useState({});
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const loadPaymentMethods = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'paymentMethods'));
      const methodsData = {};
      querySnapshot.forEach((doc) => {
        if (doc.data().enabled) {
          methodsData[doc.id] = doc.data();
        }
      });
      setPaymentMethods(methodsData);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    }
  };

  // Update the handlePaymentMethodChange function
  const handlePaymentMethodChange = (methodId) => {
    setPaymentType(methodId);
    if (methodId === 'transfer') {
      setShowBankDetails(true);
      setShowQR(false);
      setShowPayPal(false);
    } else if (methodId === 'deuna') {
      setShowQR(true);
      setShowBankDetails(false);
      setShowPayPal(false);
    } else if (methodId === 'paypal') {
      setShowPayPal(true);
      setShowBankDetails(false);
      setShowQR(false);
    }
  };

  if (!shippingAddress) {
    console.error('Error: shippingAddress no fue proporcionado.');
    return <div>Error: No se proporcionó una dirección de envío.</div>;
  }
  
  const fetchProfileAddress = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfileAddress({
          province: userData.province,
          canton: userData.canton,
          parroquia: userData.parroquia,
          postalCode: userData.postalCode,
          address: userData.address,
        });
      }
    } catch (error) {
      console.error('Error al obtener la dirección del perfil:', error);
    }
  };

  const determineShippingCost = (parroquia, canton) => {
    let cost = 5; // Valor predeterminado
    if (!parroquia || !canton) {
      console.error("La parroquia o el cantón no están disponibles.");
      return cost; // Cobrar $5 si no hay datos como medida de seguridad
    }

    // Normalizar los valores
    const normalizedParroquia = parroquia.trim().toLowerCase();
    const normalizedCanton = canton.trim().toLowerCase();

    console.log("Verificando parroquia:", normalizedParroquia);
    console.log("Verificando cantón:", normalizedCanton);

    // Verificar si la parroquia es "calderón"
    if (normalizedParroquia === 'calderón') {
      console.log("Envío gratis para dirección en la parroquia Calderón.");
      cost = 0; // Envío gratis
    } 
    // Verificar si el cantón es "quito"
    else if (normalizedCanton === 'quito') {
      console.log("Cobrar $3 por envío dentro del cantón Quito.");
      cost = 3; // Costo dentro de Quito
    } 
    // Si no coincide con "Quito" o "Calderón", está fuera de Quito
    else {
      console.log("Cobrar $5 por envío fuera del cantón Quito.");
      cost = 5; // Costo fuera de Quito
    }

    return cost;
  };

  const calculateTotal = () => {
    const itemsTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalWithShipping = itemsTotal + shippingCost;
    console.log("Costo total de productos:", itemsTotal);
    console.log("Costo de envío:", shippingCost);
    setSubTotal(itemsTotal); // Actualiza el subtotal
    setTotal(totalWithShipping); // Actualiza el total incluyendo el costo de envío
  };

  // Calcular el costo de envío al cargar el componente
  useEffect(() => {
    const cost = determineShippingCost(shippingAddress.parroquia, shippingAddress.canton);
    setShippingCost(cost);
  }, [shippingAddress]);

  // Calcular el total después de que el costo de envío se actualice
  useEffect(() => {
    calculateTotal();
  }, [cartItems, shippingCost]);

  useEffect(() => {
    const generatedOrderNumber = Date.now().toString(36).toUpperCase();
    setOrderNumber(generatedOrderNumber);
  }, []);

  const handleCreateOrder = async () => {
    if (!paymentType) {
      alert('Por favor seleccione un método de pago');
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      // Create the order
      const userOrdersRef = doc(db, 'orders', `${user.uid}_${orderNumber}`);
      const orderData = {
        orderNumber,
        userId: user.uid,
        items: cartItems,
        subtotal: parseFloat(subTotal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        paymentMethod: paymentType,
        status: 'review',
        createdAt: new Date().toISOString(),
        customerName: user.displayName || '',
        customerEmail: user.email || '',
        shippingDetails: shippingAddress,
        paymentDetails: paymentType === 'Transferencia' ? 'Transferencia Bancaria' : 'Pago con DeUna',
      };

      await setDoc(userOrdersRef, orderData);

      // Delete all items from the user's cart
      const cartRef = collection(db, 'carts');
      const q = query(cartRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);

      navigate('/orders');
    } catch (error) {
      console.error('Error creando la orden:', error);
      alert('Error al procesar la orden. Por favor intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  // Add this useEffect to wait for payment methods to load
  useEffect(() => {
    if (paymentMethods.paypal?.details?.clientId) {
      console.log('PayPal client ID loaded:', paymentMethods.paypal.details.clientId);
    }
  }, [paymentMethods]);

  return (
    <PayPalScriptProvider options={{ 
      "client-id": "AU0OQZSo4a84cF6jMqVkfjWifH96dIZIA87PKC5vMaBvU7PnW86zSQtqLKuYJ8QEC0yQ558nGd_k0FIQ",
      currency: "USD",
      components: "buttons,hosted-fields",
      intent: "capture",
      "data-client-token": paymentMethods.paypal?.details?.clientToken
    }}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Finalizar Pedido
        </Typography>

        {loading ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ mt: 2 }}>
              Procesando pedido...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Payment Methods Section */}
            <Card className="payment-section" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Seleccionar Método de Pago
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  {Object.entries(paymentMethods).map(([methodId, method]) => (
                    <Button
                      key={methodId}
                      variant={paymentType === methodId ? 'contained' : 'outlined'}
                      onClick={() => handlePaymentMethodChange(methodId)}
                      startIcon={
                        methodId === 'transfer' ? <AccountBalanceIcon /> :
                        methodId === 'deuna' ? <QrCodeIcon /> :
                        <CreditCardIcon />
                      }
                      fullWidth
                      sx={{ flexBasis: { xs: '100%', sm: '30%' } }}
                    >
                      {method.displayName || methodId}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Box className="order-summary" sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <strong>Resumen del Pedido</strong>
              </Typography>
              <Typography variant="body1">
                <strong>Costo de Envío:</strong> 
                {shippingCost === 0 
                  ? "Gratis (Parroquia Calderón)" 
                  : `$${shippingCost.toFixed(2)} ${
                      shippingCost === 3 ? "(Dentro de Quito)" : "(Fuera de Quito)"
                    }`}
              </Typography>
              <Typography variant="h5">
                <strong>Total a Pagar:</strong> ${total.toFixed(2)}
              </Typography>
            </Box>

            {/* Transfer Dialog */}
            <Dialog open={showBankDetails} onClose={() => setShowBankDetails(false)} fullWidth maxWidth="md">
              <DialogTitle sx={{ textAlign: 'center' }}><strong>DETALLE DE TRANSFERENCIA</strong></DialogTitle>
              <DialogContent className="transfer-details">
                <Typography className="h6" gutterBottom><strong>DATOS DEL TITULAR</strong></Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }} className="line-reduced-spacing">
                  <Typography variant="body1">
                    <strong>Titular:</strong> {paymentMethods.transfer?.details?.holderName || 'No disponible'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>No. Cédula:</strong> {paymentMethods.transfer?.details?.identification || 'No disponible'}
                  </Typography>
                </Box>
                <Typography className="h6" gutterBottom><strong>CUENTAS DISPONIBLES</strong></Typography>
                <Grid container spacing={2}>
                  {paymentMethods.transfer?.details?.accounts?.map((account, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                      <Card
                        className={`bank-account-card ${selectedBank === account.bank ? 'selected' : ''}`}
                        onClick={() => handleBankSelection(account.bank)}
                        sx={{ 
                          cursor: 'pointer', 
                          border: selectedBank === account.bank ? '2px solid #1976d2' : '1px solid #ccc',
                          p: 2,
                          textAlign: 'center'
                        }}
                      >
                        <img 
                          src={convertGoogleDriveUrl(account.url_image)} 
                          alt={`${account.bank} logo`} 
                          style={{ maxWidth: '100%', height: '100px', objectFit: 'contain', marginBottom: '8px' }} 
                        />
                        <Typography variant="body1"><strong>{account.bank}</strong></Typography>
                        <Typography variant="body2">
                          <strong>Tipo:</strong> {account.accountType}
                        </Typography>
                        <Typography variant="body2">
                          <strong>N°:</strong> {account.accountNumber}
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Typography className="h6" gutterBottom sx={{ mt: 4, textAlign: 'center' }}><strong>¿CÓMO REALIZAR LA TRANSFERENCIA?</strong></Typography>
                  <ol style={{ textAlign: 'left' }}>
                    <li>Selecciona una cuenta bancaria: <strong>({selectedBank})</strong></li>
                    <li>Verifica los datos del titular.</li>
                    <li>Ingresa el monto exacto <strong>(${(total + shippingCost).toFixed(2)})</strong> y menciona el número de orden <strong>({orderNumber})</strong> en la referencia.</li>
                  </ol>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowBankDetails(false)}>Cerrar</Button>
                <Button 
                  variant="contained" 
                  onClick={handleCreateOrder}
                  disabled={!selectedBank}
                >
                  Confirmar Pedido
                </Button>
              </DialogActions>
            </Dialog>

            {/* DeUna Dialog */}
            <Dialog open={showQR} onClose={() => setShowQR(false)}>
              <DialogTitle><strong>PAGAR CON DeUna</strong></DialogTitle>
              <DialogContent>
                <Box className="qr-container" sx={{ textAlign: 'center' }}>
                  {paymentMethods.deuna?.details?.qrImageUrl && (
                    <img 
                      src={convertGoogleDriveUrl(paymentMethods.deuna.details.qrImageUrl)} 
                      alt="QR Code" 
                      style={{ width: 200, height: 200 }} 
                    />
                  )}
                  <Typography className="h6" gutterBottom sx={{ mt: 4, textAlign: 'center' }}><strong>¿CÓMO REALIZAR EL PAGO?</strong></Typography>
                    <ol style={{ textAlign: 'left' }}>
                      <li>Escanéa el código QR que muestra en la pantalla.</li>
                      <li>Verifica los datos del titular.</li>
                      <li>Ingresa el monto exacto <strong>(${(total).toFixed(2)})</strong> y menciona el número de orden <strong>({orderNumber})</strong> en el motivo.</li>
                    </ol>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowQR(false)}>Cerrar</Button>
                <Button variant="contained" onClick={handleCreateOrder}>
                  Confirmar Pedido
                </Button>
              </DialogActions>
            </Dialog>

            {/* PayPal Dialog */}
            <Dialog open={showPayPal} onClose={() => setShowPayPal(false)} maxWidth="sm" fullWidth>
              <DialogTitle><strong>PAGO CON PAYPAL</strong></DialogTitle>
              <DialogContent>
                <Box sx={{ width: '100%', my: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Total a pagar:</strong> ${total.toFixed(2)}
                  </Typography>
                  {paymentMethods.paypal?.details?.clientId ? (
                    <PayPalButtons
                      fundingSource={undefined}
                      style={{
                        layout: "vertical",
                        shape: "rect",
                        label: "pay"
                      }}
                      createOrder={(data, actions) => {
                        return actions.order.create({
                          purchase_units: [{
                            amount: {
                              currency_code: "USD",
                              value: total.toFixed(2)
                            },
                            shipping: {
                              name: {
                                full_name: auth.currentUser?.displayName || ''
                              },
                              address: {
                                address_line_1: shippingAddress.address,
                                admin_area_2: shippingAddress.canton,
                                admin_area_1: shippingAddress.province,
                                postal_code: shippingAddress.postalCode,
                                country_code: 'EC'
                              }
                            }
                          }],
                          application_context: {
                            shipping_preference: "SET_PROVIDED_ADDRESS",
                            user_action: "PAY_NOW"
                          },
                          payer: {
                            email_address: auth.currentUser?.email || '',
                            name: {
                              given_name: auth.currentUser?.displayName?.split(' ')[0] || '',
                              surname: auth.currentUser?.displayName?.split(' ').slice(1).join(' ') || ''
                            }
                          }
                        });
                      }}
                      onApprove={async (data, actions) => {
                        const details = await actions.order.capture();
                        if (details.status === "COMPLETED") {
                          handleCreateOrder();
                        }
                      }}
                    />
                  ) : (
                    <Typography color="error">
                      Error al cargar PayPal. Por favor, intente más tarde.
                    </Typography>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowPayPal(false)}>Cancelar</Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Container>
    </PayPalScriptProvider>
  );
}

export default Checkout;