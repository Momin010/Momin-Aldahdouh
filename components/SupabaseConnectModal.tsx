import React, { useState } from 'react';
import { Icon } from './Icon';

interface SupabaseConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: SupabaseCredentials) => void;
  isLoading?: boolean;
}

interface SupabaseCredentials {
  projectUrl: string;
  anonKey: string;
  serviceRoleKey?: string;
}

const SupabaseConnectModal: React.FC<SupabaseConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isLoading = false
}) => {
  const [credentials, setCredentials] = useState<SupabaseCredentials>({
    projectUrl: '',
    anonKey: '',
    serviceRoleKey: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.projectUrl && credentials.anonKey) {
      onConnect(credentials);
    }
  };

  const handleInputChange = (field: keyof SupabaseCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Icon name="database" className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Connect to Supabase</h2>
              <p className="text-sm text-gray-600">Link your Supabase project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={credentials.projectUrl}
              onChange={(e) => handleInputChange('projectUrl', e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in your Supabase project settings
            </p>
          </div>

          {/* Anon Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anon/Public Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={credentials.anonKey}
              onChange={(e) => handleInputChange('anonKey', e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Safe to use in client-side code
            </p>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
          >
            <Icon
              name={showAdvanced ? "chevron-up" : "chevron-down"}
              className="w-4 h-4"
            />
            Advanced Options
          </button>

          {/* Service Role Key (Advanced) */}
          {showAdvanced && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Role Key (Optional)
              </label>
              <input
                type="password"
                value={credentials.serviceRoleKey}
                onChange={(e) => handleInputChange('serviceRoleKey', e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Only use in server-side code. Never expose to clients.
              </p>
            </div>
          )}

          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="info" className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Where to find your keys:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Settings → API</li>
                  <li>Copy the Project URL and anon/public key</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!credentials.projectUrl || !credentials.anonKey || isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Icon name="database" className="w-4 h-4" />
                  Connect
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupabaseConnectModal;