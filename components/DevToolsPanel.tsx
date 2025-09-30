import React from 'react';
import { Icon } from './Icon';
import type { ConsoleMessage } from '../types';

interface DevToolsPanelProps {
  logs: ConsoleMessage[];
  onClear: () => void;
}

const levelClasses: Record<ConsoleMessage['level'], { text: string; bg: string }> = {
  log: { text: 'text-gray-800', bg: '' },
  info: { text: 'text-blue-700', bg: 'bg-blue-500/10' },
  warn: { text: 'text-yellow-700', bg: 'bg-yellow-500/10' },
  error: { text: 'text-red-700', bg: 'bg-red-500/10' },
};

const LogEntry: React.FC<{ message: ConsoleMessage }> = ({ message }) => {
  const { text, bg } = levelClasses[message.level];

  const formatArg = (arg: any) => {
    if (typeof arg === 'string') {
      try {
        // Pretty print if it's a JSON string
        const parsed = JSON.parse(arg);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return arg;
      }
    }
    if (typeof arg === 'object' && arg !== null) {
      if (arg.message && arg.stack) { // It's an Error object
        return `${arg.name}: ${arg.message}\n${arg.stack}`;
      }
      return JSON.stringify(arg, null, 2);
    }
    return String(arg);
  };
  
  return (
    <div className={`flex items-start gap-2 p-2 border-b border-black/5 font-mono text-xs ${bg}`}>
      <span className={`flex-shrink-0 font-semibold ${text}`}>{`[${message.level.toUpperCase()}]`}</span>
      <pre className={`whitespace-pre-wrap break-all ${text}`}>
        {message.payload.map(formatArg).join(' ')}
      </pre>
    </div>
  );
};

const DevToolsPanel: React.FC<DevToolsPanelProps> = ({ logs, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-white/40 text-gray-800">
      <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-black/10">
        <h3 className="text-sm font-semibold">Console</h3>
        <button
          onClick={onClear}
          className="p-1.5 rounded-lg text-gray-600 hover:bg-black/10 hover:text-black"
          aria-label="Clear console"
        >
          <Icon name="trash" className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {logs.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">Console is empty. Logs from the preview will appear here.</p>
        ) : (
          logs.map((log, index) => <LogEntry key={index} message={log} />)
        )}
      </div>
    </div>
  );
};

export default DevToolsPanel;