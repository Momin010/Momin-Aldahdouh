import React from 'react';
import { Logo } from './Logo';
import { Icon } from './Icon';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const resources = [
    { name: 'Support', href: '/support' },
    { name: 'Blog', href: '/blog' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Status', href: '/status' },
  ];

  const company = [
    { name: 'Careers', href: '/careers' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
  ];

  const social = [
    { name: 'Discord', href: '#', icon: 'discord' },
    { name: 'LinkedIn', href: '#', icon: 'linkedin' },
    { name: 'YouTube', href: '#', icon: 'youtube' },
    { name: 'Twitter/X', href: '#', icon: 'twitter' },
    { name: 'Instagram', href: '#', icon: 'instagram' },
    { name: 'Reddit', href: '#', icon: 'reddit' },
  ];

  return (
    <footer className="bg-black/20 backdrop-blur-lg border-t border-white/10 mt-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-2">
            <Logo className="h-8 w-auto" />
            <p className="mt-4 text-sm text-gray-400 max-w-xs">
              The AI-powered platform for building and deploying web applications at the speed of thought.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Resources</h3>
            <ul className="mt-4 space-y-3">
              {resources.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => onNavigate?.(item.href.replace('/', ''))}
                    className="text-base text-gray-400 hover:text-white transition-colors flex items-center group"
                  >
                    {item.name}
                    <Icon name="external-link" className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Company</h3>
            <ul className="mt-4 space-y-3">
              {company.map((item) => (
                <li key={item.name}>
                  <button
                    onClick={() => onNavigate?.(item.href.replace('/', ''))}
                    className="text-base text-gray-400 hover:text-white transition-colors"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase">Social</h3>
            <ul className="mt-4 space-y-3">
              {social.map((item) => (
                <li key={item.name}>
                  <a href={item.href} className="text-gray-400 hover:text-white transition-colors flex items-center">
                    <Icon name={item.icon} className="w-5 h-5 mr-3" />
                    <span className="text-base">{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <p className="text-base text-gray-500 text-center">
            &copy; {new Date().getFullYear()} MominAI Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;