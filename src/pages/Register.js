import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Fade,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Slide
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Phone,
  Email,
  Lock
} from '@mui/icons-material';
import { auth, db } from '../firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import customImage from '../assets/login.png';
import '../styles/Register.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ¡Modifica aquí!
  const imageWidth = '30%';
  const formWidth = '65%';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
      });

      navigate('/');
    } catch (error) {
      setError('Error al registrar. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" className="register-container" sx={{ py: 4 }}>
      <Grid
        container
        spacing={{ xs: 0, md: 4 }}
        alignItems="stretch"
        justifyContent="center"
        sx={{ minHeight: '75vh' }}
      >
        {/* Imagen a la IZQUIERDA */}
        <Grid
          item
          xs={12}
          md={5}
          sx={{
            display: { xs: 'block', md: 'flex' },
            justifyContent: 'center',
            alignItems: 'center',
            width: { xs: '100%', md: imageWidth },
            maxWidth: { xs: '100%', md: imageWidth },
            minWidth: 0,
            mb: { xs: 4, md: 0 },
            order: { xs: 1, md: 1 },
          }}
        >
          <Fade in timeout={1000}>
            <Box
              sx={{
                textAlign: 'center',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                '& img': {
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: { xs: '320px', md: '400px' },
                  transition: 'max-height 0.2s'
                }
              }}
            >
              <img
                src={customImage}
                className="custom-image"
                alt="Custom register illustration"
              />
            </Box>
          </Fade>
        </Grid>
        {/* Formulario a la DERECHA */}
        <Grid
          item
          xs={12}
          md={7}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            width: { xs: '100%', md: formWidth },
            maxWidth: { xs: '100%', md: formWidth },
            minWidth: 0,
            order: { xs: 2, md: 2 },
          }}
        >
          <Slide direction="right" in timeout={800}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, width: '100%', boxSizing: 'border-box' }}>
              <Typography variant="h5" align="center" gutterBottom>
                <strong>CREAR CUENTA</strong>
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{ mt: 2 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                    <TextField
                      required
                      fullWidth
                      id="name"
                      label="Nombres Completos"
                      name="name"
                      autoComplete="name"
                      variant="outlined"
                      value={formData.name}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ width: { xs: '100%', sm: '48%' } }}>
                    <TextField
                      required
                      fullWidth
                      id="email"
                      label="Email"
                      name="email"
                      autoComplete="email"
                      variant="outlined"
                      value={formData.email}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '25%' } }}>
                    <TextField
                      required
                      fullWidth
                      id="phone"
                      label="Teléfono"
                      name="phone"
                      autoComplete="tel"
                      variant="outlined"
                      value={formData.phone}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '35%' } }}>
                    <TextField
                      required
                      fullWidth
                      name="password"
                      label="Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="new-password"
                      variant="outlined"
                      value={formData.password}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ width: { xs: '100%', sm: '35%' } }}>
                    <TextField
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirmar Contraseña"
                      type={showPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      autoComplete="new-password"
                      variant="outlined"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sx={{ width: '100%' }}>
                    <Box textAlign="center" sx={{ mt: 2 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        disabled={loading}
                        sx={{
                          py: 1.5,
                          position: 'relative',
                          width: { xs: '100%', sm: '60%' },
                          mx: 'auto'
                        }}
                      >
                        {loading ? (
                          <CircularProgress
                            size={24}
                            sx={{
                              color: 'white',
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              marginTop: '-12px',
                              marginLeft: '-12px',
                            }}
                          />
                        ) : 'REGISTRARSE'}
                      </Button>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        ¿Ya tienes una cuenta?{' '}
                        <Button component={RouterLink} to="/login" sx={{ textTransform: 'none', p: 0, minWidth: 0 }}>
                          Inicia Sesión
                        </Button>
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Slide>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Register;