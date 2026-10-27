import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { useTheme } from '../../context/ThemeContext';

interface DiagramRendererProps {
  spec: string;
  title?: string;
  className?: string;
}

export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  spec,
  title,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const { isDark } = useTheme();

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
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
    const renderDiagram = async () => {
      try {
        setRenderError(null);
        const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, spec);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        if (isMounted) {
          setRenderError(err.message || 'Failed to render diagram specification.');
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [spec, isDark]);

  return (
    <div className={`p-4 rounded-card border border-line-light dark:border-line-dark bg-[#FDFCF7] dark:bg-surface-dark ${className}`}>
      {title && (
        <h4 className="text-sm font-semibold text-structure-light dark:text-structure-dark mb-3">
          {title}
        </h4>
      )}

      {renderError ? (
        <div className="p-3 text-xs bg-surface-light dark:bg-[#1E2D27] rounded border border-line-light dark:border-line-dark text-slate-muted dark:text-slate-darkMuted font-mono whitespace-pre-wrap">
          <p className="font-semibold text-state-warning mb-1">Diagram representation (raw spec):</p>
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
