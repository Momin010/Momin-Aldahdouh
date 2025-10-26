import React from 'react';
import { Icon } from '../Icon';

const Blog: React.FC = () => {
  const blogPosts = [
    {
      title: "Building Your First AI-Powered App",
      date: "2024-01-15",
      excerpt: "Learn how to create your first web application using MominAI's intelligent code generation.",
      readTime: "5 min read"
    },
    {
      title: "Best Practices for AI-Assisted Development",
      date: "2024-01-10",
      excerpt: "Discover tips and tricks for getting the most out of AI-powered development tools.",
      readTime: "7 min read"
    },
    {
      title: "Deploying React Apps with One Click",
      date: "2024-01-05",
      excerpt: "A comprehensive guide to deploying your applications to production environments.",
      readTime: "4 min read"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Blog</h1>
          <p className="text-xl text-gray-300">Insights, tutorials, and updates from the MominAI team</p>
        </div>

        <div className="grid gap-8">
          {blogPosts.map((post, index) => (
            <article key={index} className="bg-gray-800/50 p-6 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-2xl font-semibold text-white flex-1">{post.title}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Icon name="clock" className="w-4 h-4" />
                  {post.readTime}
                </div>
              </div>
              <p className="text-gray-300 mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{post.date}</span>
                <button className="inline-flex items-center text-purple-400 hover:text-purple-300 transition-colors">
                  Read More <Icon name="arrow-right" className="w-4 h-4 ml-1" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;