import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, CircularProgress, Box,
  Select, MenuItem, FormControl, InputLabel, IconButton
} from '@mui/material';
import { ShoppingCart, Edit, Delete, Add, Print } from '@mui/icons-material';
import { getFirestore, collection, getDocs, updateDoc, doc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';

const generateBarcode = () => {
  const prefix = '789'; // Standard prefix for internal barcodes
  const randomDigits = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  const barcode = prefix + randomDigits;
  
  // Calculate check digit using EAN-13 algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  
  return barcode + checkDigit;
};

const convertGoogleDriveUrl = (url) => {
  if (!url) return '';
  if (url.includes('uc?export=view')) return url;

  let id = '';
  if (url.includes('drive.google.com/file/d/')) {
    id = url.split('/file/d/')[1].split('/')[0];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  } else if (url.includes('drive.google.com/open?id=')) {
    id = url.split('open?id=')[1];
  } else if (url.includes('drive.google.com/uc?id=')) {
    id = url.split('uc?id=')[1];
  } else {
    const matches = url.match(/[-\w]{25,}/);
    id = matches ? matches[0] : '';
  }

  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
};

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [open, setOpen] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [purchaseQuantities, setPurchaseQuantities] = useState({});
  const [companyInfo, setCompanyInfo] = useState(null);
  const [currentProduct, setCurrentProduct] = useState({
    id: '',
    name: '',
    description: '',
    purchasePrice: '',
    margin: '',
    price: '',
    imageUrls: [],
    categoryId: '',
    stock: '',
    status: 'NORMAL',
    barcode: ''
  });
  const db = getFirestore();
 
  const generatePriceLabel = (product) => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [30, 50] // 50mm x 25mm
    });
  
    // Black banner at top
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 50, 8, 'F'); // Increased height from 6 to 8
  
    // Store name in white on black banner
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16); // Increased from 12
    doc.setFont('times', 'bold');
    doc.text(product.storeName || 'TRENDY SHOP', 25, 6, { align: 'center' }); // Adjusted y position
  
    // Reset text color to black
    doc.setTextColor(0, 0, 0);
  
    // Generate barcode
    const canvas = document.createElement('canvas');
    JsBarcode(canvas, product.barcode || '123456789013', {
      format: 'EAN13',
      width: 2,
      height: 25,
      fontSize: 14,
      displayValue: true,
      textAlign: 'center',
      textMargin: 5,
      margin: 0,
      font: 'monospace',
      fontOptions: 'normal' // Changed from 'bold' to 'normal'
    });
  
    // Add barcode image
    const barcodeImage = canvas.toDataURL('image/png');
    doc.addImage(barcodeImage, 'PNG', 2, 9, 46, 12); // Adjusted y position
  
    // Product name and description
    const nameWords = (product.name || '').split(' ').slice(0, 2).join(' ');
    const description = product.description || '';
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`${nameWords} - ${description}`, 25, 25, { 
      align: 'center',
      maxWidth: 46
    });
  
    // Price with currency symbol
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`$ ${product.price || '19.99'}`, 25, 29, { align: 'center' });
  
    doc.save(`price-label-${product.id || 'producto'}.pdf`);
  };

  const fetchCompanyInfo = async () => {
    try {
      const companyDoc = await getDoc(doc(db, 'config', 'company'));
      if (companyDoc.exists()) {
        setCompanyInfo(companyDoc.data());
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [productsSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(collection(db, 'products')).catch(error => {
          console.error('Error fetching products:', error);
          return { docs: [] };
        }),
        getDocs(collection(db, 'categories')).catch(error => {
          console.error('Error fetching categories:', error);
          return { docs: [] };
        })
      ]);

      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setProducts(productsData);
      setCategories(categoriesData);
      setFilteredProducts(productsData);
    } catch (error) {
      console.error('Error in fetchData:', error);
      // Show user-friendly error message
      alert('Error loading data. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleOpen = (product = null) => {
    if (product) {
      setCurrentProduct({
        id: product.id,
        name: product.name || '',
        description: product.description || '',
        purchasePrice: product.purchasePrice || '',
        margin: product.margin || '',
        price: product.price || '',
        imageUrls: product.imageUrls || [],
        categoryId: product.categoryId || '',
        stock: product.stock || '',
        status: product.status || 'NORMAL',
        barcode: product.barcode || ''
      });
      setEditMode(true);
    } else {
      setCurrentProduct({
        id: '',
        name: '',
        description: '',
        purchasePrice: '',
        margin: '',
        price: '',
        imageUrls: [],
        categoryId: '',
        stock: '',
        status: 'NORMAL',
        barcode: generateBarcode()
      });
      setEditMode(false);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentProduct({
      id: '',
      name: '',
      description: '',
      purchasePrice: '',
      margin: '',
      price: '',
      imageUrls: [],
      categoryId: '',
      stock: '',
      status: 'NORMAL',
      barcode: ''
    });
  };

  const handleSave = async () => {
    try {
      if (!currentProduct.id || !currentProduct.name) {
        alert('El ID del producto y el nombre son obligatorios.');
        return;
      }

      const productData = {
        name: currentProduct.name.trim(),
        description: currentProduct.description.trim(),
        purchasePrice: parseFloat(currentProduct.purchasePrice) || 0,
        margin: parseFloat(currentProduct.margin) || 0,
        price: parseFloat(currentProduct.price) || 0,
        imageUrls: currentProduct.imageUrls.map(url => convertGoogleDriveUrl(url)),
        categoryId: currentProduct.categoryId,
        stock: parseInt(currentProduct.stock) || 0,
        status: currentProduct.status,
        barcode: currentProduct.barcode || generateBarcode()
      };

      if (editMode) {
        await updateDoc(doc(db, 'products', currentProduct.id), productData);
      } else {
        await setDoc(doc(db, 'products', currentProduct.id.trim()), productData);
      }

      handleClose();
      fetchData();
    } catch (error) {
      console.error('Error guardando el producto:', error);
      alert('Error guardando el producto. Por favor, intenta de nuevo.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchData();
      } catch (error) {
        console.error('Error eliminando el producto:', error);
      }
    }
  };

  const handlePurchaseOpen = () => {
    const initialQuantities = {};
    products.forEach((product) => {
      initialQuantities[product.id] = 0;
    });
    setPurchaseQuantities(initialQuantities);
    setPurchaseOpen(true);
  };

  const handlePurchaseClose = () => {
    setPurchaseOpen(false);
    setPurchaseQuantities({});
  };

  const handleQuantityChange = (productId, value) => {
    setPurchaseQuantities((prevQuantities) => ({
      ...prevQuantities,
      [productId]: Math.max(0, parseInt(value) || 0),
    }));
  };

  const handleSavePurchase = async () => {
    try {
      const updates = products.map(async (product) => {
        const newStock = (product.stock || 0) + (purchaseQuantities[product.id] || 0);
        await updateDoc(doc(db, 'products', product.id), { stock: newStock });
      });

      await Promise.all(updates);
      alert('Compra guardada exitosamente.');
      handlePurchaseClose();
      fetchData();
    } catch (error) {
      console.error('Error guardando la compra:', error);
      alert('Error guardando la compra. Por favor, intenta de nuevo.');
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Administrar Productos
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Buscar por nombre o ID"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
        />
        <FormControl fullWidth>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={selectedCategory}
            onChange={handleCategoryChange}
            label="Categoría"
          >
            <MenuItem value="">Todas</MenuItem>
            {categories.map(category => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={() => handleOpen()}
        sx={{ mb: 3 }}
      >
        Agregar Producto
      </Button>

      <Button
        variant="contained"
        color="primary"
        startIcon={<ShoppingCart />}
        onClick={handlePurchaseOpen}
        sx={{ mb: 3 }}
      >
        Comprar Productos
      </Button>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Stock Actual</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Código de Barras</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No se encontraron productos
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {product.imageUrls && product.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={convertGoogleDriveUrl(url)}
                          alt={`Imagen ${index + 1}`}
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.description}</TableCell>
                  <TableCell>
                    {categories.find(cat => cat.id === product.categoryId)?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>${parseFloat(product.price).toFixed(2)}</TableCell>
                  <TableCell>{product.barcode || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpen(product)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(product.id)}>
                      <Delete />
                    </IconButton>
                    <IconButton onClick={() => generatePriceLabel(product)} size="small" title="Print Price Label">
                      <Print />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Update both Dialog components */}
            <Dialog 
              open={purchaseOpen} 
              onClose={handlePurchaseClose} 
              maxWidth="md" 
              fullWidth
              aria-modal="true"
              keepMounted={false}
            >
              <DialogTitle>Comprar Productos</DialogTitle>
              <DialogContent>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Stock Actual</TableCell>
                      <TableCell>Cantidad Comprada</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.name}</TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            fullWidth
                            value={purchaseQuantities[product.id] || 0}
                            onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                            inputProps={{ min: 0 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DialogContent>
              <DialogActions>
                <Button onClick={handlePurchaseClose}>Cancelar</Button>
                <Button onClick={handleSavePurchase} variant="contained" color="primary">
                  Guardar Compra
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog 
              open={open} 
              onClose={handleClose} 
              maxWidth="md" 
              fullWidth
              aria-modal="true"
              keepMounted={false}
            >
              <DialogTitle>{editMode ? 'Editar Producto' : 'Agregar Producto'}</DialogTitle>
              <DialogContent>
                <TextField
                  autoFocus
                  margin="dense"
                  label="ID del Producto"
                  fullWidth
                  value={currentProduct.id}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, id: e.target.value })}
                  disabled={editMode}
                />
                <TextField
                  margin="dense"
                  label="Nombre del Producto"
                  fullWidth
                  value={currentProduct.name}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                />
                <FormControl fullWidth margin="dense">
                  <InputLabel>Categoría</InputLabel>
                  <Select
                    value={currentProduct.categoryId}
                    label="Categoría"
                    onChange={(e) => setCurrentProduct({ ...currentProduct, categoryId: e.target.value })}
                  >
                    {categories.map(category => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={currentProduct.status}
                    label="Estado"
                    onChange={(e) => setCurrentProduct({ ...currentProduct, status: e.target.value })}
                  >
                    <MenuItem value="NUEVO">NUEVO</MenuItem>
                    <MenuItem value="PRÓXIMAMENTE">PRÓXIMAMENTE</MenuItem>
                    <MenuItem value="NORMAL">NORMAL</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  margin="dense"
                  label="Precio de Compra"
                  type="number"
                  fullWidth
                  value={currentProduct.purchasePrice}
                  onChange={(e) => {
                    const purchasePrice = parseFloat(e.target.value) || 0;
                    const margin = parseFloat(currentProduct.margin) || 0;
                    const price = (purchasePrice + (purchasePrice * margin / 100)).toFixed(2);
                    setCurrentProduct({ ...currentProduct, purchasePrice, price });
                  }}
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  margin="dense"
                  label="Margen de Ganancia (%)"
                  type="number"
                  fullWidth
                  value={currentProduct.margin}
                  onChange={(e) => {
                    const margin = parseFloat(e.target.value) || 0;
                    const purchasePrice = parseFloat(currentProduct.purchasePrice) || 0;
                    const price = (purchasePrice + (purchasePrice * margin / 100)).toFixed(2);
                    setCurrentProduct({ ...currentProduct, margin, price });
                  }}
                  inputProps={{ min: 0, step: "0.01" }}
                />
                <TextField
                  margin="dense"
                  label="P.V.P (Precio de Venta)"
                  type="number"
                  fullWidth
                  value={currentProduct.price}
                  disabled
                />
                <TextField
                  margin="dense"
                  label="Código de Barras"
                  fullWidth
                  value={currentProduct.barcode}
                  disabled
                />
                <TextField
                  margin="dense"
                  label="Descripción"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentProduct.description}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                />
                <TextField
                  margin="dense"
                  label="URLs de Imágenes"
                  fullWidth
                  multiline
                  rows={3}
                  value={currentProduct.imageUrls.join('\n')}
                  onChange={(e) => setCurrentProduct({
                    ...currentProduct,
                    imageUrls: e.target.value.split('\n').filter(url => url.trim() !== '')
                  })}
                  helperText="Pega enlaces de imágenes de Google Drive (uno por línea)"
                />
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                  {currentProduct.imageUrls.map((url, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <img
                        src={convertGoogleDriveUrl(url)}
                        alt={`Preview ${index + 1}`}
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: 'rgba(255,255,255,0.8)',
                          '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                        }}
                        onClick={() => {
                          const newUrls = [...currentProduct.imageUrls];
                          newUrls.splice(index, 1);
                          setCurrentProduct({ ...currentProduct, imageUrls: newUrls });
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancelar</Button>
                <Button onClick={handleSave} variant="contained" color="primary">
                  {editMode ? 'Actualizar' : 'Agregar'}
                </Button>
              </DialogActions>
            </Dialog>
          </Container>
        );
}

export default AdminProducts;
