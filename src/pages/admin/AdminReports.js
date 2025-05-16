import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import { generatePdfReport } from '../../components/PdfReportTemplate';
import CreateInventory from '../../components/admin/CreateInventory';
import ViewInventories from '../../components/admin/ViewInventories';
import ViewInventoryDetails from '../../components/admin/ViewInventoryDetails';
import SalesReport from '../../components/admin/SalesReport';

function AdminReports() {
  const [reportType, setReportType] = useState('products');
  const [reportData, setReportData] = useState([]);
  const [inventoryMode, setInventoryMode] = useState('create');
  const [savedInventories, setSavedInventories] = useState([]);
  const [inventoryData, setInventoryData] = useState({});
  const [verifiedProducts, setVerifiedProducts] = useState({});
  const [selectedInventoryId, setSelectedInventoryId] = useState(null);
  const [salesComponent, setSalesComponent] = useState(null);
  const db = getFirestore();

  // Report type selection UI
  const renderReportTypeSelection = () => {
    return (
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="report-type-label">Tipo de Reporte</InputLabel>
        <Select
          labelId="report-type-label"
          value={reportType}
          label="Tipo de Reporte"
          onChange={(e) => setReportType(e.target.value)}
        >
          <MenuItem value="products">Productos</MenuItem>
          <MenuItem value="categories">Categorías</MenuItem>
          <MenuItem value="inventory">Inventario</MenuItem>
          <MenuItem value="sales">Ventas</MenuItem>
        </Select>
      </FormControl>
    );
  };

  useEffect(() => {
    if (reportType === 'sales') {
      const salesReport = new SalesReport();
      setSalesComponent(salesReport);
    } else {
      fetchReportData();
    }
  }, [reportType]);

  useEffect(() => {
    if (inventoryMode === 'view') {
      handleOpenInventoryList();
    }
  }, [inventoryMode]);

  const fetchReportData = async () => {
    try {
      let data = [];
      switch (reportType) {
        case 'products':
          const productsRef = collection(db, 'products');
          const productsSnapshot = await getDocs(productsRef);
          data = productsSnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            description: doc.data().description,
            stock: doc.data().stock || 0,
            price: doc.data().price || 0,
          }));
          break;

        case 'categories':
          const categoriesRef = collection(db, 'categories');
          const categoriesSnapshot = await getDocs(categoriesRef);

          // Map through categories and count products for each category
          data = await Promise.all(
            categoriesSnapshot.docs.map(async (doc) => {
              const categoryId = doc.id;
              const productsQuery = query(
                collection(db, 'products'),
                where('categoryId', '==', categoryId)
              );
              const productsSnapshot = await getDocs(productsQuery);

              return {
                id: categoryId,
                name: doc.data().name,
                productCount: productsSnapshot.size, // Count of products in this category
              };
            })
          );
          break;

        case 'inventory':
          const inventoryRef = collection(db, 'products');
          const inventorySnapshot = await getDocs(inventoryRef);
          data = inventorySnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name,
            stock: doc.data().stock || 0
          }));
          break;

        default:
          console.error('Tipo de reporte no soportado:', reportType);
          return;
      }

      setReportData(data);
      console.log('Report data updated:', data); // Add logging for debugging
    } catch (error) {
      console.error('Error al cargar los datos del reporte:', error);
    }
  };

  const getTableColumns = () => {
    switch (reportType) {
      case 'products':
        return ['Código', 'Nombre', 'Descripción', 'Stock', 'Precio'];
      case 'categories':
        return ['Nombre', 'Cant. de Productos'];
      case 'inventory':
        return ['Código', 'Nombre', 'Stock Sistema', 'Stock Físico', 'Diferencia'];
      default:
        return [];
    }
  };

  const renderTableRow = (item) => {
    switch (reportType) {
      case 'products':
        return (
          <TableRow key={item.id}>
            <TableCell>{item.id}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.description || '-'}</TableCell>
            <TableCell>{item.stock}</TableCell>
            <TableCell>${item.price?.toFixed(2)}</TableCell>
          </TableRow>
        );
      case 'categories':
        return (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.productCount}</TableCell>
          </TableRow>
        );
      case 'inventory':
        return (
          <TableRow key={item.id}>
            <TableCell>{item.id}</TableCell>
            <TableCell>{item.name}</TableCell>
            <TableCell>{item.stock}</TableCell>
            <TableCell>{inventoryData[item.id] || 0}</TableCell>
            <TableCell>{(inventoryData[item.id] || 0) - item.stock}</TableCell>
          </TableRow>
        );
      default:
        return null;
    }
  };

  const renderReportTable = () => {
    if (reportType === 'sales') {
      return (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                {salesComponent?.columns?.map((column) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {salesComponent?.data?.map((row, index) => (
                <TableRow key={index}>
                  {row.map((cell, cellIndex) => (
                    <TableCell key={cellIndex}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {getTableColumns().map((column) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.map((item) => renderTableRow(item))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const handleOpenInventoryList = async () => {
    try {
      const inventoriesRef = collection(db, 'inventory-records');
      const q = query(inventoriesRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const inventories = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      }));

      setSavedInventories(inventories);
    } catch (error) {
      console.error('Error al cargar los inventarios guardados:', error);
    }
  };

  const handleSelectInventory = async (inventoryId) => {
    setSelectedInventoryId(inventoryId);
  };

  const handleCloseInventoryDetails = () => {
    setSelectedInventoryId(null);
  };

  const generateReport = () => {
    if (reportType === 'sales' && salesComponent) {
      generatePdfReport('Reporte de Ventas', salesComponent.data, salesComponent.columns);
      return;
    }

    if (reportData.length === 0) {
      alert('No hay datos para generar el reporte');
      return;
    }

    let columns = [];
    let formattedData = [];

    switch (reportType) {
      case 'products':
        columns = ['Código', 'Nombre', 'Descripción', 'Stock', 'Precio'];
        formattedData = reportData.map((item) => [
          item.id,
          item.name,
          item.description || '-',
          item.stock,
          `$${item.price?.toFixed(2)}`,
        ]);
        break;

      case 'categories':
        columns = ['Categoría', 'Descripción'];
        formattedData = reportData.map((item) => [
          item.name,
          item.description || '-',
        ]);
        break;

      case 'inventory':
        columns = ['Código', 'Nombre', 'Stock Sistema', 'Stock Físico', 'Diferencia'];
        formattedData = reportData.map((item) => [
          item.id,
          item.name,
          item.stock,
          inventoryData[item.id] || 0,
          (inventoryData[item.id] || 0) - item.stock,
        ]);
        break;

      default:
        alert('Tipo de reporte no soportado');
        return;
    }

    const reportTitle = `Reporte de ${reportType}`;
    generatePdfReport(reportTitle, formattedData, columns);
  };

  const renderInventoryContent = () => {
    if (reportType !== 'inventory') return null;

    if (selectedInventoryId) {
      return (
        <ViewInventoryDetails
          inventoryId={selectedInventoryId}
          onBack={handleCloseInventoryDetails}
        />
      );
    }

    return (
      <>
        <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
          <Button
            variant={inventoryMode === 'create' ? 'contained' : 'outlined'}
            onClick={() => setInventoryMode('create')}
          >
            Crear Inventario
          </Button>
          <Button
            variant={inventoryMode === 'view' ? 'contained' : 'outlined'}
            onClick={() => setInventoryMode('view')}
          >
            Ver Inventarios
          </Button>
        </Box>

        {inventoryMode === 'create' ? (
          <CreateInventory
            reportData={reportData}
            inventoryData={inventoryData}
            setInventoryData={setInventoryData}
            verifiedProducts={verifiedProducts}
            setVerifiedProducts={setVerifiedProducts}
          />
        ) : (
          <ViewInventories
            savedInventories={savedInventories}
            onSelectInventory={handleSelectInventory}
          />
        )}
      </>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Reportes
            </Typography>
            <Button variant="contained" color="primary" onClick={generateReport}>
              Generar PDF
            </Button>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Tipo de Reporte</InputLabel>
            <Select
              value={reportType}
              label="Tipo de Reporte"
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="products">Productos</MenuItem>
              <MenuItem value="categories">Categorías</MenuItem>
              <MenuItem value="inventory">Inventario</MenuItem>
              <MenuItem value="sales">Ventas</MenuItem>
            </Select>
          </FormControl>

          {/* Renderiza la tabla para Productos y Categorías */}
          {(reportType === 'products' || reportType === 'categories') && renderReportTable()}

          {/* Renderiza el contenido específico para Inventario */}
          {reportType === 'inventory' && (
            <ViewInventories
              savedInventories={savedInventories}
              onSelectInventory={handleSelectInventory}
            />
          )}

          {/* Renderiza filtros para Ventas */}
          {reportType === 'sales' && salesComponent?.filters}
        </Grid>
      </Grid>
    </Container>
  );
}

export default AdminReports;