import React, { ReactNode } from 'react';
import { Search, BarChart3, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">SEO Audit Pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors">
              <BarChart3 className="w-4 h-4" /> Analyse
            </span>
            <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer transition-colors">
              <ShieldCheck className="w-4 h-4" /> Best Practices
            </span>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {children}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} SEO Audit Pro. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;