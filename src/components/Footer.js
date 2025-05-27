import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import '../styles/Footer.css';

function Footer() {
  return (
    <Box component="footer" className="footer">
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4} className="footer-section">
            <Typography variant="h6" className="footer-title">
              Sobre Nosotros
            </Typography>
            <Typography variant="body2" className="typography-body2">
              Estilo, calidad y carácter en cada prenda. Para hombres que imponen presencia.
              <br />
              Trendry Shop – Imponente, como tú.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4} className="footer-section">
            <Typography variant="h6" className="footer-title">
              Soporte
            </Typography>
            <Box>
              <Link href="/contact" className="footer-link">Contacto</Link>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4} className="footer-section">
            <Typography variant="h6" className="footer-title">
              Síguenos
            </Typography>
            <Box className="social-icons">
              <IconButton
                color="inherit"
                href="https://www.facebook.com/profile.php?id=61574735422056"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Trendry Shop"
              >
                <FacebookIcon />
              </IconButton>
              <IconButton
                color="inherit"
                href="https://www.instagram.com/trendyshopec_/?igsh=MXF2djdsazhhejhiZg%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Trendry Shop"
              >
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        <Typography variant="body2" className="copyright">
          © {new Date().getFullYear()} TRENDY SHOP. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer;