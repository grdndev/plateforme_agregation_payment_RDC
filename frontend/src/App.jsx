import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import RootLayout from './pages/RootLayout';
import MerchantDashboard from './pages/merchant/MerchantDashboard';
import CompliancePage from './pages/merchant/CompliancePage';
import IntegrationPage from './pages/merchant/IntegrationPage';
import TransactionsDashboard from './pages/transactions/TransactionsDashboard';
import VirementsDashboard from './pages/virements/VirementsDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Error from './components/layout/Error';
import AuthenticatePage from './pages/auth/AuthenticatePage';
import RegisterPage from './pages/auth/RegisterPage';
import AuthProvider from './components/providers/AuthProvider';
import ProtectionProvider from './components/providers/ProtectionProvider';
import { USER_ROLES } from './utils/enums';
import Redirect from './components/Redirect';

const router = createBrowserRouter([
  {
    element: <AuthProvider />,
    errorElement: <Error />,
    children: [
      {
        element: <AuthenticatePage />,
        path: "/login",
      },
      {
        element: <RegisterPage />,
        path: "/register",
      },
      {
        element: <ProtectionProvider />,
        path: "/",
        children: [
          {
            element: <RootLayout />,
            children: [
              {
                element: <Redirect />,
                path: "/",
              },
              {
                element: <ProtectionProvider roles={[USER_ROLES.OWNER, USER_ROLES.COLLABORATOR]} />,
                children: [
                  {
                    element: <MerchantDashboard />,
                    path: "/merchant"
                  }
                ]
              },
              {
                element: <ProtectionProvider roles={[USER_ROLES.ADMIN, USER_ROLES.SADMIN]} />,
                children: [
                  {
                    element: <AdminDashboard />,
                    path: "/admin"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}


export default App;
