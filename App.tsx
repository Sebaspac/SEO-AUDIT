import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import AuditForm from './components/AuditForm';
import AuditResult from './components/AuditResult';
import { generateAudit } from './services/geminiService';
import { AuditRequest, AuditResponse, AppStatus } from './types';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const handleAuditRequest = useCallback(async (request: AuditRequest) => {
    setStatus(AppStatus.LOADING);
    setError(null);
    setResult(null);
    setCurrentDomain(request.url);

    try {
      const data = await generateAudit(request);
      setResult(data);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ein unbekannter Fehler ist aufgetreten.");
      setStatus(AppStatus.ERROR);
    }
  }, []);

  // Check for URL parameters on mount to support shared links
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    
    if (urlParam) {
      const industryParam = params.get('industry') || undefined;
      const goalParam = params.get('goal') || undefined;
      
      handleAuditRequest({
        url: urlParam,
        industry: industryParam,
        goal: goalParam
      });
    }
  }, [handleAuditRequest]);

  // Helper to clear URL params when starting new
  const resetApp = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setCurrentDomain('');
    window.history.pushState({}, '', window.location.pathname);
  };

  return (
    <Layout>
      <div className="space-y-8">
        {status !== AppStatus.SUCCESS && status !== AppStatus.LOADING && (
          <AuditForm onSubmit={handleAuditRequest} status={status} />
        )}

        {status === AppStatus.LOADING && (
           <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-slate-800">Analysiere {currentDomain || 'Webseite'}...</h2>
              <p className="text-slate-500 mt-2 max-w-md text-center">
                Unsere KI prüft Technik, Content und UX. Dies kann bis zu 30 Sekunden dauern.
              </p>
           </div>
        )}

        {status === AppStatus.ERROR && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col md:flex-row items-start gap-4 text-red-700 animate-pulse">
            <div className="bg-red-100 p-2 rounded-full">
               <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-lg">Fehler bei der Analyse</p>
              <p className="mt-1">{error}</p>
              <button 
                onClick={() => setStatus(AppStatus.IDLE)} 
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}

        {status === AppStatus.SUCCESS && result && (
          <div className="space-y-6">
            <button 
              onClick={resetApp}
              className="text-slate-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1 mb-4 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> Neue Analyse starten
            </button>
            <AuditResult data={result} />
          </div>
        )}
        
        {/* Placeholder for visuals/marketing when idle */}
        {status === AppStatus.IDLE && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-center">
             <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
               <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="font-bold text-lg">1</span>
               </div>
               <h3 className="font-semibold text-slate-800 mb-2">URL Eingeben</h3>
               <p className="text-sm text-slate-500">Geben Sie die Adresse der Website ein, die Sie prüfen möchten.</p>
             </div>
             <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
               <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="font-bold text-lg">2</span>
               </div>
               <h3 className="font-semibold text-slate-800 mb-2">KI-Analyse</h3>
               <p className="text-sm text-slate-500">Unsere KI scannt die Sichtbarkeit und Technik der Seite live.</p>
             </div>
             <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
               <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <span className="font-bold text-lg">3</span>
               </div>
               <h3 className="font-semibold text-slate-800 mb-2">PDF Report</h3>
               <p className="text-sm text-slate-500">Erhalten Sie einen abhakbaren Maßnahmen-Plan als PDF.</p>
             </div>
           </div>
        )}
      </div>
    </Layout>
  );
};

export default App;