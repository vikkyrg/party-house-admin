import { useEffect, useRef } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Providers } from './providers';
import { router } from './router';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export default function App() {
  const { setAuth, setLoading } = useAuthStore();
  const authCheckFired = useRef(false);

  useEffect(() => {
    if (authCheckFired.current) return;
    authCheckFired.current = true;

    const checkAuth = async () => {
      try {
        const response = await authService.getMe();
        if (response.success && response.data && response.data.user) {
          setAuth(response.data.user);
        } else {
          setAuth(null);
        }
      } catch (error) {
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [setAuth, setLoading]);

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
