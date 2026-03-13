import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import Footer from './components/Footer';
import AnalyticsPageView from './components/AnalyticsPageView';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import CashExpress from './pages/CashExpress';
import CashExpressRequests from './pages/CashExpressRequests';
import CashExpressRequestDetail from './pages/CashExpressRequestDetail';
import TermsAndConditions from './pages/TermsAndConditions';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import './App.css';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <AnalyticsPageView />
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Register />
          } />
          <Route path="/" element={<Products />} />
          <Route path="/products" element={<Products />} />
           <Route path="/products/:id" element={<ProductDetail />} /> 
           <Route path="/cart" element={<Cart />} />
          <Route path="/cash-express" element={<CashExpress />} />
          <Route path="/cash-express/requests" element={<CashExpressRequests />} />
          <Route path="/cash-express/requests/:id" element={<CashExpressRequestDetail />} />
          <Route path="/cash-express/terms" element={<TermsAndConditions />} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <NotificationProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </NotificationProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

