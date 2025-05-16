import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminNavbar from '../pages/admin/AdminNavbar';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminUsers from '../pages/admin/AdminUsers';
import AdminOrders from '../pages/admin/AdminOrders';
import AdminSupport from '../pages/admin/AdminSupport';
import AdminCompanySettings from '../pages/admin/AdminCompanySettings';
import AdminPaymentMethods from '../pages/admin/AdminPaymentMethods';
import AdminReports from '../pages/admin/AdminReports';
import { useNavigate } from 'react-router-dom';

function AdminLayout() {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };
  return (
    <div className="admin-layout">
      <AdminNavbar />
      <div className="admin-content">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="company" element={<AdminCompanySettings />} />
          <Route path="payment-methods" element={<AdminPaymentMethods />} />
          <Route path="reports" element={<AdminReports />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminLayout;