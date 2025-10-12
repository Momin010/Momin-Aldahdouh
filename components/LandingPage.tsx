import React, { useState } from 'react';
import { Icon } from './Icon';
import { Logo } from './Logo';
import Footer from './Footer';
import { STARTER_PROMPTS } from '../constants';
import type { FileAttachment } from '../types';

interface LandingPageProps {
  onStart: (prompt: string, attachment?: FileAttachment | null) => void;
  onSignInClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onSignInClick }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleSend = () => {
    if (input.trim() || attachment) {
      onStart(input.trim(), attachment);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const base64String = (loadEvent.target?.result as string).split(',')[1];
            if (base64String) {
                setAttachment({ name: file.name, type: file.type, content: base64String });
            }
        };
        reader.readAsDataURL(file);
    } else if (file) {
        alert("Please select an image file (e.g., PNG, JPG, GIF).");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert("Please drop an image file (e.g., PNG, JPG, GIF).");
      return;
    }

    if (imageFiles.length > 1) {
      alert("Please drop only one image file.");
      return;
    }

    const file = imageFiles[0];
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const base64String = (loadEvent.target?.result as string).split(',')[1];
      if (base64String) {
        setAttachment({ name: file.name, type: file.type, content: base64String });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-screen bg-transparent">
      {/* Hero Section */}
      <div className="min-h-screen flex flex-col">
        <header className="absolute top-0 left-0 right-0 z-10 p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Logo className="w-auto h-10" />
            <button
              onClick={onSignInClick}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 backdrop-blur-lg border border-white/20 transition-all duration-300 shadow-lg"
            >
              Sign In
            </button>
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center text-center p-4 pt-20">
          <div className="w-full max-w-2xl animate-fadeInUp">
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Build your web app in minutes
            </h1>
            <p className="mt-4 text-lg md:text-xl text-gray-300 max-w-xl mx-auto" style={{ textShadow: '0 1px 5px rgba(0,0,0,0.5)' }}>
              Describe what you want to create, and let our AI bring your vision to life.
            </p>

            <div className="mt-8 md:mt-12">
               {attachment && (
                 <div className="mb-4 inline-block relative">
                    <img src={`data:${attachment.type};base64,${attachment.content}`} alt={attachment.name} className="h-24 w-auto rounded-lg border border-white/10 shadow-lg" />
                    <button onClick={() => setAttachment(null)} className="absolute -top-2 -right-2 bg-gray-800 border border-white/10 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors" aria-label="Remove attachment">
                        <Icon name="close" className="w-4 h-4" />
                    </button>
                 </div>
               )}
              <div className={`relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl ${isDragOver ? 'ring-2 ring-purple-400 ring-opacity-50' : ''}`}
                   onDragOver={handleDragOver}
                   onDragEnter={handleDragEnter}
                   onDragLeave={handleDragLeave}
                   onDrop={handleDrop}>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isDragOver ? "Drop an image here..." : "e.g., 'a portfolio website for a photographer'"}
                  className="w-full bg-transparent rounded-2xl p-4 pr-24 text-base resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 transition-shadow"
                  rows={1}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <input type="file" id="landing-attach" onChange={handleFileChange} accept="image/*" className="hidden" />
                  <label htmlFor="landing-attach" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer" aria-label="Attach file">
                    <Icon name="paperclip" className="w-5 h-5"/>
                  </label>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() && !attachment}
                    className="p-2 rounded-lg text-white bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    aria-label="Start building"
                  >
                    <Icon name="send" className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

           {/* Blueprints Section */}
          <div className="mt-12 md:mt-16 w-full max-w-4xl animate-fadeInUp delay-300">
             <h2 className="text-lg font-semibold text-gray-300">Or start with a blueprint</h2>
             <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {STARTER_PROMPTS.map((prompt, index) => (
                    <button 
                        key={prompt.label} 
                        onClick={() => onStart(prompt.prompt)}
                        className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 text-left transform hover:-translate-y-1 hover:border-purple-400/50 transition-all duration-300 shadow-2xl animate-fadeInUp delay-${200 * (index + 2)}`}
                    >
                        <h3 className="font-bold text-white">{prompt.label}</h3>
                        <p className="mt-2 text-sm text-gray-400">{prompt.prompt}</p>
                    </button>
                ))}
             </div>
          </div>

        </main>
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default LandingPage;
