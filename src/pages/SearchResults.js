import React from 'react';
import { 
  Container, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Button,
  Box 
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import '../styles/SearchResults.css';

function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchResults = location.state?.results || [];
  const searchTerm = location.state?.searchTerm || '';

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <Container className="search-results-container" maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Resultados de búsqueda para: "{searchTerm}"
      </Typography>
      
      {searchResults.length === 0 ? (
        <Box className="no-results">
          <Typography variant="h6">
            No se encontraron productos que coincidan con tu búsqueda
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {searchResults.map((product) => (
            <Grid item key={product.id} xs={12} sm={6} md={4}>
              <Card className="product-card">
                <CardMedia
                  component="img"
                  height="200"
                  image={product.imageUrl}
                  alt={product.name}
                  className="product-image"
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="h2">
                    {product.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="product-description">
                    {product.description}
                  </Typography>
                  <Typography variant="h6" color="primary" className="product-price">
                    ${product.price}
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => handleViewDetails(product.id)}
                    fullWidth
                  >
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default SearchResults;