import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Register from './pages/Register';
import Login from './pages/Login';
import Profile from './pages/Profile';
import SearchResults from './pages/SearchResults';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Orders from './pages/Orders';
import AdminLayout from './layouts/AdminLayout';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/App.css';
import { useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <CartProvider>
      <div className="App">
        <ErrorBoundary>
          {!isAdminRoute ? (
            <MainLayout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/contact" element={<Contact />} />
              </Routes>
            </MainLayout>
          ) : (
            <Routes>
              <Route path="/admin/*" element={<AdminLayout />} />
            </Routes>
          )}
        </ErrorBoundary>
        {!isAdminRoute && <Footer />}
      </div>
    </CartProvider>
  );
}

export default App;
