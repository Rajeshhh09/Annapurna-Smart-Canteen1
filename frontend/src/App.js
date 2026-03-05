import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';   // ← your existing firebase.js exports

// ── Pages ─────────────────────────────────────────────────────────────────────
import LandingPage      from './pages/LandingPage';
import Login            from './pages/Login';
import Register         from './pages/Register';
import MenuPage         from './pages/MenuPage';
import OrdersPage       from './pages/OrdersPage';
import AdminDashboard   from './pages/AdminDashboard';

/* ─────────────────────────────────────────────────────────────────────────────
   ScrollToTop — reset scroll position on every route change
   (prevents new pages from opening mid-scroll)
───────────────────────────────────────────────────────────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ProtectedRoute — redirects to /login when not authenticated
───────────────────────────────────────────────────────────────────────────── */
function ProtectedRoute({ user, loading, children }) {
  if (loading) return <AppLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

/* ─────────────────────────────────────────────────────────────────────────────
   AdminRoute — redirects non-admins to /menu
───────────────────────────────────────────────────────────────────────────── */
function AdminRoute({ user, isAdmin, loading, children }) {
  if (loading)  return <AppLoader />;
  if (!user)    return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/menu"  replace />;
  return children;
}

/* ─────────────────────────────────────────────────────────────────────────────
   AppLoader — full-screen spinner shown while Firebase resolves auth state
───────────────────────────────────────────────────────────────────────────── */
function AppLoader() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      background:'#0D0D0D', gap:16,
    }}>
      <div style={{
        width:44, height:44, borderRadius:'50%',
        border:'3px solid rgba(255,122,51,.2)',
        borderTopColor:'#FF7A33',
        animation:'appSpin .8s linear infinite',
      }} />
      <style>{`@keyframes appSpin{to{transform:rotate(360deg)}}`}</style>
      <span style={{
        fontFamily:"'DM Sans',sans-serif", fontSize:'.85rem',
        color:'#6B6259', letterSpacing:'.06em',
      }}>Loading Annapurna…</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   App — root component
───────────────────────────────────────────────────────────────────────────── */
export default function App() {
  // ── Single atomic auth state — eliminates the race condition where loading
  //    becomes false BEFORE isAdmin is resolved, causing AdminRoute to flash-
  //    redirect admins to /menu before the Firestore check completes. ─────────
  const [auth0, setAuth0] = useState({ user: null, isAdmin: false, loading: true });
  const { user, isAdmin, loading } = auth0;

  // ── Resolve Firebase auth + check admin flag in Firestore ──────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const adminFlag = userDoc.exists() && userDoc.data()?.isAdmin === true;
          // Single setState → single render, so loading=false and isAdmin=correct
          // are always seen together — no intermediate state where isAdmin is wrong.
          setAuth0({ user: firebaseUser, isAdmin: adminFlag, loading: false });
        } catch {
          setAuth0({ user: firebaseUser, isAdmin: false, loading: false });
        }
      } else {
        setAuth0({ user: null, isAdmin: false, loading: false });
      }
    });
    return () => unsub();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>

        {/* ── PUBLIC ROUTES ──────────────────────────────────────────────── */}

        {/* Landing page — shown to visitors at "/" */}
        <Route
          path="/"
          element={
            // Show landing page immediately; redirect to /menu only after auth resolves & user is confirmed
            !loading && user
              ? <Navigate to="/menu" replace />
              : <LandingPage />
          }
        />

        {/* Login — already logged-in users go to /menu */}
        <Route
          path="/login"
          element={
            loading
              ? <AppLoader />
              : user
                ? <Navigate to="/menu" replace />
                : <Login />
          }
        />

        {/* Register — already logged-in users go to /menu */}
        <Route
          path="/register"
          element={
            loading
              ? <AppLoader />
              : user
                ? <Navigate to="/menu" replace />
                : <Register />
          }
        />

        {/* ── PROTECTED ROUTES ───────────────────────────────────────────── */}

        {/* Main menu — requires login */}
        <Route
          path="/menu"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <MenuPage />
            </ProtectedRoute>
          }
        />

        {/* Order history — requires login */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />

        {/* ── ADMIN ROUTE ────────────────────────────────────────────────── */}

        {/* Admin dashboard — requires login only, access /admin directly in URL */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ── CATCH-ALL — redirect unknown paths to landing ─────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}