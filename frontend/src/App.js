// App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';

// 🌟 1. ALL STATIC IMPORTS AT THE VERY TOP
import Login from './Components/Login';
import Register from './Components/Register';
import { EconomyProvider, useEconomy } from './Hooks/EconomyContext';
import './App.css';

// 🌟 2. LAZY LOADED ROUTES (Declared after all imports)
const ParentDashboard = lazy(() => import('./Components/ParentDashboard'));
const Home = lazy(() => import('./Components/Home'));
const SpellCheck = lazy(() => import('./Components/SpellIndex'));
const PuzzlePage = lazy(() => import('./Components/PuzzleIndex'));
const MapIndex = lazy(() => import('./Components/MapIndex'));
const MatchingIndex = lazy(() => import('./Components/MatchingIndex'));
const QuizIndex = lazy(() => import('./Components/QuizIndex'));
const National = lazy(() => import('./Components/NationalSysmbols'));

// ─── Route Guards ─────────────────────────────────────────────────────────

// Protects all logged-in routes (Both Kids Space and Parent Dashboard)
function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// Prevents logged-in users from seeing the Login/Register screens
function GuestRoute({ children }) {
  const token = localStorage.getItem('token');
  // If already logged in, redirect to parent dashboard by default
  if (token) return <Navigate to="/parent-dashboard" replace />;
  return children;
}

// ─── Game Layout (header for child routes) ───────────────────────────────

function GameLayout({ children }) {
  const { keys, coins, setShowStore } = useEconomy();
  const location = useLocation();

  return (
    <>
      <header className="kids-header">
        <div className="header-left">
          {/* fetchpriority="high" helps LCP score by loading the logo early */}
          <img
            src="/KnowBharat.webp"
            alt="KnowBharat Logo"
            className="logo"
            fetchpriority="high"
          />
          <h1 className="main-title">KnowBharat: Learn, Play and Explore India</h1>
        </div>

        <div className="header-right">
          <div className="header-economy">
            <div className="token-pill keys">🗝️ {keys}</div>
            <div className="token-pill coins">🪙 {coins}</div>
            <button className="store-btn-small" onClick={() => setShowStore(true)}>➕</button>
          </div>

          {location.pathname !== '/home' && (
            <nav className="kids-nav">
              <Link to="/home" className="nav-link">🏠</Link>
            </nav>
          )}
        </div>
      </header>
      {children}
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────

function App() {
  return (
    <EconomyProvider>
      <Router>
        {/* Suspense handles the loading state for lazy components */}
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#764ba2'
          }}>
            Loading... 🚀
          </div>
        }>
          <Routes>
            <Route index element={<Navigate to="/login" replace />} />

            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            <Route path="/parent-dashboard" element={<PrivateRoute><ParentDashboard /></PrivateRoute>} />

            <Route path="/home" element={<PrivateRoute><GameLayout><Home /></GameLayout></PrivateRoute>} />
            <Route path="/map" element={<PrivateRoute><GameLayout><MapIndex /></GameLayout></PrivateRoute>} />
            <Route path="/matching" element={<PrivateRoute><GameLayout><MatchingIndex /></GameLayout></PrivateRoute>} />
            <Route path="/spell" element={<PrivateRoute><GameLayout><SpellCheck /></GameLayout></PrivateRoute>} />
            <Route path="/quiz" element={<PrivateRoute><GameLayout><QuizIndex /></GameLayout></PrivateRoute>} />
            <Route path="/national" element={<PrivateRoute><GameLayout><National /></GameLayout></PrivateRoute>} />
            <Route path="/puzzle" element={<PrivateRoute><GameLayout><PuzzlePage /></GameLayout></PrivateRoute>} />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </EconomyProvider>
  );
}

export default App;