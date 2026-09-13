import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChildSwitcher from './ChildSwitcher';
import { parentAPI } from '../../api/parent';
import { useChild } from '../../context/ChildContext';

const ParentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { children, setChildren, selectedChild, setSelectedChild } = useChild();
  const [loadingChildren, setLoadingChildren] = useState(true);

  // Fetch children on mount
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await parentAPI.getChildren();
        const list = Array.isArray(res.data) ? res.data : res.data.results || [];
        setChildren(list);

        // Auto-select first child if none selected
        if (!selectedChild && list.length > 0) {
          setSelectedChild(list[0]);
        }
      } catch (err) {
        console.error('Failed to fetch children:', err);
      } finally {
        setLoadingChildren(false);
      }
    };
    fetchChildren();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Child switcher bar */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
          <div className="max-w-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Viewing Data For
            </p>
            {loadingChildren ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-900 rounded-full animate-spin"></div>
                Loading children...
              </div>
            ) : (
              <ChildSwitcher />
            )}
          </div>
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        <footer className="py-4 text-center text-xs text-gray-400 border-t border-gray-200 bg-white">
          Arina School — Parent Portal | Empowering families, shaping futures.
        </footer>
      </div>
    </div>
  );
};

export default ParentLayout;