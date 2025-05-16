import React, { useState } from 'react';
import { 
  Container, Grid, Button, TextField, Typography, Box, Paper, Alert 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import '../styles/Register.css'; // Asegúrate de incluir este archivo CSS
import customImage from '../assets/login.png';

function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        role: 'client',
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Email ya registrado');
          break;
        case 'auth/invalid-email':
          setError('Email inválido');
          break;
        case 'auth/weak-password':
          setError('La contraseña debe tener al menos 6 caracteres');
          break;
        default:
          setError('Ocurrió un error durante el registro');
      }
    }
  };

  return (
    <Container className="register-container">
      <Grid container spacing={3} alignItems="center" justifyContent="center">
        {/* Imagen en el lado izquierdo */}
        <Grid item xs={12} md={5}>
          <Box className="custom-image-wrapper">
            <img 
              src={customImage} 
              className="custom-image" 
              alt="Registro ilustración personalizada" 
            />
          </Box>
        </Grid>

        {/* Formulario de registro */}
        <Grid item xs={12} md={7}>
          <Paper className="register-paper" elevation={3}>
            <Typography variant="h5" className="register-title">
              REGISTRARSE
            </Typography>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
            <Box 
              component="form" 
              onSubmit={handleSubmit} 
              className="register-form"
            >
              <TextField
                required
                fullWidth
                label="Nombres"
                autoFocus
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
              <TextField
                required
                fullWidth
                label="Apellidos"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
              <TextField
                required
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <TextField
                required
                fullWidth
                label="Contraseña"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <TextField
                fullWidth
                label="Número Celular"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
              <Button
                type="submit"
                variant="contained"
                className="register-submit"
              >
                Crear Cuenta
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Register;