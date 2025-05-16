import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import bannerImage from '../assets/banner.jpg';
import Typography from '@mui/material/Typography';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <Box>
      <Navbar />
      {isHomePage && (
        <Box className="banner-container">
          <img 
            src={bannerImage}
            alt="Fashion Banner" 
            className="banner-image"
          />
          <Typography variant="h2" className="slogan">
            Imponente, como tú
          </Typography>
        </Box>
      )}
      {children}
    </Box>
  );
};

export default MainLayout;