import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import PageContainer from './PageContainer';
import { useTokenRefresh } from '../hooks/useTokenRefresh';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { isLoading } = useAuth();

  useTokenRefresh();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 relative">
      <Header />

      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { zIndex: 9999 } }} />

      <main className="flex-grow pt-20">
        <PageContainer>
          <Outlet />
        </PageContainer>
      </main>

      <footer className="bg-gray-900 text-white py-10 text-center mt-10">
        <PageContainer>
          <p className="text-sm">
            &copy; 2025 - {new Date().getFullYear()} Café.
          </p>
        </PageContainer>
      </footer>
    </div>
  );
};

export default Layout;
