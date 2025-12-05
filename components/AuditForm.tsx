import React, { useState } from 'react';
import { Globe, Target, Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { AuditRequest, AppStatus } from '../types';

interface AuditFormProps {
  onSubmit: (data: AuditRequest) => void;
  status: AppStatus;
}

const AuditForm: React.FC<AuditFormProps> = ({ onSubmit, status }) => {
  const [url, setUrl] = useState('');
  const [industry, setIndustry] = useState('');
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    onSubmit({ url, industry, goal });
  };

  const isLoading = status === AppStatus.LOADING;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
      <div className="p-6 md:p-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Website Analyse starten</h1>
        <p className="text-slate-300">
          Erhalten Sie in wenigen Sekunden einen professionellen SEO-Audit mit konkreten Handlungsempfehlungen.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        <div className="space-y-2">
          <label htmlFor="url" className="block text-sm font-semibold text-slate-700">
            Website URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Globe className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="url"
              id="url"
              required
              placeholder="https://beispiel.de"
              className="block w-full pl-10 pr-4 py-3 border-slate-300 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="industry" className="block text-sm font-semibold text-slate-700">
              Branche / Angebot <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Briefcase className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                id="industry"
                placeholder="z.B. Zahnarzt, Online-Shop..."
                className="block w-full pl-10 pr-4 py-3 border-slate-300 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="goal" className="block text-sm font-semibold text-slate-700">
              Hauptziel <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Target className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                id="goal"
                placeholder="z.B. Leads, Verkäufe..."
                className="block w-full pl-10 pr-4 py-3 border-slate-300 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || !url}
            className={`w-full flex items-center justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Analysiere Website...
              </>
            ) : (
              <>
                Audit erstellen
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
          <p className="mt-4 text-center text-xs text-slate-400">
            Durch Klick auf "Audit erstellen" wird die URL von unserer KI analysiert.
          </p>
        </div>
      </form>
    </div>
  );
};

export default AuditForm;