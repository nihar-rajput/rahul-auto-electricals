import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  BatteryCharging,
  Boxes,
  Receipt,
  Inbox,
  Users,
  Settings,
  Zap,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { AdminUser } from '../types';
import { fetchEnquiryStats } from '../services/api';

interface AdminSidebarProps {
  currentUser: AdminUser | null;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentUser,
  mobileOpen,
  onCloseMobile,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const [newEnquiryCount, setNewEnquiryCount] = useState<number>(0);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await fetchEnquiryStats();
        setNewEnquiryCount(stats.new);
      } catch (err) {
        // Silent catch
      }
    };
    loadStats();
    const interval = setInterval(loadStats, 30000); // 30s polling for new notifications
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/admin/overview', label: t('admin.overview'), icon: LayoutDashboard },
    { to: '/admin/products', label: t('admin.products'), icon: BatteryCharging },
    { to: '/admin/inventory', label: t('admin.inventory'), icon: Boxes },
    { to: '/admin/sales', label: t('admin.sales'), icon: Receipt },
    {
      to: '/admin/enquiries',
      label: t('admin.enquiries'),
      icon: Inbox,
      badge: newEnquiryCount > 0 ? newEnquiryCount : undefined,
    },
    ...(isSuperAdmin
      ? [
          { to: '/admin/users', label: t('admin.users'), icon: Users },
          { to: '/admin/settings', label: t('admin.settings'), icon: Settings },
        ]
      : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const content = (
    <div className="h-full flex flex-col justify-between py-5 px-3 bg-slate-900 text-slate-300">
      <div>
        {/* Brand header */}
        <div className="px-3 pb-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shrink-0 shadow-xs">
              <img src="/logo-icon.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="block font-display font-bold text-sm text-white leading-tight">
                Rahul Auto Electricals
              </span>
              <span className="block text-[11px] font-medium text-amber-400">
                Administration Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Nav Links */}
        <nav className="mt-5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition ${
                  active
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Public site link */}
      <div className="pt-4 border-t border-slate-800 px-3">
        <Link
          to="/"
          target="_blank"
          className="flex items-center justify-between text-xs text-slate-400 hover:text-white transition py-2"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
            <span>View Public Store</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 border-r border-slate-800">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-xs h-full z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};

