import React from 'react';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
            <p className="text-gray-300 mb-4">
              We collect information you provide directly to us, such as when you create an account,
              use our services, or contact us for support.
            </p>
            <ul className="text-gray-300 space-y-2">
              <li>• Account information (email, name)</li>
              <li>• Project data and code</li>
              <li>• Usage analytics and performance metrics</li>
              <li>• Communication records</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">How We Use Your Information</h2>
            <p className="text-gray-300">
              We use the information we collect to provide, maintain, and improve our services,
              process transactions, send relevant communications, and ensure security.
            </p>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
            <p className="text-gray-300">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@mominai.com" className="text-gray-400 hover:text-gray-300">
                privacy@mominai.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;