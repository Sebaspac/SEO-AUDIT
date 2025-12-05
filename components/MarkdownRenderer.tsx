import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Simple parser to handle basic markdown structure for display
  // We split by lines and render accordingly to avoid heavy dependencies
  
  const lines = content.split('\n');
  
  return (
    <div className="font-sans text-slate-800 leading-relaxed space-y-4">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">{line.replace('# ', '')}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-bold text-slate-800 mt-6 mb-3">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-semibold text-slate-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        }
        
        // Lists
        if (line.trim().startsWith('- ')) {
          return (
            <div key={index} className="flex items-start ml-4 mb-1">
              <span className="mr-2 text-blue-500">•</span>
              <span>{line.replace(/^- /, '')}</span>
            </div>
          );
        }

        // Table simulation (very basic)
        if (line.includes('|')) {
           return <div key={index} className="font-mono text-xs md:text-sm bg-slate-50 p-1 overflow-x-auto whitespace-pre">{line}</div>
        }

        // Bold text basic replacement (only visualizing whole lines or simple parts)
        // For a full rich text experience without deps, we keep it simple.
        if (line.trim() === '') {
          return <div key={index} className="h-2"></div>;
        }

        return <p key={index} className="mb-2 text-slate-700">{line}</p>;
      })}
    </div>
  );
};

export default MarkdownRenderer;