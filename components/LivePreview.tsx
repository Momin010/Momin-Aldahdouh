import React, { useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import ResizablePanel from './ResizablePanel';
import DevToolsPanel from './DevToolsPanel';
import type { ConsoleMessage } from '../types';

export type Device = 'desktop' | 'tablet' | 'mobile';

interface LivePreviewProps {
  htmlContent: string;
  device: Device;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
  logs: ConsoleMessage[];
  onNewLog: (log: ConsoleMessage) => void;
  onClearLogs: () => void;
}

const deviceStyles: Record<Device, React.CSSProperties> = {
  desktop: { width: '100%' },
  tablet: { width: '768px' },
  mobile: { width: '375px' },
};

const consoleInterceptorScript = `
  const originalConsole = { ...window.console };
  const levels = ['log', 'warn', 'error', 'info'];
  
  const serialize = (obj) => {
    const cache = new Set();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) {
          return '[Circular]';
        }
        cache.add(value);
      }
      if (typeof value === 'function') {
        return \`[Function: \${value.name || 'anonymous'}]\`;
      }
      return value;
    }, 2);
  };

  levels.forEach(level => {
    window.console[level] = (...args) => {
      originalConsole[level](...args);
      try {
        const serializedArgs = args.map(arg => {
          if (arg instanceof Error) {
            return { message: arg.message, stack: arg.stack, name: arg.name };
          }
          if (typeof arg === 'object' && arg !== null) {
            return serialize(arg);
          }
          return arg;
        });
        window.parent.postMessage({
          source: 'mominai-preview-console',
          level: level,
          payload: serializedArgs,
        }, '*');
      } catch (e) {
        originalConsole.error('MominAI Console Interceptor Error:', e);
      }
    };
  });

  window.addEventListener('error', (e) => {
    window.console.error(e.message, 'at ' + e.filename + ':' + e.lineno);
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    window.console.error('Unhandled Promise Rejection:', e.reason);
  });
  
  // Prevent navigation that would change the parent URL
  history.pushState = function() {
    console.log('Navigation prevented in preview');
  };
  
  history.replaceState = function() {
    console.log('Navigation prevented in preview');
  };
  
  // Intercept link clicks to prevent navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.href && !link.href.startsWith('#')) {
      e.preventDefault();
      console.log('Link navigation prevented in preview:', link.href);
    }
  }, true);
`;

// Utility to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
    if (typeof window === 'undefined' || !text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

const LivePreview: React.FC<LivePreviewProps> = ({ 
  htmlContent, 
  device,
  isFullscreen = false, 
  onExitFullscreen, 
  logs,
  onNewLog,
  onClearLogs
}) => {
  const decodedContent = useMemo(() => decodeHtmlEntities(htmlContent), [htmlContent]);
  const isPlaceholder = !decodedContent.trim();
  const isMobileView = window.innerWidth < 768;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'mominai-preview-console') {
        onNewLog({ level: event.data.level, payload: event.data.payload });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onNewLog]);

  const srcDoc = isPlaceholder ? '' : `<script>${consoleInterceptorScript}</script>${decodedContent}`;
  
  if (isPlaceholder) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Icon name="eye" className="w-16 h-16 text-gray-600" />
        <h3 className="text-xl font-semibold mt-4">Live Preview</h3>
        <p>Your generated project preview will appear here.</p>
      </div>
    );
  }

  const containerClasses = isFullscreen
    ? "flex flex-col h-full bg-black relative"
    : "flex flex-col h-full overflow-auto";

  const handleOpenInNewTab = () => {
    const newWindow = window.open('', '_blank', 'width=1200,height=800');
    if (newWindow) {
      const escapedSrcDoc = srcDoc.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Live Preview - Fullscreen</title>
            <style>
              body { margin: 0; padding: 0; background: white; }
              iframe { width: 100vw; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            <iframe srcdoc="${escapedSrcDoc}"></iframe>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };
    
  const previewIframe = (
    <div className="w-full h-full bg-gray-800/50 flex justify-center overflow-auto p-4 min-h-0">
      <div style={deviceStyles[device]} className="h-full shadow-2xl bg-white flex-shrink-0 transition-all duration-300 ease-in-out">
        <iframe
          key={htmlContent} // Force re-render on content change
          srcDoc={srcDoc}
          title="Live Preview"
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms"
        />
      </div>
    </div>
  );

  return (
    <div className={containerClasses}>
      {isFullscreen && (
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-colors"
            aria-label="Open in new tab"
          >
            <Icon name="external-link" className="w-4 h-4" />
            <span>New Tab</span>
          </button>
          <button
            onClick={onExitFullscreen}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 transition-colors"
            aria-label="Exit fullscreen"
          >
            <Icon name="fullscreen-exit" className="w-4 h-4" />
            <span>Exit (Esc)</span>
          </button>
        </div>
      )}
      
      {isFullscreen ? (
        <div className="w-full h-full bg-white">
          <iframe
            key={htmlContent}
            srcDoc={srcDoc}
            title="Live Preview"
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      ) : (
        isMobileView ? (
          previewIframe // On mobile, show only the preview without the console.
        ) : (
          <ResizablePanel direction="vertical" initialSize={window.innerHeight * 0.65} minSize={150}>
            {previewIframe}
            <DevToolsPanel logs={logs} onClear={onClearLogs} />
          </ResizablePanel>
        )
      )}
    </div>
  );
};

export default LivePreview;
