import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout, { rootLoader } from './pages/RootLayout';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import CompliancePage from './pages/merchant/CompliancePage';
import IntegrationPage from './pages/merchant/IntegrationPage';
import TransactionsDashboard from './pages/transactions/TransactionsDashboard';
import VirementsDashboard from './pages/virements/VirementsDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ErrorPage from './pages/ErrorPage';
import AuthenticatePage from './pages/auth/AuthenticatePage';
import RegisterPage from './pages/auth/RegisterPage';

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    loader: rootLoader,
    children: [{
        path: "/",
        element: <MerchantDashboard />
      },{
        path: "/transactions",
        element: <TransactionsDashboard />
      },{
        path: "/virements",
        element: <VirementsDashboard />
      },{
        path: "/compliance",
        element: <CompliancePage />
      },{
        path: "/integration",
        element: <IntegrationPage />
      },{
        path: "/admin",
        element: <AdminDashboard />
    }]
  },
  {
    path: "/login",
    element: <AuthenticatePage />
  },
  {
    path: "/register",
    element: <RegisterPage />
  }
]);

function App() {
  return <RouterProvider router={router} />;
}


export default App;
