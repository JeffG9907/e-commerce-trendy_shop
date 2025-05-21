import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
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
  // Add this state to track selected inventory
  const [selectedInventoryId, setSelectedInventoryId] = useState(null);
  const [salesComponent, setSalesComponent] = useState(null);
  const [inventoryProducts, setInventoryProducts] = useState([]); // Productos para inventario
  const db = getFirestore();

  // Report type selection UI
  const renderReportTypeSelection = () => (
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

  useEffect(() => {
    if (reportType === 'sales') {
      const salesReport = new SalesReport();
      setSalesComponent(salesReport);
    } else {
      fetchReportData();
    }
    // eslint-disable-next-line
  }, [reportType]);

  useEffect(() => {
    if (inventoryMode === 'view') {
      handleOpenInventoryList();
    }
    // Limpia los productos de inventario al cambiar de modo
    if (inventoryMode !== 'create') {
      setInventoryProducts([]);
    }
    // eslint-disable-next-line
  }, [inventoryMode]);

  // Cargar datos para productos/categorías (no inventario)
  const fetchReportData = async () => {
    try {
      let data = [];
      switch (reportType) {
        case 'products': {
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
        }
        case 'categories': {
          const categoriesRef = collection(db, 'categories');
          const categoriesSnapshot = await getDocs(categoriesRef);

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
                productCount: productsSnapshot.size,
              };
            })
          );
          break;
        }
        // case 'inventory': // ¡Ya no se carga automáticamente!
        //   break;
        default:
          // No hace nada
          return;
      }

      setReportData(data);
      // console.log('Report data updated:', data);
    } catch (error) {
      console.error('Error al cargar los datos del reporte:', error);
    }
  };

  // Carga productos SOLO al presionar "Crear Inventario"
  const loadInventoryProducts = async () => {
    try {
      const productsRef = collection(db, 'products');
      const productsSnapshot = await getDocs(productsRef);
      const products = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
        stock: doc.data().stock || 0,
        price: doc.data().price || 0,
      }));
      setInventoryProducts(products);
    } catch (error) {
      console.error('Error al cargar productos para inventario:', error);
    }
  };

  const getTableColumns = () => {
    switch (reportType) {
      case 'products':
        return ['Código', 'Nombre', 'Descripción', 'Stock', 'Precio'];
      case 'categories':
        return ['Nombre', 'Cant. de Productos'];
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

      default:
        alert('Tipo de reporte no soportado');
        return;
    }

    const reportTitle = `Reporte de ${reportType}`;
    generatePdfReport(reportTitle, formattedData, columns);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">
          Reportes
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={generateReport}
        >
          Generar PDF
        </Button>
      </Box>

      {renderReportTypeSelection()}

      {reportType === 'inventory' ? (
        <>
          <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
            <Button
              variant={inventoryMode === 'create' ? 'contained' : 'outlined'}
              onClick={() => {
                setInventoryMode('create');
                loadInventoryProducts(); // Carga productos SOLO aquí
              }}
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
              products={inventoryProducts}
              db={db}
              onInventoryCreated={() => {
                setInventoryMode('view');
                handleOpenInventoryList();
              }}
            />
          ) : (
            <ViewInventories
              savedInventories={savedInventories}
              onSelectInventory={handleSelectInventory}
            />
          )}

          {selectedInventoryId && (
            <ViewInventoryDetails
              inventoryId={selectedInventoryId}
              onBack={handleCloseInventoryDetails}
              open={!!selectedInventoryId}
            />
          )}
        </>
      ) : reportType === 'sales' ? (
        salesComponent?.filters
      ) : (
        renderReportTable()
      )}
    </Container>
  );
}

export default AdminReports;