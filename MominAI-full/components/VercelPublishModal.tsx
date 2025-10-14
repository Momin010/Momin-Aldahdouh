import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface VercelPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  files: Record<string, string>;
  userEmail?: string;
  projectId?: string;
  onDeploymentSuccess?: (deploymentUrl: string) => void;
}

interface VercelAuth {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
  };
  team?: {
    id: string;
    name: string;
  };
}

const VercelPublishModal: React.FC<VercelPublishModalProps> = ({
  isOpen,
  onClose,
  projectName,
  files,
  userEmail,
  projectId,
  onDeploymentSuccess
}) => {
  const [step, setStep] = useState<'auth' | 'deploying' | 'success' | 'error'>('auth');
  const [vercelAuth, setVercelAuth] = useState<VercelAuth | null>(null);
  const [deploymentUrl, setDeploymentUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Check for Vercel auth data in URL on mount
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const authData = urlParams.get('vercel_auth');
      const authError = urlParams.get('vercel_error');

      if (authData) {
        try {
          const auth = JSON.parse(decodeURIComponent(authData));
          setVercelAuth(auth);
          setStep('deploying');
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        } catch (e) {
          setError('Failed to parse authentication data');
          setStep('error');
        }
      } else if (authError) {
        setError(decodeURIComponent(authError));
        setStep('error');
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [isOpen]);

  const handleVercelAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/vercel/auth', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to initiate Vercel authentication');
      }

      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Authentication failed');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!vercelAuth) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vercel/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken: vercelAuth.accessToken,
          projectName,
          files,
          userEmail,
          projectId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Deployment failed');
      }

      const data = await response.json();
      setDeploymentUrl(data.deployment.url);
      setStep('success');

      if (onDeploymentSuccess) {
        onDeploymentSuccess(data.deployment.url);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Deployment failed');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-deploy when auth is complete
  useEffect(() => {
    if (step === 'deploying' && vercelAuth && !isLoading) {
      handleDeploy();
    }
  }, [step, vercelAuth, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-md w-full bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Publish to Vercel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Icon name="close" className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'auth' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="external-link" className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Connect to Vercel
              </h3>
              <p className="text-gray-600 mb-6">
                Sign in to your Vercel account to publish <strong>{projectName}</strong>
              </p>
              <button
                onClick={handleVercelAuth}
                disabled={isLoading}
                className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Icon name="external-link" className="w-4 h-4" />
                    Sign in to Vercel
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'deploying' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Deploying to Vercel
              </h3>
              <p className="text-gray-600 mb-4">
                Publishing <strong>{projectName}</strong> to your Vercel account...
              </p>
              {vercelAuth && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Icon name="user" className="w-4 h-4" />
                    <span>{vercelAuth.user.name} ({vercelAuth.user.email})</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="check-circle" className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Deployment Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Your app has been published to Vercel
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="external-link" className="w-4 h-4 text-gray-500" />
                  <a
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium break-all"
                  >
                    {deploymentUrl}
                  </a>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => window.open(deploymentUrl, '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  View Live Site
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Icon name="alert-triangle" className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Deployment Failed
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('auth')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VercelPublishModal;