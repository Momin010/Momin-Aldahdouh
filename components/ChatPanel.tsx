import React, { useState, useRef, useEffect } from 'react';
import type { Message, FileAttachment, Plan } from '../types';
import { Icon } from './Icon';
import { STARTER_PROMPTS } from '../constants';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string, attachment?: FileAttachment | null) => void;
  aiStatus: string | null;
  streamingContent: string | null;
  onAnimationComplete: (content: string) => void;
  hasGeneratedCode: boolean;
  onNavigateToPreview: () => void;
}

// A list of AI statuses that indicate a "loading" or "working" state.
const LOADING_STATUSES = [
  'MominAI is working...',
  'Generating files...',
  'Verifying generated code...',
  'Errors detected. Attempting to fix...'
];

// Utility to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
    if (typeof window === 'undefined' || !text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

const PlanDisplay: React.FC<{ plan: Plan }> = ({ plan }) => (
    <div className="border-t border-white/10 mt-4 pt-4">
        <h4 className="font-bold text-md text-purple-300">Project Plan: {plan.projectName}</h4>
        <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{plan.description}</p>
        
        <h5 className="font-semibold mt-4 mb-2 text-gray-200">Key Features:</h5>
        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            {plan.features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>

        <h5 className="font-semibold mt-4 mb-2 text-gray-200">File Structure:</h5>
        <ul className="text-sm text-gray-400 space-y-1.5 font-mono text-xs">
            {plan.fileStructure.map((f, i) => (
              <li key={i} className="flex items-start">
                <span className="text-cyan-400 mr-2 flex-shrink-0 w-32 truncate">{f.path}</span> 
                <span className="text-gray-500">- {f.purpose}</span>
              </li>
            ))}
        </ul>
        
        <h5 className="font-semibold mt-4 mb-2 text-gray-200">Tech Stack:</h5>
        <div className="flex flex-wrap gap-2">
            {plan.techStack.map((t, i) => <span key={i} className="bg-white/10 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">{t}</span>)}
        </div>
    </div>
);

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, aiStatus, streamingContent, onAnimationComplete, hasGeneratedCode, onNavigateToPreview }) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [animatedText, setAnimatedText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = (aiStatus !== null && LOADING_STATUSES.includes(aiStatus)) || streamingContent !== null;
  const showStarterPrompts = !hasGeneratedCode && messages.length === 1;

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, aiStatus, animatedText]);
  
  useEffect(() => {
    if (streamingContent) {
      setAnimatedText(''); // Reset on new message
      let index = 0;
      const intervalId = setInterval(() => {
          index++;
          setAnimatedText(streamingContent.substring(0, index));

          if (index >= streamingContent.length) {
              clearInterval(intervalId);
              // Add a small delay before persisting to make the cursor blink at the end
              setTimeout(() => onAnimationComplete(streamingContent), 500); 
          }
      }, 20); // Typing speed in ms

      return () => clearInterval(intervalId);
    }
  }, [streamingContent, onAnimationComplete]);


  const handleSend = () => {
    if ((input.trim() || attachment) && !isLoading) {
      onSendMessage(input.trim(), attachment);
      setInput('');
      setAttachment(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset file input
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            const base64String = (loadEvent.target?.result as string).split(',')[1];
            if (base64String) {
                setAttachment({
                    name: file.name,
                    type: file.type,
                    content: base64String,
                });
            }
        };
        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            alert("Sorry, there was an error reading the selected file.");
        }
        reader.readAsDataURL(file);
    } else if (file) {
        alert("Please select an image file (e.g., PNG, JPG, GIF).");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayedMessages = messages.filter(m => m.role !== 'system' || (m.role === 'system' && !!m.action));
  const reversedMessages = [...displayedMessages].reverse();

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
      <div ref={scrollContainerRef} className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col-reverse gap-6">
          {streamingContent !== null && (
             <div className="flex items-start gap-3 animate-fadeInUp">
                <div className="w-8 h-8 rounded-full border border-purple-400/50 flex items-center justify-center flex-shrink-0 bg-black/20 p-0.5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 opacity-50" />
                </div>
                <div className="max-w-md p-4 rounded-2xl bg-black/30 text-gray-200 rounded-bl-none">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {decodeHtmlEntities(animatedText)}
                    <span className="cursor-blink"></span>
                  </p>
                </div>
            </div>
          )}
          {aiStatus && (
            <div className="flex items-start gap-3 animate-fadeInUp">
              <div className="w-8 h-8 rounded-full border border-purple-400/50 flex items-center justify-center flex-shrink-0 bg-black/20 p-0.5 relative">
                 <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 opacity-50" />
                 <div className="absolute inset-0 rounded-full border border-purple-400 animate-pulse"></div>
              </div>
              <div className="max-w-md p-3 rounded-xl bg-black/30 text-gray-200 rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-300">{aiStatus}</p>
                  {isLoading && (
                    <div className="dot-pulse flex space-x-1">
                      <span className="w-1.5 h-1.5 bg-purple-300 rounded-full"></span>
                      <span className="w-1.5 h-1.5 bg-purple-300 rounded-full"></span>
                      <span className="w-1.5 h-1.5 bg-purple-300 rounded-full"></span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {reversedMessages.map((msg, revIndex) => {
            const originalIndex = displayedMessages.length - 1 - revIndex;

            if (msg.action === 'GOTO_PREVIEW') {
              return (
                <div key={`${originalIndex}-action`} className="md:hidden flex justify-center py-2 animate-fadeInUp">
                  <button
                    onClick={onNavigateToPreview}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors"
                  >
                    <Icon name="eye" className="w-4 h-4" />
                    <span>{msg.content}</span>
                  </button>
                </div>
              );
            }

            return (
              <div key={originalIndex} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''} animate-fadeInUp`}>
                {msg.role === 'model' && 
                  <div className="w-8 h-8 rounded-full border border-purple-400/50 flex items-center justify-center flex-shrink-0 bg-black/20 p-0.5">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 opacity-50" />
                  </div>
                }
                <div className={`max-w-md p-4 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-black/30 text-gray-200 rounded-bl-none'}`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(msg.content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                  
                  {msg.plan && <PlanDisplay plan={msg.plan} />}
                  
                  {msg.action === 'AWAITING_PLAN_APPROVAL' && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => onSendMessage("Looks good, proceed with building the project.")}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors disabled:bg-gray-600"
                      >
                        <Icon name="lightning" className="w-4 h-4" />
                        Accept & Build
                      </button>
                       <button 
                        onClick={() => inputRef.current?.focus()}
                        disabled={isLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                      >
                        Suggest Changes
                      </button>
                    </div>
                  )}

                  {showStarterPrompts && originalIndex === 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-2 border-t border-white/10 pt-4">
                        {STARTER_PROMPTS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => onSendMessage(p.prompt, null)}
                                className="text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200 w-full disabled:opacity-50"
                                disabled={isLoading}
                            >
                                <span className="font-semibold text-purple-300">{p.label}</span>
                                <p className="text-gray-400 text-xs mt-1 leading-snug">{p.prompt}</p>
                            </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-4 border-t border-white/10">
        {attachment && (
           <div className="pb-2">
            <div className="relative inline-block bg-black/30 rounded-lg p-1.5">
                <img 
                    src={`data:${attachment.type};base64,${attachment.content}`} 
                    alt={attachment.name} 
                    className="h-16 w-auto rounded" 
                />
                <button 
                    onClick={() => {
                        setAttachment(null);
                        if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                        }
                    }} 
                    className="absolute -top-2 -right-2 bg-gray-800 border border-white/10 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors"
                    aria-label="Remove attachment"
                >
                    <Icon name="close" className="w-4 h-4" />
                </button>
            </div>
        </div>
        )}
        <div className="relative">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your web app or attach an image reference..."
            className="w-full bg-black/40 rounded-xl p-3 pr-24 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 transition-shadow"
            rows={1}
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" aria-label="Attach file" disabled={isLoading}><Icon name="paperclip" className="w-5 h-5"/></button>
            <button onClick={handleSend} disabled={isLoading || (!input.trim() && !attachment)} className="p-2 rounded-lg text-white bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
              <Icon name="send" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;