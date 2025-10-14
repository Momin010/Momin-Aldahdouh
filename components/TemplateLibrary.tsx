import React, { useState } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  preview: string;
  prompt: string;
  stylePreset?: string;
  features: string[];
  complexity: 'beginner' | 'intermediate' | 'advanced';
}

interface TemplateLibraryProps {
  onSelectTemplate: (template: Template) => void;
  className?: string;
}

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  onSelectTemplate,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const templates: Template[] = [
    // E-commerce Templates
    {
      id: 'ecommerce-store',
      name: 'Modern E-commerce Store',
      description: 'Full-featured online store with product catalog, shopping cart, and checkout',
      category: 'ecommerce',
      preview: '🛍️',
      prompt: 'Create a modern e-commerce store with product listings, shopping cart, user authentication, and Stripe payment integration',
      stylePreset: 'glassmorphism',
      features: ['Product Catalog', 'Shopping Cart', 'User Auth', 'Payment Processing', 'Order Management'],
      complexity: 'advanced'
    },
    {
      id: 'marketplace',
      name: 'Multi-Vendor Marketplace',
      description: 'Platform for multiple sellers with vendor dashboards and commission management',
      category: 'ecommerce',
      preview: '🏪',
      prompt: 'Create a multi-vendor marketplace where sellers can list products and manage their stores, with admin commission tracking',
      stylePreset: 'neumorphism',
      features: ['Vendor Dashboard', 'Product Management', 'Commission System', 'Multi-seller Support'],
      complexity: 'advanced'
    },

    // SaaS Templates
    {
      id: 'project-management',
      name: 'Project Management Tool',
      description: 'Complete project management solution with task tracking and team collaboration',
      category: 'productivity',
      preview: '📋',
      prompt: 'Create a comprehensive project management application with kanban boards, task assignments, time tracking, and team chat',
      stylePreset: 'claymorphism',
      features: ['Kanban Boards', 'Task Management', 'Time Tracking', 'Team Collaboration', 'File Sharing'],
      complexity: 'advanced'
    },
    {
      id: 'crm-system',
      name: 'Customer Relationship Manager',
      description: 'CRM system for managing customer data, interactions, and sales pipeline',
      category: 'business',
      preview: '👥',
      prompt: 'Create a customer relationship management system with contact management, deal tracking, email integration, and reporting',
      stylePreset: 'material',
      features: ['Contact Management', 'Deal Pipeline', 'Email Integration', 'Sales Reports', 'Customer History'],
      complexity: 'advanced'
    },

    // Social & Community Templates
    {
      id: 'social-network',
      name: 'Social Media Platform',
      description: 'Social networking site with profiles, posts, and real-time interactions',
      category: 'social',
      preview: '🌐',
      prompt: 'Create a social media platform with user profiles, news feed, real-time messaging, and content sharing capabilities',
      stylePreset: 'glassmorphism',
      features: ['User Profiles', 'News Feed', 'Real-time Chat', 'Content Sharing', 'Groups'],
      complexity: 'advanced'
    },
    {
      id: 'forum-community',
      name: 'Discussion Forum',
      description: 'Community forum with categories, threads, and moderation tools',
      category: 'social',
      preview: '💬',
      prompt: 'Create a discussion forum with categories, threaded conversations, user roles, and moderation capabilities',
      stylePreset: 'neumorphism',
      features: ['Categories', 'Threaded Discussions', 'User Roles', 'Moderation Tools', 'Search'],
      complexity: 'intermediate'
    },

    // Creative Templates
    {
      id: 'portfolio-showcase',
      name: 'Creative Portfolio',
      description: 'Stunning portfolio website for showcasing creative work and skills',
      category: 'portfolio',
      preview: '🎨',
      prompt: 'Create a visually stunning portfolio website with project galleries, about section, skills showcase, and contact form',
      stylePreset: 'claymorphism',
      features: ['Project Gallery', 'Skills Section', 'About Page', 'Contact Form', 'Blog'],
      complexity: 'intermediate'
    },
    {
      id: 'design-agency',
      name: 'Design Agency Website',
      description: 'Professional website for design agencies with case studies and services',
      category: 'portfolio',
      preview: '🏢',
      prompt: 'Create a professional design agency website with service listings, case studies, team profiles, and client testimonials',
      stylePreset: 'glassmorphism',
      features: ['Services', 'Case Studies', 'Team Profiles', 'Testimonials', 'Contact'],
      complexity: 'intermediate'
    },

    // Gaming Templates
    {
      id: 'game-portal',
      name: 'Gaming Portal',
      description: 'Multiplayer gaming platform with lobbies, chat, and leaderboards',
      category: 'gaming',
      preview: '🎮',
      prompt: 'Create a gaming portal with multiplayer lobbies, real-time chat, leaderboards, and user profiles for gamers',
      stylePreset: 'neumorphism',
      features: ['Game Lobbies', 'Real-time Chat', 'Leaderboards', 'User Profiles', 'Match History'],
      complexity: 'advanced'
    },
    {
      id: 'puzzle-game',
      name: 'Puzzle Game Collection',
      description: 'Collection of puzzle games with scoring and achievements',
      category: 'gaming',
      preview: '🧩',
      prompt: 'Create a collection of puzzle games including sudoku, word puzzles, and logic games with scoring and achievements',
      stylePreset: 'claymorphism',
      features: ['Multiple Games', 'Score System', 'Achievements', 'Difficulty Levels', 'Progress Tracking'],
      complexity: 'intermediate'
    },

    // Learning & Education Templates
    {
      id: 'online-course',
      name: 'Online Learning Platform',
      description: 'LMS platform for creating and taking online courses',
      category: 'education',
      preview: '📚',
      prompt: 'Create an online learning platform where instructors can create courses with videos, quizzes, and assignments',
      stylePreset: 'material',
      features: ['Course Creation', 'Video Lessons', 'Quizzes', 'Assignments', 'Progress Tracking'],
      complexity: 'advanced'
    },
    {
      id: 'quiz-app',
      name: 'Interactive Quiz Platform',
      description: 'Quiz creation and taking platform with various question types',
      category: 'education',
      preview: '❓',
      prompt: 'Create an interactive quiz platform with multiple question types, scoring, and detailed analytics',
      stylePreset: 'glassmorphism',
      features: ['Question Builder', 'Multiple Types', 'Scoring System', 'Analytics', 'Categories'],
      complexity: 'intermediate'
    },

    // Business Templates
    {
      id: 'restaurant-website',
      name: 'Restaurant Website & Ordering',
      description: 'Restaurant website with menu, reservations, and online ordering',
      category: 'business',
      preview: '🍽️',
      prompt: 'Create a restaurant website with interactive menu, reservation system, and online food ordering capabilities',
      stylePreset: 'claymorphism',
      features: ['Interactive Menu', 'Reservation System', 'Online Ordering', 'Gallery', 'Reviews'],
      complexity: 'intermediate'
    },
    {
      id: 'booking-system',
      name: 'Appointment Booking System',
      description: 'Service booking platform with calendar integration and notifications',
      category: 'business',
      preview: '📅',
      prompt: 'Create an appointment booking system with calendar view, service selection, and automated notifications',
      stylePreset: 'neumorphism',
      features: ['Calendar View', 'Service Selection', 'Booking Management', 'Notifications', 'Admin Dashboard'],
      complexity: 'intermediate'
    },

    // Simple Templates
    {
      id: 'todo-advanced',
      name: 'Advanced Todo Application',
      description: 'Feature-rich todo app with categories, priorities, and collaboration',
      category: 'productivity',
      preview: '✅',
      prompt: 'Create an advanced todo application with categories, priorities, due dates, collaboration features, and detailed analytics',
      stylePreset: 'material',
      features: ['Categories', 'Priorities', 'Due Dates', 'Collaboration', 'Analytics', 'Subtasks'],
      complexity: 'intermediate'
    },
    {
      id: 'weather-app',
      name: 'Weather Dashboard',
      description: 'Beautiful weather application with forecasts and location-based data',
      category: 'utility',
      preview: '🌤️',
      prompt: 'Create a weather dashboard with current conditions, forecasts, weather maps, and location search',
      stylePreset: 'glassmorphism',
      features: ['Current Weather', 'Forecasts', 'Weather Maps', 'Location Search', 'Alerts'],
      complexity: 'intermediate'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📱' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️' },
    { id: 'productivity', name: 'Productivity', icon: '📋' },
    { id: 'social', name: 'Social', icon: '🌐' },
    { id: 'portfolio', name: 'Portfolio', icon: '🎨' },
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'business', name: 'Business', icon: '🏢' },
    { id: 'utility', name: 'Utilities', icon: '🛠️' }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'text-green-400 bg-green-400/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/20';
      case 'advanced': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className={`bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-2xl font-bold text-white mb-2">Template Library</h2>
        <p className="text-gray-400 text-sm">
          Choose from our curated collection of professional templates to kickstart your project
        </p>

        {/* Search */}
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-xl rounded-lg px-4 py-3 pl-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/20"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-white/10">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="p-6 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white/5 rounded-xl border border-white/10 p-4 hover:bg-white/10 transition-colors cursor-pointer group"
              onClick={() => onSelectTemplate(template)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{template.preview}</span>
                  <div>
                    <h3 className="font-bold text-white text-sm">{template.name}</h3>
                    <div className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getComplexityColor(template.complexity)}`}>
                      {template.complexity}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                {template.description}
              </p>

              {/* Features */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 3).map(feature => (
                    <span
                      key={feature}
                      className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  {template.features.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-500/20 text-gray-400 rounded-full">
                      +{template.features.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Style Preset */}
              {template.stylePreset && (
                <div className="mb-3">
                  <span className="text-xs text-gray-400">Style: </span>
                  <span className="text-xs text-purple-400 capitalize">{template.stylePreset}</span>
                </div>
              )}

              {/* Action Button */}
              <button className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                Use Template
              </button>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No templates found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateLibrary;