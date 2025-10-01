import { useEffect } from 'react';

export default function useAdminGuard() {
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role !== 'admin') {
      window.location.href = '/login';
    }
  }, []);
}
