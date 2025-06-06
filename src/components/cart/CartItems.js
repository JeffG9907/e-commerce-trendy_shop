import React, { memo } from 'react';
import { Grid, Card, CardContent, CardMedia, Typography, IconButton, Box, Button } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { convertGoogleDriveUrl } from '../../utils/googleDriveUtils';

const CartItems = memo(({ items, total, onRemoveItem, onCheckout }) => (
  <>
    <Grid container spacing={3}>
      {items.map((item) => (
        <Grid item xs={12} md={8} key={item.id}>
          <Card className="cart-item" sx={{ display: 'flex', flexDirection: 'row' }}>
            <CardMedia
              component="img"
              loading="lazy"
              sx={{ width: 200, height: 200, objectFit: 'contain', backgroundColor: '#f5f5f5' }}
              image={convertGoogleDriveUrl(item.imageUrls?.[0] || '/placeholder-image.jpg')}
              alt={item.productName || 'Producto'}
            />
            {/* ... rest of the card content ... */}
          </Card>
        </Grid>
      ))}
    </Grid>
    {/* ... total and checkout button ... */}
  </>
));

export default CartItems;