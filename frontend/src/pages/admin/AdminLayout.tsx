import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AdminSidebar } from '../../components/AdminSidebar';
import { AdminHeader } from '../../components/AdminHeader';
import { AdminUser } from '../../types';
import { fetchCurrentUser } from '../../services/api';

export const AdminLayout: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        // Silent catch
      }
    }

    // Refresh user from server
    fetchCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        localStorage.setItem('user', JSON.stringify(user));
      })
      .catch(() => {
        // On error or token invalid, redirect
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/admin/login');
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar
        currentUser={currentUser}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          currentUser={currentUser}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet context={{ currentUser }} />
        </main>
      </div>
    </div>
  );
};

