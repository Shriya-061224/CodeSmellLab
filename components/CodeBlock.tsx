
import React from 'react';

interface CodeBlockProps {
  code: string;
  label?: string;
  type?: 'bad' | 'good' | 'neutral';
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, label, type = 'neutral' }) => {
  const getHeaderColor = () => {
    switch (type) {
      case 'bad': return 'bg-red-900/50 text-red-200 border-red-800/50';
      case 'good': return 'bg-emerald-900/50 text-emerald-200 border-emerald-800/50';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Simple pseudo-syntax highlighting
  const highlightedCode = code.split('\n').map((line, i) => {
    // Basic rules for colors
    const coloredLine = line
      .replace(/\b(const|let|var|function|return|if|else|for|while|import|export|class|interface|type|enum)\b/g, '<span class="text-sky-400">$1</span>')
      .replace(/\b(string|number|boolean|any|void|Record)\b/g, '<span class="text-teal-400">$1</span>')
      .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-amber-300">$1</span>')
      .replace(/(\/\/.*$)/g, '<span class="text-slate-500 italic">$1</span>');

    return (
      <div key={i} className="flex group">
        <span className="w-10 text-slate-600 text-xs text-right pr-4 select-none pt-1">
          {i + 1}
        </span>
        <span 
          className="flex-1 whitespace-pre code-font text-sm text-slate-200"
          dangerouslySetInnerHTML={{ __html: coloredLine }}
        />
      </div>
    );
  });

  return (
    <div className={`flex flex-col rounded-lg border overflow-hidden transition-all duration-300 ${type === 'bad' ? 'border-red-800/50' : type === 'good' ? 'border-emerald-800/50' : 'border-slate-700'}`}>
      {label && (
        <div className={`px-4 py-2 text-xs font-bold tracking-widest uppercase border-b ${getHeaderColor()}`}>
          {label}
        </div>
      )}
      <div className="bg-slate-900/90 p-4 overflow-x-auto min-h-[100px] max-h-[500px]">
        {highlightedCode}
      </div>
    </div>
  );
};

export default CodeBlock;
