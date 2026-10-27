import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content space-y-4 text-sm sm:text-base leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl font-display font-bold text-tm-forest-900 dark:text-tm-parchment mt-6 mb-3 pb-1 border-b border-tm-forest-800/10 dark:border-tm-parchment/10">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-display font-bold text-tm-forest-900 dark:text-tm-parchment mt-5 mb-2.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-display font-semibold text-tm-terracotta dark:text-tm-terracotta mt-4 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-tm-forest-900 dark:text-tm-parchment mt-3 mb-1.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-tm-forest-800 dark:text-tm-parchment/90 my-2 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 my-3 space-y-1.5 text-tm-forest-800 dark:text-tm-parchment/90">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 my-3 space-y-1.5 text-tm-forest-800 dark:text-tm-parchment/90">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-tm-forest-900 dark:text-tm-parchment">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-tm-forest-800 dark:text-tm-parchment/90">
              {children}
            </em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-tm-terracotta pl-4 py-1 my-3 bg-tm-terracotta/5 rounded-r text-tm-forest-800 dark:text-tm-parchment/80 italic">
              {children}
            </blockquote>
          ),
          code: ({ inline, className: codeClassName, children, ...props }: any) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-tm-forest-800/10 dark:bg-tm-parchment/15 text-tm-terracotta dark:text-tm-honey font-mono text-xs font-semibold"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-4 my-3 rounded-lg bg-tm-forest-900 text-tm-parchment font-mono text-xs overflow-x-auto border border-tm-forest-800/20">
                <code {...props}>{children}</code>
              </pre>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
