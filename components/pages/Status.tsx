import React from 'react';

const Status: React.FC = () => {
  const services = [
    { name: 'API', status: 'operational', uptime: '99.9%' },
    { name: 'Code Generation', status: 'operational', uptime: '99.8%' },
    { name: 'File Storage', status: 'operational', uptime: '99.9%' },
    { name: 'Authentication', status: 'operational', uptime: '99.95%' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">System Status</h1>
          <p className="text-xl text-gray-300">Real-time status of MominAI services</p>
        </div>

        <div className="grid gap-6">
          {services.map((service, index) => (
            <div key={index} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${service.status === 'operational' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <h3 className="text-xl font-semibold text-white">{service.name}</h3>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Uptime</div>
                  <div className="text-lg font-semibold text-white">{service.uptime}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-800/50 p-8 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Recent Updates</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
              <div>
                <div className="font-medium text-white">Multi-Provider AI Support</div>
                <div className="text-sm text-gray-400">Added support for Claude and OpenAI alongside Gemini</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
              <div>
                <div className="font-medium text-white">Smart Context Management</div>
                <div className="text-sm text-gray-400">Optimized token usage and file context selection</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Status;