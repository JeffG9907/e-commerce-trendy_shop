import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { Helmet } from 'react-helmet';
import bannerImage from '../assets/banner.webp';
import bannerImageSmall from '../assets/banner-small.webp';
import bannerImageMedium from '../assets/banner-medium.webp';
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
          <Helmet>
            <link rel="preload" as="image" href={bannerImage} />
          </Helmet>
          <Box className="banner-container">
            <picture>
              <source
                media="(max-width: 640px)"
                srcSet={bannerImageSmall}
                type="image/webp"
              />
              <source
                media="(max-width: 1024px)"
                srcSet={bannerImageMedium}
                type="image/webp"
              />
              <img 
                src={bannerImage}
                alt="Descubre las últimas tendencias en moda - TrendyShop"
                className="banner-image"
                width="1920"
                height="835"
                fetchpriority="high"
                decoding="async"
                style={{
                  backgroundColor: '#f5f5f5',
                  objectFit: 'cover',
                }}
              />
            </picture>
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