import React, { useState } from 'react';
import { Icon } from './Icon';
import { netlifyManager, NetlifyCredentials } from '../lib/netlify';

interface NetlifyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (credentials: NetlifyCredentials) => void;
}

const NetlifyConnectModal: React.FC<NetlifyConnectModalProps> = ({
  isOpen,
  onClose,
  onConnect
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNetlifyAuth = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Netlify OAuth URL construction
      const authUrl = `https://app.netlify.com/authorize?${new URLSearchParams({
        client_id: 'your-netlify-client-id', // Replace with actual client ID
        response_type: 'token',
        redirect_uri: `${window.location.origin}/api/netlify/auth`,
        scope: 'sites:read sites:write deploys:read deploys:write',
        state: 'mominai_publish',
      })}`;

      window.location.href = authUrl;
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                <path d="M12 6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Connect to Netlify</h2>
              <p className="text-sm text-gray-600">Link your Netlify account</p>
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
        <div className="p-6 space-y-4">
          {/* Description */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Icon name="info" className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">Why Netlify?</p>
                <p>MominAI will create a new site and connect it to your GitHub repository for automatic deployments.</p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Required Permissions:</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Read/write access to sites</li>
              <li>• Create new sites</li>
              <li>• Deploy to sites</li>
              <li>• Access to deployment history</li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <Icon name="alert-triangle" className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

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
              onClick={handleNetlifyAuth}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                    <path d="M12 6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                  </svg>
                  Connect Netlify
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetlifyConnectModal;