import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { Helmet } from 'react-helmet';
import bannerImage from '../assets/banner.webp';
import Typography from '@mui/material/Typography';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <Box>
      <Navbar />
      {isHomePage && (
        <>
          {/* Preload del banner */}
          <Helmet>
            <link rel="preload" as="image" href={bannerImage} />
          </Helmet>
          <Box className="banner-container">
            <img 
              src={bannerImage}
              alt="Banner de la tienda"
              className="banner-image"
              width="1920" height="835"
              // loading="lazy" eliminado para optimizar LCP
            />
            <Typography variant="h2" className="slogan">
              <span className="slogan-main" style={{display: "inline"}}>
                IMPON<span className="slogan-orange">E</span>NTE, 
              </span>
              <span className="slogan-sub" style={{display: "inline", marginLeft: "0.5em"}}>
                como t<span className="slogan-orange">ú</span>
              </span>
            </Typography>
          </Box>
        </>
      )}
      {children}
    </Box>
  );
};

export default MainLayout;