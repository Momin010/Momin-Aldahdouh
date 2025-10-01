import React, { useState } from 'react';
import { Icon } from './Icon';
import { Logo } from './Logo';

interface LandingPageProps {
  onStart: (prompt: string) => void;
  onSignInClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onSignInClick }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      onStart(input.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-transparent">
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Logo className="w-auto h-10" />
          <button
            onClick={onSignInClick}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 transition-colors"
          >
            Sign In
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <div className="w-full max-w-2xl animate-fadeInUp">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
            Build your web app in minutes
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-xl mx-auto" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
            Describe what you want to create, and let our AI bring your vision to life.
          </p>

          <div className="mt-12">
            <div className="relative bg-black/30 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 'a portfolio website for a photographer'"
                className="w-full bg-transparent rounded-2xl p-4 pr-14 text-base resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 transition-shadow"
                rows={1}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 rounded-lg text-white bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  aria-label="Start building"
                >
                  <Icon name="send" className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
