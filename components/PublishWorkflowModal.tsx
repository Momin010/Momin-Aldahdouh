import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { githubManager } from '../lib/github';
import { netlifyManager } from '../lib/netlify';
import { deploymentService, DeploymentStatus } from '../services/deploymentService';
import GitHubConnectModal from './GitHubConnectModal';
import NetlifyConnectModal from './NetlifyConnectModal';

interface PublishWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  files: Record<string, string>;
  userEmail?: string;
  projectId?: string;
}

const PublishWorkflowModal: React.FC<PublishWorkflowModalProps> = ({
  isOpen,
  onClose,
  projectName,
  files,
  userEmail,
  projectId
}) => {
  const [currentStep, setCurrentStep] = useState<'connect' | 'deploy' | 'success' | 'error'>('connect');
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isNetlifyModalOpen, setIsNetlifyModalOpen] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { id: 'github', name: 'Connect GitHub', icon: 'github', connected: githubManager.isAuthenticated() },
    { id: 'netlify', name: 'Connect Netlify', icon: 'netlify', connected: netlifyManager.isAuthenticated() },
    { id: 'deploy', name: 'Deploy Project', icon: 'rocket', connected: false }
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep('connect');
      setDeploymentStatus(null);
      setIsDeploying(false);
      setError('');
    }
  }, [isOpen]);

  // Set up deployment status callback
  useEffect(() => {
    deploymentService.setStatusCallback(setDeploymentStatus);
  }, []);

  const handleGitHubConnect = () => {
    setIsGitHubModalOpen(true);
  };

  const handleNetlifyConnect = () => {
    setIsNetlifyModalOpen(true);
  };

  const handleGitHubConnected = () => {
    setIsGitHubModalOpen(false);
    // Force re-render to update connection status
    setCurrentStep('connect');
  };

  const handleNetlifyConnected = () => {
    setIsNetlifyModalOpen(false);
    // Force re-render to update connection status
    setCurrentStep('connect');
  };

  const handleDeploy = async () => {
    if (!githubManager.isAuthenticated() || !netlifyManager.isAuthenticated()) {
      setError('Please connect both GitHub and Netlify accounts first.');
      return;
    }

    setIsDeploying(true);
    setCurrentStep('deploy');
    setError('');

    try {
      const result = await deploymentService.deployProject({
        projectName,
        files,
        userEmail,
        projectId
      });

      if (result.success) {
        setCurrentStep('success');
      } else {
        setError(result.error || 'Deployment failed');
        setCurrentStep('error');
      }
    } catch (error: any) {
      setError(error.message || 'Deployment failed');
      setCurrentStep('error');
    } finally {
      setIsDeploying(false);
    }
  };

  const canDeploy = githubManager.isAuthenticated() && netlifyManager.isAuthenticated();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative max-w-2xl w-full bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Icon name="rocket" className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Publish to Web</h2>
                <p className="text-sm text-gray-600">Deploy {projectName} to the internet</p>
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
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {currentStep === 'connect' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Accounts</h3>
                  <p className="text-gray-600">Link GitHub and Netlify to deploy your project</p>
                </div>

                {/* Connection Steps */}
                <div className="space-y-4">
                  {steps.slice(0, 2).map((step, index) => (
                    <div key={step.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.connected ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {step.connected ? (
                            <Icon name="check" className="w-4 h-4 text-green-600" />
                          ) : (
                            <span className="text-sm font-semibold text-gray-600">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{step.name}</h4>
                          <p className="text-sm text-gray-600">
                            {step.connected ? 'Connected' : 'Required for deployment'}
                          </p>
                        </div>
                      </div>

                      {!step.connected && (
                        <button
                          onClick={step.id === 'github' ? handleGitHubConnect : handleNetlifyConnect}
                          className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          Connect
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Deploy Button */}
                <div className="pt-4">
                  <button
                    onClick={handleDeploy}
                    disabled={!canDeploy}
                    className="w-full px-6 py-3 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon name="rocket" className="w-4 h-4" />
                    {canDeploy ? 'Deploy Project' : 'Connect Accounts First'}
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'deploy' && deploymentStatus && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Deploying Your Project</h3>
                  <p className="text-gray-600">This may take a few minutes...</p>
                </div>

                {/* Progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{deploymentStatus.message}</span>
                    <span className="text-sm text-gray-600">{deploymentStatus.progress}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${deploymentStatus.progress}%` }}
                    />
                  </div>
                </div>

                {/* Status Details */}
                {deploymentStatus.githubRepo && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">GitHub Repository Created</span>
                    </div>
                    <p className="text-sm text-gray-600">{deploymentStatus.githubRepo.full_name}</p>
                    <a
                      href={deploymentStatus.githubRepo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      View on GitHub →
                    </a>
                  </div>
                )}

                {deploymentStatus.netlifySite && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"/>
                          <path d="M12 6c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
                        </svg>
                      </div>
                      <span className="font-medium text-gray-900">Netlify Site Created</span>
                    </div>
                    <p className="text-sm text-gray-600">{deploymentStatus.netlifySite.name}</p>
                    {deploymentStatus.netlifySite.url && (
                      <a
                        href={`https://${deploymentStatus.netlifySite.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-800"
                      >
                        View Live Site →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 'success' && deploymentStatus && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="check" className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Deployment Successful!</h3>
                  <p className="text-gray-600">Your project is now live on the internet</p>
                </div>

                {/* Links */}
                <div className="space-y-3">
                  {deploymentStatus.netlifySite?.url && (
                    <a
                      href={`https://${deploymentStatus.netlifySite.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <Icon name="external-link" className="w-4 h-4" />
                      View Your Live Site
                    </a>
                  )}

                  {deploymentStatus.githubRepo?.html_url && (
                    <a
                      href={deploymentStatus.githubRepo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                      View Source Code
                    </a>
                  )}
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {currentStep === 'error' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="alert-triangle" className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Deployment Failed</h3>
                  <p className="text-gray-600">Something went wrong during deployment</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep('connect')}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <GitHubConnectModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        onConnect={handleGitHubConnected}
      />

      <NetlifyConnectModal
        isOpen={isNetlifyModalOpen}
        onClose={() => setIsNetlifyModalOpen(false)}
        onConnect={handleNetlifyConnected}
      />
    </>
  );
};

export default PublishWorkflowModal;