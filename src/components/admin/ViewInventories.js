import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';

function ViewInventories({ savedInventories, onSelectInventory }) {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nombre</TableCell>
            <TableCell>Productos Totales</TableCell>
            <TableCell>Cant. Diferencia</TableCell>
            <TableCell>Diferencia Total ($)</TableCell>
            <TableCell>Usuario</TableCell>
            <TableCell>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {savedInventories.map((inventory) => (
            <TableRow key={inventory.id}>
              <TableCell>{inventory.name}</TableCell>
              <TableCell>{inventory.totalProducts}</TableCell>
              <TableCell>{inventory.totalDifference}</TableCell>
              <TableCell>${inventory.totalPriceDifference?.toFixed(2) || '0.00'}</TableCell>
              <TableCell>{inventory.userEmail}</TableCell>
              <TableCell>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onSelectInventory(inventory.id)}
                >
                  Ver Detalles
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ViewInventories;