import React from 'react';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-300">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Acceptance of Terms</h2>
            <p className="text-gray-300">
              By accessing and using MominAI, you accept and agree to be bound by the terms
              and provision of this agreement.
            </p>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 mb-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Use License</h2>
            <p className="text-gray-300">
              Permission is granted to temporarily use MominAI for personal and commercial
              application development purposes.
            </p>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <h2 className="text-2xl font-semibold text-white mb-4">Disclaimer</h2>
            <p className="text-gray-300">
              The materials on MominAI are provided on an 'as is' basis. MominAI makes no
              warranties, expressed or implied, and hereby disclaims and negates all other warranties
              including without limitation, implied warranties or conditions of merchantability,
              fitness for a particular purpose, or non-infringement of intellectual property.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;