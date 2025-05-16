import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  TextField,
} from '@mui/material';
import { getFirestore, collection, getDocs, query, where, orderBy } from 'firebase/firestore';

function SalesReport() {
  const [sales, setSales] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const db = getFirestore();

  useEffect(() => {
    fetchSales();
  }, [startDate, endDate]);

  const fetchSales = async () => {
    try {
      const ordersRef = collection(db, 'orders');
      let q = query(ordersRef, orderBy('createdAt', 'desc'));

      if (startDate && endDate) {
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);

        q = query(
          ordersRef,
          where('createdAt', '>=', startDateTime),
          where('createdAt', '<=', endDateTime),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      const salesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      }));

      setSales(salesData);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const formatSalesData = () => {
    return sales.map(sale => [
      sale.id,
      sale.createdAt.toLocaleDateString(),
      sale.userEmail || 'N/A',
      sale.items?.length || 0,
      `$${sale.total?.toFixed(2) || '0.00'}`,
      sale.status || 'N/A'
    ]);
  };

  const getSalesColumns = () => [
    'Order ID',
    'Date',
    'Customer',
    'Items',
    'Total',
    'Status'
  ];

  return {
    data: formatSalesData(),
    columns: getSalesColumns(),
    filters: (
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <TextField
          type="date"
          label="Start Date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    )
  };
}

export default SalesReport;