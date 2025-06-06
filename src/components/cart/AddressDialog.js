import React, { memo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions /* ... other imports */ } from '@mui/material';

const AddressDialog = memo(({ open, onClose, useDefaultAddress, setUseDefaultAddress, userData, setUserData, onConfirm /* ... other props */ }) => (
  <Dialog 
    open={open} 
    onClose={onClose}
    maxWidth="md"
    fullWidth
  >
    {/* ... existing dialog content ... */}
  </Dialog>
));

export default AddressDialog;