import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Sidebar } from '../Sidebar';
import { Header } from '../Header';

export function RootLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('hrms_user');
    if (!storedUser && location.pathname !== '/login') {
      navigate('/login');
    } else if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate, location]);

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} setUser={setUser} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
