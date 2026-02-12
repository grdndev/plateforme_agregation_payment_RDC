import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import TopNav from './components/layout/TopNav';

// Lazy load pages for performance optimization
const MerchantDashboard = lazy(() => import('./pages/merchant/MerchantDashboard'));
const CompliancePage = lazy(() => import('./pages/merchant/CompliancePage'));
const IntegrationPage = lazy(() => import('./pages/merchant/IntegrationPage'));
const Checkout = lazy(() => import('./pages/Checkout'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="flex items-center justify-center min-vh-100">
    <div className="loader"></div>
  </div>
);

import { CreditCard, Banknote, ShieldAlert, Users, Activity } from 'lucide-react';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && <div className="mobile-overlay" onClick={() => setIsSidebarOpen(false)} />}
      <div className="main-wrapper">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Checkout as standalone page */}
          <Route path="/checkout" element={<Checkout />} />

          {/* Merchant Dashboard Layout */}
          <Route path="/*" element={
            <Layout>
              <Routes>
                <Route path="/" element={<MerchantDashboard />} />
                <Route path="/transactions" element={
                  <div className="card animate-slide-up" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                    <div className="header-icon" style={{ margin: '0 auto var(--spacing-md)' }}>
                      <CreditCard size={32} color="var(--primary)" />
                    </div>
                    <h2>Gestion des Transactions</h2>
                    <p className="subtitle">Consultez et gérez l'historique de vos paiements mobiles.</p>
                    <div className="empty-state mt-4" style={{ opacity: 0.5 }}>
                      <p>Aucune transaction à afficher pour le moment.</p>
                    </div>
                  </div>
                } />
                <Route path="/virements" element={
                  <div className="card animate-slide-up" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
                    <div className="header-icon" style={{ margin: '0 auto var(--spacing-md)' }}>
                      <Banknote size={32} color="var(--primary)" />
                    </div>
                    <h2>Gestion des Virements</h2>
                    <p className="subtitle">Préparez vos transferts bancaires groupés et suivez vos retraits.</p>
                    <div className="empty-state mt-4" style={{ opacity: 0.5 }}>
                      <p>Le module de virement sera disponible après validation de votre compte.</p>
                    </div>
                  </div>
                } />
                <Route path="/compliance" element={<CompliancePage />} />
                <Route path="/integration" element={<IntegrationPage />} />
                <Route path="/admin" element={
                  <div className="card animate-slide-up">
                    <div className="section-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={24} className="text-primary" />
                        <h2 className="brand-gradient">Supervision Administration</h2>
                      </div>
                      <span className="badge badge-error">Accès Administrateur</span>
                    </div>

                    <p className="mb-4">Panneau de contrôle global pour les administrateurs Alma Pay.</p>

                    <div className="stats-grid">
                      <div className="card glass-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={16} className="text-primary" />
                          <h4 style={{ margin: 0 }}>Marchands Actifs</h4>
                        </div>
                        <p className="balance-amount" style={{ fontSize: '1.5rem', margin: 0 }}>124</p>
                      </div>
                      <div className="card glass-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Users size={16} className="text-primary" />
                          <h4 style={{ margin: 0 }}>Volume Système</h4>
                        </div>
                        <p className="balance-amount" style={{ fontSize: '1.5rem', margin: 0 }}>$ 1.2M</p>
                      </div>
                    </div>
                  </div>
                } />
              </Routes>
            </Layout>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
}


export default App;
