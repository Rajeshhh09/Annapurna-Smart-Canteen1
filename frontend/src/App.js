import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // ✅ Only import auth


// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import MenuPage from './pages/MenuPage';
import OrdersPage from './pages/OrdersPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // ✅ Simple email-based role assignment (no Firestore needed)
        const isAdmin = currentUser.email === 'admin@canteen.edu.in';
        setRole(isAdmin ? 'admin' : 'student');
        setUser(currentUser);
      } else {
        setUser(null);
        setRole(null);
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/menu" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/menu" replace /> : <Register />} 
        />
        <Route 
          path="/menu" 
          element={user ? <MenuPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/orders" 
          element={user ? <OrdersPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin" 
          element={user && role === 'admin' ? <AdminDashboard /> : <Navigate to="/menu" replace />} 
        />
        <Route 
          path="*" 
          element={user ? <Navigate to="/menu" replace /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;