import React from 'react';
import { Icon } from '../Icon';

const Support: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Support Center</h1>
          <p className="text-xl text-gray-300">Get help with MominAI and find answers to common questions</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center mb-4">
              <Icon name="help" className="w-8 h-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-semibold text-white">Documentation</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Comprehensive guides and tutorials to help you get started with MominAI.
            </p>
            <a href="#" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors">
              View Documentation <Icon name="external-link" className="w-4 h-4 ml-1" />
            </a>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
            <div className="flex items-center mb-4">
              <Icon name="discord" className="w-8 h-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-semibold text-white">Community</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Join our Discord community to connect with other developers and get real-time help.
            </p>
            <a href="#" className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors">
              Join Discord <Icon name="external-link" className="w-4 h-4 ml-1" />
            </a>
          </div>
        </div>

        <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">How do I get started with MominAI?</h3>
              <p className="text-gray-300">
                Simply describe your project idea in the chat, and MominAI will create a complete application for you.
                You can start with something simple like "Create a todo app" or "Build a portfolio website".
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">What programming languages does MominAI support?</h3>
              <p className="text-gray-300">
                MominAI generates applications using React, TypeScript, Node.js, and modern web technologies.
                It can create both frontend and backend code, along with complete standalone HTML versions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Can I deploy my applications?</h3>
              <p className="text-gray-300">
                Yes! MominAI includes one-click deployment to platforms like Vercel and Netlify.
                You can also download your project as a ZIP file to deploy anywhere.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;