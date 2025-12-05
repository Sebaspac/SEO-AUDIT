import React, { useState, useEffect } from 'react';
import { Download, CheckCircle2, Layout, Loader2, ChevronDown, ChevronUp, AlertCircle, AlertTriangle, CheckCircle, BarChart, ExternalLink, Share2, Copy, Check, Eye, EyeOff } from 'lucide-react';
import { AuditResponse, AuditSection, Priority } from '../types';
import { jsPDF } from "jspdf";

interface AuditResultProps {
  data: AuditResponse;
}

// Helper for PDF Images
const getImageDataUrl = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL('image/jpeg'));
        } catch { resolve(null); }
      } else { resolve(null); }
    };
    img.onerror = () => resolve(null);
  });
};

const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const colors = {
    'Hoch': 'bg-red-100 text-red-700 border-red-200',
    'Mittel': 'bg-amber-100 text-amber-700 border-amber-200',
    'Niedrig': 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[priority]}`}>
      {priority}
    </span>
  );
};

const ScoreCircle = ({ score }: { score: number }) => {
  let color = 'text-green-500';
  if (score < 50) color = 'text-red-500';
  else if (score < 80) color = 'text-amber-500';

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="40" cy="40" r={radius} className="text-slate-100" strokeWidth="6" fill="transparent" stroke="currentColor" />
        <circle cx="40" cy="40" r={radius} className={color} strokeWidth="6" fill="transparent" stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
      </svg>
      <span className={`absolute text-xl font-bold ${color}`}>{score}</span>
    </div>
  );
};

const AuditResult: React.FC<AuditResultProps> = ({ data }) => {
  const { data: report, screenshotUrl } = data;
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Initialize all sections as expanded by default
  useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    report.sections.forEach(s => initialExpanded[s.id] = true);
    setExpandedSections(initialExpanded);
  }, [report]);

  const toggleCheck = (taskId: string) => {
    setCheckedItems(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const copyShareLink = () => {
    // Construct URL based on current origin to support custom domains like seoaudit.newedgebrand.com
    const url = new URL(window.location.href);
    
    // Clear existing params to ensure clean state
    url.search = '';
    
    // Add URL param
    const targetDomain = report.domain.startsWith('http') ? report.domain : `https://${report.domain}`;
    url.searchParams.set('url', targetDomain);
    
    // Add 7-day expiration (current time + 7 days in ms)
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const expiryTimestamp = Date.now() + sevenDaysInMs;
    url.searchParams.set('expires', expiryTimestamp.toString());

    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Calculate Progress
  const totalTasks = report.sections.reduce((acc, sec) => acc + sec.checklist.length, 0);
  const completedTasks = Object.values(checkedItems).filter(Boolean).length;
  const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const handleDownloadPDF = async () => {
    setIsGeneratingPdf(true);
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    
    const brandBlue = '#2563EB';
    const brandDark = '#1E293B';
    const brandGray = '#64748B';

    // --- COVER ---
    doc.setFillColor(brandBlue);
    doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("SEO WORKSHEET", margin, 32);
    
    doc.setTextColor(brandDark);
    doc.setFontSize(14);
    doc.text(`Domain: ${report.domain}`, margin, 70);
    doc.text(`Score: ${report.overallScore}/100`, margin, 80);
    doc.setTextColor(brandGray);
    doc.setFontSize(10);
    doc.text(`Erstellt am: ${new Date().toLocaleDateString()}`, margin, 90);

    // Screenshot
    const screenshotData = await getImageDataUrl(screenshotUrl);
    let y = 100;
    if (screenshotData) {
      doc.addImage(screenshotData, 'JPEG', margin, y, 170, 100);
      y += 110;
    }

    // Summary
    doc.setFontSize(14);
    doc.setTextColor(brandBlue);
    doc.text("Executive Summary", margin, y);
    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(brandDark);
    report.executiveSummary.forEach(sum => {
      const lines = doc.splitTextToSize(`• ${sum}`, pageWidth - (margin * 2));
      doc.text(lines, margin, y);
      y += lines.length * 5;
    });

    // --- SECTIONS ---
    report.sections.forEach((section) => {
      doc.addPage();
      y = 20;

      // Section Header
      doc.setFillColor(brandDark);
      doc.rect(0, 0, pageWidth, 25, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(section.title.toUpperCase(), margin, 17);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Status: ${section.status}  |  Score: ${section.score}/100`, margin, 33); // Sub-header inside dark bar but text logic needs y adjust?
      // Actually let's just put it in the white space below
      
      // Findings
      y = 40;
      doc.setTextColor(brandDark);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Analyse-Ergebnis:", margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const findingLines = doc.splitTextToSize(section.findings, pageWidth - (margin * 2));
      doc.text(findingLines, margin, y);
      y += findingLines.length * 5 + 15;

      // Checklist Table Header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
      doc.setFont("helvetica", "bold");
      doc.text("Maßnahme (Abhaken)", margin + 2, y);
      doc.text("Notizen", pageWidth - margin - 50, y);
      y += 10;

      section.checklist.forEach(item => {
        // Check for page break
        if (y > pageHeight - 30) { 
            doc.addPage(); 
            y = 20; 
            // Repeat Header on new page? Optional.
        }

        // Draw Checkbox (Square)
        doc.setDrawColor(100);
        doc.setLineWidth(0.5);
        doc.rect(margin, y, 6, 6); // 6x6 square

        // Task Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(brandDark);
        doc.text(item.task, margin + 10, y + 4.5);
        
        // Task Description
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(brandGray);
        const descLines = doc.splitTextToSize(item.description, pageWidth - margin * 2 - 60); // Leave space for notes
        doc.text(descLines, margin + 10, y + 3);
        
        // Priority Badge text
        doc.setFontSize(8);
        doc.setTextColor(item.priority === 'Hoch' ? '#DC2626' : '#2563EB');
        doc.text(`PRIO: ${item.priority.toUpperCase()}`, margin + 10, y + descLines.length * 4 + 4);

        // Notes Area (Dotted Lines)
        const noteStartX = pageWidth - margin - 55;
        doc.setDrawColor(200);
        doc.setLineDash([1, 2], 0);
        doc.line(noteStartX, y, pageWidth - margin, y);
        doc.line(noteStartX, y + 6, pageWidth - margin, y + 6);
        doc.line(noteStartX, y + 12, pageWidth - margin, y + 12);
        doc.setLineDash([], 0); // Reset dash

        y += Math.max(20, descLines.length * 4 + 12);
        
        // Separator line
        doc.setDrawColor(240);
        doc.line(margin, y - 5, pageWidth - margin, y - 5);
      });
    });

    doc.save(`SEO-Worksheet_${report.domain}.pdf`);
    setIsGeneratingPdf(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* HEADER CARD */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-4">
             <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm">
                <BarChart className="w-8 h-8 text-blue-400" />
             </div>
             <div>
               <h1 className="text-2xl font-bold">{report.domain}</h1>
               <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                 <span>SEO Audit Report</span>
                 <span>•</span>
                 <span>{new Date().toLocaleDateString()}</span>
               </div>
             </div>
           </div>
           
           <div className="flex items-center gap-6 bg-white/5 p-4 rounded-xl border border-white/10">
              <div className="text-right">
                <div className="text-sm text-slate-400">Gesamtscore</div>
                <div className={`text-2xl font-bold ${report.overallScore >= 80 ? 'text-green-400' : report.overallScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                  {report.overallScore}/100
                </div>
              </div>
              <div className="h-10 w-px bg-white/20"></div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Offene Tasks</div>
                <div className="text-2xl font-bold text-white">{totalTasks - completedTasks}</div>
              </div>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
           <div className="flex justify-between text-sm mb-2 font-medium text-slate-700">
              <span>Optimierungs-Fortschritt</span>
              <span>{progressPercentage}% erledigt</span>
           </div>
           <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
           </div>
        </div>

        {/* ACTIONS & PREVIEW */}
        <div className="p-6 grid md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Executive Summary</h3>
                <ul className="space-y-3">
                  {report.executiveSummary.map((item, idx) => (
                    <li key={idx} className="flex gap-3 text-slate-700">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPdf}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70 shadow-lg shadow-blue-200"
                >
                  {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {isGeneratingPdf ? "Erstelle Worksheet..." : "PDF-Worksheet herunterladen"}
                </button>

                <button
                  onClick={copyShareLink}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
                  {copied ? "Link kopiert!" : "Link zur Analyse teilen (7 Tage gültig)"}
                </button>
              </div>
           </div>

           <div className="bg-slate-100 rounded-xl p-2 border border-slate-200 shadow-inner">
             
             {/* Preview Header with Heatmap Toggle */}
             <div className="flex justify-between items-center mb-2 px-1">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Vorschau</h3>
                 <button 
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border font-medium transition-all ${
                        showHeatmap 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                 >
                    {showHeatmap ? <EyeOff className="w-3.5 h-3.5"/> : <Eye className="w-3.5 h-3.5"/>}
                    {showHeatmap ? 'Heatmap ausblenden' : 'UX-Heatmap anzeigen'}
                 </button>
             </div>

             <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-white border border-slate-200 group">
                {/* Simple Browser UI */}
                <div className="h-6 bg-slate-50 border-b flex items-center px-3 gap-1.5 relative z-10">
                   <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                   <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                </div>
                
                <div className="relative w-full h-full">
                    <img 
                      src={screenshotUrl} 
                      alt="Website Preview" 
                      className="w-full h-full object-cover object-top"
                      onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/f1f5f9/94a3b8?text=Vorschau'}
                    />

                    {/* Heatmap Overlay Simulation */}
                    {showHeatmap && (
                        <>
                            <div className="absolute inset-0 opacity-60 mix-blend-multiply pointer-events-none transition-opacity duration-500" style={{
                                background: `
                                    radial-gradient(circle at 20% 30%, rgba(255, 0, 0, 0.7) 0%, rgba(255, 165, 0, 0.5) 25%, rgba(255, 255, 0, 0.2) 45%, transparent 65%),
                                    radial-gradient(circle at 80% 20%, rgba(255, 120, 0, 0.5) 0%, rgba(255, 200, 0, 0.3) 30%, transparent 60%),
                                    radial-gradient(ellipse at 50% 60%, rgba(0, 255, 100, 0.3) 0%, transparent 70%)
                                `,
                                filter: 'blur(25px)'
                            }}></div>
                            
                            {/* Legend */}
                            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-[10px] font-medium text-slate-600 border border-slate-200 shadow-lg flex items-center gap-3 animate-fade-in z-20">
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div>Hoch</span>
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-400"></div>Mittel</span>
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-400"></div>Niedrig</span>
                            </div>
                        </>
                    )}
                </div>
             </div>
             
             {showHeatmap && (
                 <p className="text-[11px] text-slate-400 mt-2 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3"/>
                    Simulierte Darstellung der Nutzer-Aufmerksamkeit (F-Pattern & Fokus-Zonen).
                 </p>
             )}
           </div>
        </div>
      </div>

      {/* CHECKLIST SECTIONS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 px-1">Detaillierte Analyse & Maßnahmen</h2>
        
        {report.sections.map((section) => {
          const isExpanded = expandedSections[section.id];
          const sectionTasks = section.checklist;
          const sectionDone = sectionTasks.filter(t => checkedItems[`${section.id}-${t.task}`]).length;
          
          return (
            <div key={section.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all duration-200">
              {/* Header */}
              <div 
                onClick={() => toggleSection(section.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 border-b border-transparent hover:border-slate-100"
              >
                <div className="flex items-center gap-4">
                  <ScoreCircle score={section.score} />
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{section.title}</h3>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className={`font-medium ${
                        section.status === 'Gut' ? 'text-green-600' : 
                        section.status === 'Warnung' ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        Status: {section.status}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500">{sectionDone} / {sectionTasks.length} erledigt</span>
                    </div>
                  </div>
                </div>
                <div className="text-slate-400">
                  {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 pt-0 border-t border-slate-100 bg-slate-50/50">
                   
                   {/* Findings Box */}
                   <div className="my-6 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 text-sm leading-relaxed flex gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <strong className="block mb-1 font-semibold">Analyse Ergebnis:</strong>
                        {section.findings}
                      </div>
                   </div>

                   {/* Checklist */}
                   <div className="space-y-3">
                     {section.checklist.map((item, idx) => {
                       const uniqueId = `${section.id}-${item.task}`;
                       const isChecked = checkedItems[uniqueId] || false;

                       return (
                         <div 
                            key={idx} 
                            onClick={() => toggleCheck(uniqueId)}
                            className={`group p-4 bg-white border rounded-xl flex gap-4 transition-all cursor-pointer ${
                              isChecked 
                                ? 'border-green-200 bg-green-50/30' 
                                : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                         >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                               isChecked ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-blue-500'
                            }`}>
                               {isChecked && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>

                            <div className="flex-grow">
                               <div className="flex items-center justify-between mb-1">
                                  <h4 className={`font-semibold ${isChecked ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                                    {item.task}
                                  </h4>
                                  <PriorityBadge priority={item.priority} />
                               </div>
                               <p className={`text-sm ${isChecked ? 'text-slate-400' : 'text-slate-600'}`}>
                                 {item.description}
                               </p>
                               <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                                  <span className="font-medium">Aufwand: {item.difficulty}</span>
                               </div>
                            </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default AuditResult;