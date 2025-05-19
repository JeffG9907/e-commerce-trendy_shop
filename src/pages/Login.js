import React, { useState } from 'react';
import { 
  Container, Grid, Button, TextField, Typography, Box, Paper, Alert, Link, 
  FormControlLabel, Checkbox, CircularProgress, Fade, Slide 
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import '../styles/Login.css'; // Asegúrate de que este archivo tenga estilos adaptables
import customImage from '../assets/login.png';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      switch (error.code) {
        case 'auth/invalid-email':
          setError('Invalid email address');
          break;
        case 'auth/user-not-found':
          setError('No user found with this email');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password');
          break;
        default:
          setError('An error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" className="login-container" sx={{ py: 4 }}>
      <Grid container spacing={3} alignItems="center" justifyContent="center">
        <Grid item xs={12} sm={6} md={6} lg={5}>
          <Fade in timeout={1000}>
            <Box sx={{ 
              display: { xs: 'none', sm: 'block' }, 
              textAlign: 'center',
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                maxHeight: '440px',
                '@media (max-width: 900px)': {
                  maxHeight: '280px',
                }
              }
            }}>
              <img 
                src={customImage} 
                className="custom-image" 
                alt="Custom login illustration" 
              />
            </Box>
          </Fade>
        </Grid>

        <Grid item xs={12} sm={8} md={8} lg={7}>
          <Slide direction="left" in timeout={800}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              <Typography variant="h5" align="center" gutterBottom>
                INICIAR SESIÓN
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
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  variant="outlined"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Contraseña"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <FormControlLabel
                  control={<Checkbox name="remember" color="primary" />}
                  label="Recuérdame"
                />
                <Box textAlign="center" sx={{ mt: 3 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    fullWidth
                    disabled={loading}
                    sx={{ 
                      py: 1.5,
                      position: 'relative'
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
                    ) : 'Login'}
                  </Button>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    ¿Aún no tienes una cuenta?{' '}
                    <Link component={RouterLink} to="/register" variant="body2">
                      Registrarse
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Slide>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Login;