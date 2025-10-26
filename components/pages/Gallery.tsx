import React from 'react';

const Gallery: React.FC = () => {
  const projects = [
    {
      title: "E-commerce Platform",
      description: "Modern online store with React and Stripe integration",
      image: "/api/placeholder/400/300",
      tags: ["React", "E-commerce", "Stripe"]
    },
    {
      title: "Portfolio Website",
      description: "Creative portfolio showcasing design and development work",
      image: "/api/placeholder/400/300",
      tags: ["Portfolio", "Design", "Showcase"]
    },
    {
      title: "Task Management App",
      description: "Collaborative task management with real-time updates",
      image: "/api/placeholder/400/300",
      tags: ["Productivity", "Collaboration", "Real-time"]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Project Gallery</h1>
          <p className="text-xl text-gray-300">Explore amazing projects built with MominAI</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div key={index} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
              <div className="aspect-video bg-gray-700"></div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">{project.title}</h3>
                <p className="text-gray-300 mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className="px-3 py-1 text-sm bg-purple-600/20 text-purple-300 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;