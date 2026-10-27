import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';
import { Network, Copy, Check } from 'lucide-react';

interface DiagramRendererProps {
  spec: string;
  title?: string;
  className?: string;
}

export const sanitizeMermaidSpec = (raw: string): string => {
  if (!raw) return '';
  // Strip markdown code fences if present
  let clean = raw.replace(/```mermaid\s*/gi, '').replace(/```\s*$/g, '').trim();

  // If missing diagram declaration, prepend graph TD
  if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)/m.test(clean)) {
    clean = `graph TD\n${clean}`;
  }

  // Auto-wrap unquoted node labels containing special characters: |, :, (, ), ;
  // Example: B[Node 1: Data | Next] -> B["Node 1: Data | Next"]
  clean = clean.replace(/\[([^"\]\n]*[|:();][^"\]\n]*)\]/g, (match, inner) => {
    if (inner.startsWith('"') && inner.endsWith('"')) {
      return match;
    }
    const sanitizedInner = inner.replace(/"/g, "'").trim();
    return `["${sanitizedInner}"]`;
  });

  return clean;
};

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  spec,
  title,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const { isDark } = useTheme();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      suppressErrorRendering: true,
      theme: isDark ? 'dark' : 'neutral',
      themeVariables: {
        primaryColor: isDark ? '#25372F' : '#EBE8DF',
        primaryTextColor: isDark ? '#F0EEE5' : '#203F36',
        primaryBorderColor: isDark ? '#3A4F46' : '#C4CBC4',
        lineColor: isDark ? '#E28B75' : '#C7664F',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      securityLevel: 'strict',
    });

    let isMounted = true;
    const sanitized = sanitizeMermaidSpec(spec);

    const renderDiagram = async () => {
      try {
        setRenderError(null);
        const uniqueId = `mmd-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, sanitized);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        // Remove any error elements injected into body by Mermaid
        document.querySelectorAll('[id^="dmermaid"]').forEach((el) => el.remove());
        if (isMounted) {
          setRenderError(err?.message || 'Diagram syntax parsing error.');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
      document.querySelectorAll('[id^="dmermaid"]').forEach((el) => el.remove());
    };
  }, [spec, isDark]);

  const handleCopy = () => {
    navigator.clipboard.writeText(spec);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 rounded-card border border-line-light dark:border-line-dark bg-[#FDFCF7] dark:bg-surface-dark ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-accent dark:text-accent-dark" />
          <h4 className="text-sm font-semibold text-structure-light dark:text-structure-dark">
            {title || 'Concept Architecture Diagram'}
          </h4>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy diagram specification"
          className="inline-flex items-center gap-1 text-xs text-slate-muted hover:text-structure-light dark:hover:text-structure-dark transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Spec'}</span>
        </button>
      </div>

      {renderError ? (
        <div className="p-3 text-xs bg-surface-light dark:bg-[#1E2D27] rounded-card border border-line-light dark:border-line-dark text-slate-muted dark:text-slate-darkMuted font-mono whitespace-pre-wrap">
          <div className="flex items-center gap-2 text-state-warning font-semibold mb-1">
            <span>Visual Concept Flow:</span>
          </div>
          {spec}
        </div>
      ) : (
        <div
          ref={containerRef}
          aria-label={title || 'Visual diagram'}
          className="overflow-x-auto flex justify-center items-center py-2 min-h-[120px]"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      )}
    </div>
  );
};

