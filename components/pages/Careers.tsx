import React from 'react';

const Careers: React.FC = () => {
  const positions = [
    {
      title: "Senior AI Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Frontend Developer",
      department: "Product",
      location: "Remote",
      type: "Full-time"
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-300">Help us build the future of AI-powered development</p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-6">Open Positions</h2>
          <div className="space-y-4">
            {positions.map((position, index) => (
              <div key={index} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{position.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-gray-400">{position.department}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{position.location}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400">{position.type}</span>
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 p-8 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Why Join MominAI?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Innovative Work</h3>
              <p className="text-gray-300">
                Work on cutting-edge AI technology that shapes the future of software development.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Great Benefits</h3>
              <p className="text-gray-300">
                Competitive salary, health insurance, flexible hours, and remote work options.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Careers;