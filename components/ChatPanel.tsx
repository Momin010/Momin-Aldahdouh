import React, { useState, useRef, useEffect } from 'react';
import type { Message, FileAttachment, Plan } from '../types';
import { Icon } from './Icon';
import { STARTER_PROMPTS, DESIGN_BLUEPRINTS } from '../constants';

// Utility to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
    if (typeof window === 'undefined' || !text) return text;
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
};

const ModelMessageContent: React.FC<{
  message: Message;
  index: number;
  onComplete: (index: number) => void;
}> = React.memo(({ message, index, onComplete }) => {
  const [animatedText, setAnimatedText] = useState(message.streaming ? '' : message.content);
  const animationCompletedRef = useRef(!message.streaming);
  const contentRef = useRef(message.content);

  useEffect(() => {
    contentRef.current = message.content;
    
    if (message.streaming && !animationCompletedRef.current) {
      let charIndex = 0;
      const intervalId = setInterval(() => {
        charIndex++;
        setAnimatedText(contentRef.current.substring(0, charIndex));
        if (charIndex >= contentRef.current.length) {
          clearInterval(intervalId);
          animationCompletedRef.current = true;
          setTimeout(() => onComplete(index), 100);
        }
      }, 20);
      return () => clearInterval(intervalId);
    } else if (!message.streaming && !animationCompletedRef.current) {
        setAnimatedText(message.content);
        animationCompletedRef.current = true;
    }
  }, [message.streaming]);

  const isStreaming = message.streaming && animatedText.length < message.content.length;

  return (
    <>
      <p className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(animatedText).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
      {isStreaming && <span className="cursor-blink" />}
    </>
  );
});


interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string, attachment?: FileAttachment | null) => void;
  aiStatus: string | null;
  onStreamingComplete: (index: number) => void;
  hasGeneratedCode: boolean;
  onNavigateToPreview: () => void;
  onCancelRequest: () => void;
  isCancelling: boolean;
  onContextMenu: (event: React.MouseEvent, index: number) => void;
  onDeleteMessage: (index: number) => void;
  onResubmitMessage: (index: number, newContent: string) => void;
  editingIndex: number | null;
  onCancelEditing: () => void;
  stopwatchSeconds: number;
  isStopwatchRunning: boolean;
}

const LOADING_TEXTS: Record<string, string[]> = {
  'MominAI is working...': [
    'Thinking...',
    'Analyzing your request...',
    'Consulting the digital muses...',
    'Warming up the circuits...',
  ],
  'Generating application...': [
    'Building React components...',
    'Creating standalone preview...',
    'Finalizing file structure...',
    'Almost ready...',
  ],
  'Applying changes...': [
    'Integrating new code...',
    'Applying modifications...',
    'Updating file structure...',
  ],
  'Verifying generated code...': [
    'Running diagnostics...',
    'Checking for syntax ghosts...',
    'Ensuring everything is pixel-perfect...',
  ],
   'Errors detected. Attempting to fix...': [
    'Engaging self-correction protocols...',
    'Debugging the anomalies...',
    'Rerouting neural pathways...',
  ]
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

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, onSendMessage, aiStatus, onStreamingComplete, hasGeneratedCode, onNavigateToPreview,
  onCancelRequest, isCancelling, onContextMenu, onResubmitMessage, editingIndex, onCancelEditing,
  stopwatchSeconds, isStopwatchRunning
}) => {
  const [input, setInput] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [editingText, setEditingText] = useState('');
  const [dynamicStatus, setDynamicStatus] = useState<string | null>(aiStatus);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const isLoading = (aiStatus !== null && Object.keys(LOADING_TEXTS).includes(aiStatus));
  const showStarterPrompts = !hasGeneratedCode && messages.length <= 1;

  useEffect(() => {
    let intervalId: number | undefined;

    if (aiStatus && LOADING_TEXTS[aiStatus]) {
      const messages = LOADING_TEXTS[aiStatus];
      setDynamicStatus(messages[0]); // Set initial text immediately
      if (messages.length > 1) {
        let index = 0;
        intervalId = window.setInterval(() => {
          index = (index + 1) % messages.length;
          setDynamicStatus(messages[index]);
        }, 2500);
      }
    } else {
      setDynamicStatus(aiStatus);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [aiStatus]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, aiStatus]);

  useEffect(() => {
    if (editingIndex !== null && messages[editingIndex]) {
      setEditingText(messages[editingIndex].content);
    }
  }, [editingIndex, messages]);

  const handleSend = () => {
    if ((input.trim() || attachment) && !isLoading) {
      onSendMessage(input.trim(), attachment);
      setInput('');
      setAttachment(null);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
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
                setAttachment({ name: file.name, type: file.type, content: base64String });
            }
        };
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

  const cancelEditing = () => {
    onCancelEditing();
    setEditingText('');
  };

  const confirmEditing = () => {
    if (editingIndex !== null && editingText.trim()) {
      onResubmitMessage(editingIndex, editingText.trim());
    }
    cancelEditing();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && editingIndex !== null) {
            cancelEditing();
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingIndex, cancelEditing]);
  
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    longPressTimerRef.current = window.setTimeout(() => {
      onContextMenu(e as any, index);
      longPressTimerRef.current = null;
    }, 500);
  };
  
  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const displayedMessages = messages.filter(m => m.role !== 'system' || (m.role === 'system' && !!m.action));
  const reversedMessages = [...displayedMessages].reverse();
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col h-full bg-black/20 backdrop-blur-lg md:border border-white/10 md:rounded-2xl overflow-hidden">
      <div ref={scrollContainerRef} className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col-reverse gap-6">
          {aiStatus && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full border border-purple-400/50 flex items-center justify-center flex-shrink-0 bg-black/20 p-0.5 relative">
                 <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 opacity-50" />
                 <div className="absolute inset-0 rounded-full border border-purple-400 animate-pulse"></div>
              </div>
              <div className="max-w-md p-3 rounded-xl bg-black/30 text-gray-200 rounded-bl-none">
                <div className="flex items-center space-x-3">
                  {isLoading && <div className="loader-atom"></div>}
                  <p className="text-sm text-gray-300">{dynamicStatus}</p>
                </div>
              </div>
            </div>
          )}
          {reversedMessages.map((msg, revIndex) => {
            const originalIndex = displayedMessages.length - 1 - revIndex;

            if (msg.action === 'GOTO_PREVIEW') {
              return (
                <div key={`${originalIndex}-action`} className="md:hidden flex justify-center py-2">
                  <button onClick={onNavigateToPreview} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors">
                    <Icon name="eye" className="w-4 h-4" /> <span>{msg.content}</span>
                  </button>
                </div>
              );
            }

            const isEditing = editingIndex === originalIndex;

            return (
              <div key={originalIndex} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                onContextMenu={(e) => { if (msg.role === 'user') onContextMenu(e, originalIndex); }}
                onTouchStart={(e) => { if (msg.role === 'user') handleTouchStart(e, originalIndex); }}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd} // Cancel on scroll
              >
                {msg.role === 'model' && 
                  <div className="w-8 h-8 rounded-full border border-purple-400/50 flex items-center justify-center flex-shrink-0 bg-black/20 p-0.5">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 opacity-50" />
                  </div>
                }
                 <div className={`max-w-md p-4 rounded-2xl ${msg.role === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-black/30 text-gray-200 rounded-bl-none'}`}
                    onClick={(e) => isEditing && e.stopPropagation()}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full bg-purple-700/80 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={cancelEditing} className="px-3 py-1 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20">Cancel</button>
                            <button onClick={confirmEditing} className="px-3 py-1 text-xs font-semibold rounded-md bg-white text-purple-700 hover:bg-gray-200">Save & Submit</button>
                        </div>
                    </div>
                  ) : (
                    <>
                      {msg.role === 'model' ? (
                        <ModelMessageContent message={msg} index={originalIndex} onComplete={onStreamingComplete} />
                      ) : (
                         <p className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(msg.content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                      )}
                     
                      {!msg.streaming && msg.plan && <PlanDisplay plan={msg.plan} />}
                      {!msg.streaming && msg.action === 'AWAITING_PLAN_APPROVAL' && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                          <button onClick={() => onSendMessage("Looks good, build the application now.")} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors disabled:bg-gray-600">
                            <Icon name="lightning" className="w-4 h-4" /> Build Application
                          </button>
                          <button onClick={() => inputRef.current?.focus()} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50">Suggest Changes</button>
                        </div>
                      )}
                      {!msg.streaming && showStarterPrompts && originalIndex === 0 && (
                        <div className="mt-4 space-y-4 border-t border-white/10 pt-4">
                            <div className="grid grid-cols-1 gap-2">
                                {STARTER_PROMPTS.map(p => (
                                    <button key={p.label} onClick={() => onSendMessage(p.prompt, null)} className="text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200 w-full disabled:opacity-50" disabled={isLoading}>
                                        <span className="font-semibold text-purple-300">{p.label}</span>
                                        <p className="text-gray-400 text-xs mt-1 leading-snug">{p.prompt}</p>
                                    </button>
                                ))}
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Choose a Design Blueprint</h4>
                                <div className="grid grid-cols-2 gap-2">
                                     {DESIGN_BLUEPRINTS.map(d => (
                                        <button key={d.name} onClick={() => onSendMessage(`${STARTER_PROMPTS[0].prompt} ${d.promptFragment}`)} className="text-left p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200 w-full disabled:opacity-50" disabled={isLoading}>
                                            <span className="font-semibold text-purple-300">{d.name}</span>
                                            <p className="text-gray-400 text-xs mt-1 leading-snug">{d.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                      )}
                    </>
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
                <img src={`data:${attachment.type};base64,${attachment.content}`} alt={attachment.name} className="h-16 w-auto rounded" />
                <button onClick={() => { setAttachment(null); if (fileInputRef.current) { fileInputRef.current.value = ''; } }} className="absolute -top-2 -right-2 bg-gray-800 border border-white/10 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors" aria-label="Remove attachment">
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
            className="w-full bg-black/40 rounded-xl p-3 pr-20 sm:pr-24 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 transition-shadow"
            rows={1}
            disabled={isLoading || isCancelling}
          />
          <div className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isCancelling ? (
                <button className="px-3 py-2 text-xs font-semibold rounded-lg bg-yellow-600 text-white" aria-label="Cancelling generation">
                    Cancelling...
                </button>
            ) : isLoading ? (
                <button onClick={onCancelRequest} className="px-3 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 transition-colors" aria-label="Cancel generation">
                    Cancel
                </button>
            ) : (
                <>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" aria-label="Attach file" disabled={isLoading}><Icon name="paperclip" className="w-5 h-5"/></button>
                    <button onClick={handleSend} disabled={isLoading || (!input.trim() && !attachment)} className="p-2 rounded-lg text-white bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" aria-label="Send message">
                    <Icon name="send" className="w-5 h-5" />
                    </button>
                </>
            )}
          </div>
        </div>
        {stopwatchSeconds > 0 && (
          <div className="flex items-center justify-center gap-2 mt-3 text-sm text-gray-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatTime(stopwatchSeconds)}</span>
            {isStopwatchRunning && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;