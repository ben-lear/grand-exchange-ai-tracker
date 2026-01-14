/**
 * Main layout component that wraps all pages
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Header } from './Header';
import { Footer } from './Footer';
import { cn } from '../../utils';

export interface MainLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * MainLayout component - wraps all application pages
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Toast notifications */}
      <Toaster position="top-right" richColors closeButton />
      
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <main className={cn('flex-1 container mx-auto px-4 py-8', className)}>
        {children || <Outlet />}
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};
