
import React,{useState} from 'react';
import './styles.css';
import './styles/icons.css';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { FRONTEND_URL } from './constants';
import FeedbackForm from './components/FeedbackForm';
import QRCodePage from './components/QRCodePage';
import QRCodePrintPage from './components/QRCodePrintPage';
import UserSignup from './components/UserSignup';
import UserLogin from './components/UserLogin';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import AdminQuestions from './components/AdminQuestions';
import AdminFeedback from './components/AdminFeedback';
import AdminLocations from './components/AdminLocations';
import AdminUsers from './components/AdminUsers';
import FeedbackStatistics from './components/FeedbackStatistics';



// Error Boundary for catching runtime errors
interface ErrorBoundaryProps {
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }
  // Explicitly declare props so TypeScript recognizes this.props inside the class
  props!: ErrorBoundaryProps;
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    // You can log errorInfo here if needed
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2em', color: 'red', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
import Header from './components/Header';
import { useAuth } from './hooks/useAuth';

const USER_AUTH_KEY = 'canteenUserAuth';
const USER_JWT_KEY = 'canteenUserJWT';

const App: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();
  const [user, setUser] = React.useState<{ site: string; username: string } | null>(null);

  // Sync user state from localStorage on mount and hash change
  React.useEffect(() => {
    const syncUser = () => {
      const auth = localStorage.getItem(USER_AUTH_KEY);
      setUser(auth ? JSON.parse(auth) : null);
    };
    syncUser();
    window.addEventListener('hashchange', syncUser);
    return () => window.removeEventListener('hashchange', syncUser);
  }, []);
  const [jwt, setJwt] = React.useState<string | null>(() => {
    return localStorage.getItem(USER_JWT_KEY) || null;
  });

  const handleUserLogin = (site: string, username: string, token?: string) => {
    setUser({ site, username });
    localStorage.setItem(USER_AUTH_KEY, JSON.stringify({ site, username }));
    if (token) {
      setJwt(token);
      localStorage.setItem(USER_JWT_KEY, token);
    }
    window.location.hash = '#/feedback';
  };

  const handleUserLogout = () => {
    setUser(null);
    setJwt(null);
    localStorage.removeItem(USER_AUTH_KEY);
    localStorage.removeItem(USER_JWT_KEY);
  };

  const ProtectedQRCodePage = () => {
    // The feedback form URL for mobile scanning
    // Updated to your actual local IP address and Vite port
  const feedbackUrl = `${FRONTEND_URL}/#/feedback`;
    return <QRCodePage url={feedbackUrl} />;
  };

  const ProtectedFeedbackForm = () => {
    // If user is signed in, show feedback form for their site
    if (user && user.site) {
      return (
        <>
          <FeedbackForm jwt={jwt} site={user.site} />
          <div className="flex flex-col items-center mt-8">
            <button
              onClick={handleUserLogout}
              className="bg-red-500 text-white px-6 py-2 rounded-lg mb-4 hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </>
      );
    }
    // If not signed in, show normal feedback form
    return <FeedbackForm jwt={jwt} />;
  };

  const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <Header />
      <div style={{ display: 'flex' }}>
        {/* Only show sidebar for admin routes when logged in */}
        {window.location.hash.startsWith('#/admin') && 
         window.location.hash !== '#/admin-login' && 
         localStorage.getItem('canteenAdminJWT') && (
          <div style={{ 
            position: 'fixed', 
            top: window.location.hash.startsWith('#/admin') ? '72px' : 0, 
            left: 0, 
            bottom: '32px',
            width: '220px',
            background: '#111', 
            color: '#fff', 
            padding: '2em 1em', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1em',
            zIndex: 1000,
            overflowY: 'auto',
            overflowX: 'hidden',
            boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
          }}>
            <span style={{ fontWeight: 700, fontSize: '1.5em', marginBottom: '1em', color: '#fff' }}>Admin Panel</span>
            <a href="#/admin" style={{ color: window.location.hash === '#/admin' ? '#fff' : '#eee', textDecoration: 'none', padding: '0.5em 1em', borderRadius: '8px', background: window.location.hash === '#/admin' ? 'var(--primary-color)' : 'none', marginBottom: '0.5em' }}>Dashboard</a>
            <a href="#/admin/questions" style={{ color: window.location.hash === '#/admin/questions' ? '#fff' : '#eee', textDecoration: 'none', padding: '0.5em 1em', borderRadius: '8px', background: window.location.hash === '#/admin/questions' ? 'var(--primary-color)' : 'none', marginBottom: '0.5em' }}>Manage Questions</a>
            <a href="#/admin/feedback" style={{ color: window.location.hash === '#/admin/feedback' ? '#fff' : '#eee', textDecoration: 'none', padding: '0.5em 1em', borderRadius: '8px', background: window.location.hash === '#/admin/feedback' ? 'var(--primary-color)' : 'none', marginBottom: '0.5em' }}>Manage Feedback</a>
            <a href="#/admin/locations" style={{ color: window.location.hash === '#/admin/locations' ? '#fff' : '#eee', textDecoration: 'none', padding: '0.5em 1em', borderRadius: '8px', background: window.location.hash === '#/admin/locations' ? 'var(--primary-color)' : 'none', marginBottom: '0.5em' }}>Manage Locations</a>
            <a href="#/admin/users" style={{ color: window.location.hash === '#/admin/users' ? '#fff' : '#eee', textDecoration: 'none', padding: '0.5em 1em', borderRadius: '8px', background: window.location.hash === '#/admin/users' ? 'var(--primary-color)' : 'none', marginBottom: '0.5em' }}>Manage Users</a>
            <a href="#/admin/qr-codes" style={{ color: window.location.hash === '#/admin/qr-codes' ? '#fff' : '#eee', textDecoration: 'none', padding: '0.5em 1em', borderRadius: '8px', background: window.location.hash === '#/admin/qr-codes' ? 'var(--primary-color)' : 'none', marginBottom: '0.5em' }}>Show QR Codes</a>
            <button onClick={() => { localStorage.clear(); window.location.href = '/#/admin-login'; }} style={{ marginTop: '2em', background: '#222', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.7em 1em', fontWeight: 600, cursor: 'pointer' }}>Logout</button>
          </div>
        )}
        <div style={{ marginLeft: window.location.hash.startsWith('#/admin') ? '220px' : 0, width: '100%' }}>
          <div className="container mx-auto p-4 md:p-8 pb-24">
            {children}
          </div>
        </div>
      </div>
      <footer
        className="w-full flex items-center justify-center fixed bottom-0"
        style={{
          padding: '8px 0',
          background: 'rgba(255,255,255,0.95)',
          color: '#555',
          fontSize: '0.85rem',
          fontWeight: 500,
          textAlign: 'center',
          letterSpacing: '0.5px',
          zIndex: 100,
          boxShadow: '0 -1px 4px rgba(0,0,0,0.05)',
          borderTop: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        <div className="container mx-auto text-center">
          <span>&copy; 2025 Canteen Feedback System. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );

  const AppContent: React.FC = () => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    // Check for admin JWT token
    const adminJwt = localStorage.getItem('canteenAdminJWT');

    // Protect admin pages with JWT
    const ProtectedAdminQuestions = () => {
      if (!adminJwt) return <AdminLogin onLogin={login} />;
      return <AdminQuestions />;
    };
    const ProtectedAdminFeedback = () => {
      if (!adminJwt) return <AdminLogin onLogin={login} />;
      return <AdminFeedback />;
    };
    const ProtectedAdminDashboard = () => {
      if (!adminJwt) return <AdminLogin onLogin={login} />;
      return <AdminDashboard onLogout={logout} />;
    };

    return (
      <Routes>
        <Route path="/" element={
          <AdminLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <UserLogin onLogin={handleUserLogin} />
              <a
                href="/#/signup"
                className="bg-blue-500 text-white px-6 py-2 rounded-lg mt-4 hover:bg-blue-600"
              >
                Sign Up
              </a>
            </div>
          </AdminLayout>
        } />
        <Route path="/user-login" element={<AdminLayout><UserLogin onLogin={handleUserLogin} /></AdminLayout>} />
        <Route path="/feedback" element={<AdminLayout><ProtectedFeedbackForm /></AdminLayout>} />
        <Route path="/login" element={<AdminLayout><UserLogin onLogin={handleUserLogin} /></AdminLayout>} />
        <Route path="/signup" element={<AdminLayout><UserSignup /></AdminLayout>} />
        <Route path="/admin-login" element={<AdminLayout><AdminLogin onLogin={login} /></AdminLayout>} />
        <Route path="/admin" element={<AdminLayout><ProtectedAdminDashboard /></AdminLayout>} />
        <Route path="/admin/questions" element={<AdminLayout><ProtectedAdminQuestions /></AdminLayout>} />
        <Route path="/admin/feedback" element={<AdminLayout><ProtectedAdminFeedback /></AdminLayout>} />
        <Route path="/admin/locations" element={<AdminLayout>{adminJwt ? <AdminLocations /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout>{adminJwt ? <AdminUsers /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
        <Route path="/admin/qr-codes" element={<AdminLayout>{adminJwt ? <QRCodePrintPage /> : <AdminLogin onLogin={login} />}</AdminLayout>} />
  <Route path="/admin/statistics" element={<AdminLayout>{adminJwt ? <ErrorBoundary><FeedbackStatistics /></ErrorBoundary> : <AdminLogin onLogin={login} />}</AdminLayout>} />
      </Routes>
    );
  };

  const ProtectedAdminDashboard = () => {
    if (!isAuthenticated) {
      return <AdminLogin onLogin={login} />;
    }
    return <AdminDashboard onLogout={logout} />;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--secondary-color)' }}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </div>
  );
};

export default App;
