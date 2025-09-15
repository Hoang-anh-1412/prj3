// Main layout component with navigation
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();

  const isActive = (pathname: string) => {
    return router.pathname === pathname ? 'bg-blue-700' : '';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation Header */}
      <nav className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold">
                📚 Vocabulary Learning
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-200 ${isActive('/')}`}
              >
                Home
              </Link>
              <Link 
                href="/vocabulary"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-200 ${isActive('/vocabulary')}`}
              >
                Manage Vocabulary
              </Link>
              <Link 
                href="/quiz"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition duration-200 ${isActive('/quiz')}`}
              >
                Quiz Mode
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto py-6 px-4 w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-4 px-4 text-center">
          <p>&copy; 2024 Vocabulary Learning App. Built with Next.js and React.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
