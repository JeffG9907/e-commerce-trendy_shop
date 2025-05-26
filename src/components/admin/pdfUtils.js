import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// --------- PDF NORMAL ---------
export const generateOrderPDFNormal = async (order, companyInfo, logo, logo_1) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = 5;

  // Logos
  const logoWidth = 36;
  doc.addImage(logo, 'PNG', margin, yPos, logoWidth, 30);
  doc.addImage(logo_1, 'PNG', pageWidth - margin - logoWidth, yPos, logoWidth, 30);

  // Información de la empresa (centrada y estilo)
  if (companyInfo) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(companyInfo.name || 'Trendy Shop', pageWidth / 2, yPos + 7, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text(companyInfo.description || 'Imponente, como tú.', pageWidth / 2, yPos + 16, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      [
        `${companyInfo.address || 'Calderón, Quito'}`,
        `| ${companyInfo.email || 'soporte@trendyshope.shop'}`,
        `| ${companyInfo.phone || '0999417695'}`
      ].join(' '),
      pageWidth / 2,
      yPos + 23,
      { align: 'center' }
    );
    yPos += 33;
  }

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Número de orden consistente y único
  const orderNumber = order.orderNumber || order.id || Date.now().toString(36).toUpperCase();

  // Encabezado de la orden
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(`Orden: ${orderNumber}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Datos principales de la orden
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`No. de Orden: ${orderNumber}`, margin, yPos);
  yPos += 7;
  doc.text(`Fecha de Orden: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, margin, yPos);
  yPos += 7;
  doc.text(`Método de Pago: ${order.paymentMethod || 'N/A'}`, margin, yPos);
  yPos += 10;

  // Cliente
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente', margin, yPos);
  yPos += 6;

  // --- ADAPTACIÓN PARA CLIENTE REGISTRADO O MANUAL ---
  doc.setFont('helvetica', 'normal');
  if (order.userId && order.userData) {
    doc.text(`Nombre: ${order.userData.firstName || 'N/A'} ${order.userData.lastName || ''}`, margin, yPos);
    yPos += 6;
    doc.text(`Cédula: ${order.userData.cedula || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Email: ${order.userData.email || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Teléfono: ${order.userData.phone || 'N/A'}`, margin, yPos);
    yPos += 9;
  } else {
    doc.text(`Nombre: ${(order.customerName || '') + ' ' + (order.customerLastname || '')}`, margin, yPos);
    yPos += 6;
    doc.text(`Cédula: ${order.cedula || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Email: ${order.customerEmail || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Teléfono: ${order.phone || 'N/A'}`, margin, yPos);
    yPos += 9;
  }

  // Dirección de Envío
  doc.setFont('helvetica', 'bold');
  doc.text('Dirección de Envío', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Dirección: ${order.shippingDetails?.address || 'N/A'}`, margin, yPos);
  yPos += 6;
  doc.text(`Provincia: ${order.shippingDetails?.province || 'N/A'}`, margin, yPos);
  yPos += 6;
  doc.text(`Cantón: ${order.shippingDetails?.canton || 'N/A'}`, margin, yPos);
  yPos += 6;
  doc.text(`Parroquia: ${order.shippingDetails?.parroquia || 'N/A'}`, margin, yPos);
  yPos += 6;
  doc.text(`Código Postal: ${order.shippingDetails?.postalCode || 'N/A'}`, margin, yPos);
  yPos += 9;

  // Detalle de Envío
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Envío', margin, yPos);
  yPos += 6;

  doc.setFont('helvetica', 'normal');
  doc.text(`Transporte: ${order.transport || 'N/A'}`, margin, yPos);
  yPos += 6;
  doc.text(`Día de Llegada: ${order.arrivalDate ? new Date(order.arrivalDate).toLocaleDateString() : 'N/A'}`, margin, yPos);
  yPos += 6;
  doc.text(`Hora de Retiro: ${order.pickupTime ? new Date(order.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}`, margin, yPos);
  yPos += 9;

  // Detalle de Productos
  doc.setFont('helvetica', 'bold');
  doc.text('Detalle de Productos', margin, yPos);
  yPos += 6;

  // Tabla con celdas más anchas
  const columns = [
    { header: 'Descripción', dataKey: 'desc' },
    { header: 'Cant.', dataKey: 'qty' },
    { header: 'Precio U.', dataKey: 'unit' },
    { header: 'Subtotal', dataKey: 'subtotal' },
  ];
  const body = order.items?.map(item => ({
    desc: item.productName || item.name || 'N/A',
    qty: item.quantity || 0,
    unit: `$${(item.price || 0).toFixed(2)}`,
    subtotal: `$${((item.quantity || 0) * (item.price || 0)).toFixed(2)}`
  })) || [];

  autoTable(doc, {
    startY: yPos,
    columns,
    body,
    theme: 'plain',
    styles: {
      fontSize: 10,
      cellPadding: 2,
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: 0,
      fontStyle: 'bold',
      halign: 'center',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    columnStyles: {
      desc: { cellWidth: 110 },
      qty: { cellWidth: 20, halign: 'center' },
      unit: { cellWidth: 25, halign: 'center' },
      subtotal: { cellWidth: 25, halign: 'center' },
    }
  });

  yPos = doc.lastAutoTable.finalY + 5;

  // Totales
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: $${(order.subtotal || 0).toFixed(2)}`, pageWidth - margin - 9, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`Envío: $${(order.shippingCost || 0).toFixed(2)}`, pageWidth - margin - 9, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`Total: $${(order.total || 0).toFixed(2)}`, pageWidth - margin - 9, yPos, { align: 'right' });

  // Mensaje final
  yPos += 35;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(10);
  doc.text("Gracias por elegir TRENDY SHOP", pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  doc.text("¡Estilo, calidad y actitud en cada prenda!", pageWidth / 2, yPos, { align: 'center' });

  doc.save(`Orden_${orderNumber}.pdf`);
};

// --------- PDF TÉRMICO ---------
export const generateOrderPDFThermal = async (order, companyInfo, logo_1) => {
  const pdf = new jsPDF({
    unit: "mm",
    format: [50, 150], // Initial height, will adjust based on content
    orientation: "portrait",
  });

  const pageWidth = 50;
  const margin = 2;
  let yPos = -7;
  const lineHeight = 3;

  // Logo (solo derecho)
  const rightImg = new Image();
  rightImg.src = logo_1;
  await new Promise(resolve => {
    rightImg.onload = resolve;
  });
  pdf.addImage(
    rightImg,
    "PNG",
    margin + 1.5,
    yPos,
    45,
    35
  );
  yPos += 30;

  // Empresa
  if (companyInfo) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(companyInfo.description || "Descripción de la Empresa", pageWidth / 2, yPos, { align: "center" }
    );
    yPos += lineHeight;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    pdf.text(companyInfo.address || "", pageWidth / 2, yPos, { align: "center" });
    yPos += lineHeight;
    pdf.text(companyInfo.phone || "", pageWidth / 2, yPos, { align: "center" });
    yPos += lineHeight;
    pdf.text(companyInfo.email || "N/A" , pageWidth / 2, yPos, { align: "center" });
    yPos += lineHeight;
  }

  // Línea divisora
  yPos += 1;
  pdf.setLineWidth(0.1);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += lineHeight;

  // Orden
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text(`ORDEN #${order.orderNumber || order.id || 'N/A'}`, pageWidth / 2, yPos, { align: "center" });
  yPos += lineHeight;

  // Línea divisora
  yPos += 1;
  pdf.setLineWidth(0.1);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += lineHeight;

  pdf.setFontSize(7);
  pdf.text("Fecha:", margin, yPos);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, margin + 14, yPos);
  yPos += lineHeight;

  // --- ADAPTACIÓN PARA CLIENTE REGISTRADO O MANUAL ---
  if (order.userId && order.userData) {
    pdf.setFont("helvetica", "bold");
    pdf.text("No. Cédula:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${order.userData.cedula || 'N/A'}`, margin + 14, yPos);
    yPos += lineHeight;

    pdf.setFont("helvetica", "bold");
    pdf.text("Cliente:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${order.userData.firstName || ''} ${order.userData.lastName || ''}`, margin + 14, yPos);
    yPos += lineHeight;

    pdf.setFont("helvetica", "bold");
    pdf.text("No. Celular:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${order.userData.phone || 'N/A'}`, margin + 14, yPos);
    yPos += lineHeight;
  } else {
    pdf.setFont("helvetica", "bold");
    pdf.text("No. Cédula:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${order.cedula || 'N/A'}`, margin + 14, yPos);
    yPos += lineHeight;

    pdf.setFont("helvetica", "bold");
    pdf.text("Cliente:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${(order.customerName || '') + ' ' + (order.customerLastname || '')}`, margin + 14, yPos);
    yPos += lineHeight;

    pdf.setFont("helvetica", "bold");
    pdf.text("No. Celular:", margin, yPos);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${order.phone || 'N/A'}`, margin + 14, yPos);
    yPos += lineHeight;
  }

  // Línea divisora
  yPos += 1;
  pdf.setLineWidth(0.1);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += lineHeight;

  // Productos
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  pdf.text("DETALLE DE PRODUCTOS", pageWidth / 2, yPos, { align: "center" });
  yPos += lineHeight;

  pdf.setFontSize(6);
  order.items?.forEach((item) => {
    const itemTotal = (item.quantity || 0) * (item.price || 0);

    pdf.setFont("helvetica", "bold");
    pdf.text(item.productName || item.name || "N/A", margin, yPos);
    yPos += lineHeight;

    pdf.setFont("helvetica", "normal");
    pdf.text(`${item.quantity || 0} x $${(item.price || 0).toFixed(2)}`, margin, yPos);
    pdf.text(`$${itemTotal.toFixed(2)}`, pageWidth - margin - 10, yPos, { align: "right" });
    yPos += lineHeight;
  });

  // Línea divisora
  yPos += 1;
  pdf.setLineWidth(0.1);
  pdf.line(margin, yPos, pageWidth - margin, yPos);
  yPos += lineHeight;

  // Totales
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.text("Subtotal:", margin, yPos);
  pdf.text(`$${(order.subtotal || 0).toFixed(2)}`, pageWidth - margin - 10, yPos, { align: "right" });
  yPos += lineHeight;

  pdf.text("Total:", margin, yPos);
  pdf.text(`$${(order.total || 0).toFixed(2)}`, pageWidth - margin - 10, yPos, { align: "right" });

  // Mensaje final
  yPos += 35;
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "italic");
  pdf.text("Gracias por elegir TRENDY SHOP", pageWidth / 2, yPos, { align: 'center' });
  yPos += 5;
  pdf.text("¡Estilo, calidad y actitud en cada prenda!", pageWidth / 2, yPos, { align: 'center' });

  pdf.save(`thermal-order-${order.orderNumber || order.id || 'N/A'}.pdf`);
};