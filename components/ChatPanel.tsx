import React, { useState, useRef, useEffect } from 'react';
import type { Message, FileAttachment, Plan } from '../types';
import { Icon } from './Icon';
import { STARTER_PROMPTS, DESIGN_BLUEPRINTS } from '../constants';
import ProgressBar from './ProgressBar';

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
  useEffect(() => {
    if (message.streaming) {
      setTimeout(() => onComplete(index), 100);
    }
  }, [message.streaming, onComplete, index]);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(message.content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
  );
});


interface ChatPanelProps {
   messages: Message[];
   onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
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
   streamingProgress?: {
     receivedBytes: number;
     totalBytes?: number;
     progress: number;
   } | null;
   retryAttempt?: number;
   aiReasoning?: string;
   aiTasks?: Array<{
     id: string;
     description: string;
     status: 'pending' | 'in_progress' | 'completed';
   }>;
 }

const LOADING_TEXTS: Record<string, string[]> = {
  'MominAI is working...': [
    'Analyzing requirements...',
    'Designing architecture...',
    'Planning file structure...',
    'Preparing generation sequence...',
  ],
  'Planning project...': [
    'Analyzing requirements...',
    'Designing file structure...',
    'Planning component hierarchy...',
    'Preparing build sequence...',
  ],
  'Generating application...': [
    'Setting up project structure...',
    'Creating core files...',
    'Building components...',
    'Implementing features...',
  ],
  'Working on file...': [
    'Analyzing file requirements...',
    'Writing code structure...',
    'Implementing functionality...',
    'Finalizing file...',
  ],
  'Applying changes...': [
    'Integrating new features...',
    'Updating complex architecture...',
    'Ensuring consistency...',
  ],
  'Verifying generated code...': [
    'Running comprehensive tests...',
    'Validating all interactions...',
    'Ensuring perfection...',
  ],
    'Errors detected. Attempting to fix...': [
      'Engaging advanced debugging...',
      'Applying intelligent fixes...',
      'Restoring functionality...',
    ]
};

const PlanDisplay: React.FC<{ plan: Plan }> = ({ plan }) => (
    <div className="border-t border-white/10 mt-4 pt-4">
        <h4 className="font-bold text-md text-purple-300">Product Requirements Document (PRD): {plan.projectName}</h4>
        <p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{plan.description}</p>

        <h5 className="font-semibold mt-4 mb-2 text-gray-200">Key Features:</h5>
        <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
            {plan.features.map((f, i) => <li key={i}>{f}</li>)}
        </ul>

        <h5 className="font-semibold mt-4 mb-2 text-gray-200">Tech Stack:</h5>
        <div className="flex flex-wrap gap-2">
            {plan.techStack.map((t, i) => <span key={i} className="bg-white/10 text-purple-300 text-xs px-2 py-1 rounded-full font-medium">{t}</span>)}
        </div>

        <h5 className="font-semibold mt-4 mb-2 text-gray-200">Backend Requirements:</h5>
        <ul className="text-sm text-gray-400 space-y-1">
            <li><strong>API Endpoints:</strong> {plan.backendRequirements.apiEndpoints.join(', ')}</li>
            <li><strong>Database Schema:</strong> {plan.backendRequirements.databaseSchema}</li>
            <li><strong>Authentication:</strong> {plan.backendRequirements.authentication}</li>
            <li><strong>Services:</strong> {plan.backendRequirements.services.join(', ')}</li>
            <li><strong>File Structure:</strong> {plan.backendRequirements.fileStructure.join(', ')}</li>
        </ul>

        <h5 className="font-semibold mt-4 mb-2 text-gray-200">Frontend Requirements:</h5>
        <ul className="text-sm text-gray-400 space-y-1">
            <li><strong>Components:</strong> {plan.frontendRequirements.components.join(', ')}</li>
            <li><strong>State Management:</strong> {plan.frontendRequirements.stateManagement}</li>
            <li><strong>Routing:</strong> {plan.frontendRequirements.routing}</li>
            <li><strong>Styling:</strong> {plan.frontendRequirements.styling}</li>
            <li><strong>File Structure:</strong> {plan.frontendRequirements.fileStructure.join(', ')}</li>
        </ul>

        <h5 className="font-semibold mt-4 mb-2 text-gray-200">Standalone HTML Requirements:</h5>
        <ul className="text-sm text-gray-400 space-y-1">
            <li><strong>HTML Structure:</strong> {plan.standaloneRequirements.htmlStructure}</li>
            <li><strong>CSS Integration:</strong> {plan.standaloneRequirements.cssIntegration}</li>
            <li><strong>JS Functionality:</strong> {plan.standaloneRequirements.jsFunctionality}</li>
            <li><strong>Features:</strong> {plan.standaloneRequirements.features.join(', ')}</li>
            <li><strong>Quality Standards:</strong> {plan.standaloneRequirements.qualityStandards.join(', ')}</li>
        </ul>
    </div>
);

const ChatPanel: React.FC<ChatPanelProps> = ({
  messages, onSendMessage, aiStatus, onStreamingComplete, hasGeneratedCode, onNavigateToPreview,
  onCancelRequest, isCancelling, onContextMenu, onResubmitMessage, editingIndex, onCancelEditing,
  stopwatchSeconds, isStopwatchRunning, streamingProgress, retryAttempt = 0, aiReasoning, aiTasks
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [editingText, setEditingText] = useState('');
  const [dynamicStatus, setDynamicStatus] = useState<string | null>(aiStatus);
  const [imageModal, setImageModal] = useState<{src: string, alt: string} | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isStatusExpanded, setIsStatusExpanded] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
        }, 4000); // Changed from 2500ms to 4000ms for longer animations
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
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, aiStatus]);

  useEffect(() => {
    if (editingIndex !== null && messages[editingIndex]) {
      setEditingText(messages[editingIndex].content);
    }
  }, [editingIndex, messages]);

  const handleSend = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined);
      setInput('');
      setAttachments([]);
      if (fileInputRef.current) {
          fileInputRef.current.value = '';
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert("Please select image files (e.g., PNG, JPG, GIF).");
      return;
    }

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64String = (loadEvent.target?.result as string).split(',')[1];
        if (base64String) {
          const newAttachment = { name: file.name, type: file.type, content: base64String };
          setAttachments(prev => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    });
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
      alert("Please drop image files (e.g., PNG, JPG, GIF).");
      return;
    }

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64String = (loadEvent.target?.result as string).split(',')[1];
        if (base64String) {
          const newAttachment = { name: file.name, type: file.type, content: base64String };
          setAttachments(prev => [...prev, newAttachment]);
        }
      };
      reader.readAsDataURL(file);
    });
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
    <div className={`flex flex-col h-full bg-white/5 backdrop-blur-xl md:border border-white/20 md:rounded-2xl overflow-hidden ${isDragOver ? 'ring-2 ring-white/50 ring-opacity-50' : ''}`}
         onDragOver={handleDragOver}
         onDragEnter={handleDragEnter}
         onDragLeave={handleDragLeave}
         onDrop={handleDrop}>
      <div ref={scrollContainerRef} className="flex-grow p-3 md:p-4 overflow-y-auto min-h-0">
        <div className="flex flex-col-reverse gap-6">
          {aiStatus && (
            <div className="flex items-start gap-3">
              <div className="w-8" /> {/* Spacer */}
              <div className="max-w-md">
                <div className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-white mb-1">{dynamicStatus || aiStatus}</h4>
                    {streamingProgress && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Receiving data...</span>
                          <span>{streamingProgress.receivedBytes ? formatBytes(streamingProgress.receivedBytes) + ' received' : ''}</span>
                        </div>
                        <ProgressBar
                          progress={streamingProgress.progress}
                          receivedBytes={streamingProgress.receivedBytes}
                          totalBytes={streamingProgress.totalBytes}
                          className="w-full h-1"
                        />
                        <div className="text-center text-xs text-gray-400">
                          {Math.round(streamingProgress.progress)}% complete
                        </div>
                      </div>
                    )}
                    {/* AI Reasoning Display */}
                    {aiReasoning && (
                      <div className="mt-3 p-3 bg-purple-900/20 rounded-lg border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="brain" className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-semibold text-purple-300">AI Reasoning</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{aiReasoning}</p>
                      </div>
                    )}
                    {/* AI Tasks Display */}
                    {aiTasks && aiTasks.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon name="checklist" className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-semibold text-blue-300">Tasks</span>
                        </div>
                        <div className="space-y-1">
                          {aiTasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-2 text-xs">
                              <div className={`w-2 h-2 rounded-full ${
                                task.status === 'completed' ? 'bg-green-400' :
                                task.status === 'in_progress' ? 'bg-blue-400 animate-pulse' :
                                'bg-gray-500'
                              }`} />
                              <span className={`${
                                task.status === 'completed' ? 'text-green-300 line-through' :
                                task.status === 'in_progress' ? 'text-blue-300' :
                                'text-gray-400'
                              }`}>
                                {task.description}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {streamingProgress && (
                    <button
                      onClick={() => setIsStatusExpanded(!isStatusExpanded)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      aria-label="Toggle status details"
                    >
                      <Icon name="chevron-right" className={`w-4 h-4 transition-transform ${isStatusExpanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>
                {retryAttempt > 0 && (
                  <div className="mt-2 text-xs text-yellow-400 font-medium">
                    Retry {retryAttempt}
                  </div>
                )}
              </div>
            </div>
          )}
          {reversedMessages.map((msg, revIndex) => {
            const originalIndex = displayedMessages.length - 1 - revIndex;

            if (msg.action === 'GOTO_PREVIEW') {
              return (
                <div key={`${originalIndex}-action`} className="md:hidden flex justify-center py-2">
                  <button onClick={onNavigateToPreview} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-colors border border-white/20">
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
                {msg.role === 'model' && <div className="w-8" />} {/* Spacer for alignment */}
                 <div className={`max-w-xs md:max-w-md p-3 md:p-4 rounded-2xl ${msg.role === 'user' ? 'bg-white/10 backdrop-blur-xl text-white rounded-br-none border border-white/20 shadow-lg' : 'text-gray-100'}`}
                    onClick={(e) => isEditing && e.stopPropagation()}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="w-full bg-white/10 backdrop-blur-xl rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50 border border-white/20"
                                  rows={3}
                                  autoFocus
                              />
                        <div className="flex justify-end gap-2">
                            <button onClick={cancelEditing} className="px-3 py-1 text-xs font-semibold rounded-md bg-white/10 hover:bg-white/20">Cancel</button>
                            <button onClick={confirmEditing} className="px-3 py-1 text-xs font-semibold rounded-md bg-white/20 backdrop-blur-xl text-white hover:bg-white/30 border border-white/20">Save & Submit</button>
                        </div>
                    </div>
                  ) : (
                    <>
                      {msg.role === 'model' ? (
                        <ModelMessageContent message={msg} index={originalIndex} onComplete={onStreamingComplete} />
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(msg.content).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {msg.attachments.map((attachment, idx) => (
                                <img 
                                  key={idx}
                                  src={`data:${attachment.type};base64,${attachment.content}`} 
                                  alt={attachment.name} 
                                  className="max-w-48 max-h-32 rounded-lg border border-white/20 cursor-pointer hover:opacity-80 transition-opacity" 
                                  onClick={() => setImageModal({src: `data:${attachment.type};base64,${attachment.content}`, alt: attachment.name})}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                     
                      {!msg.streaming && msg.plan && <PlanDisplay plan={msg.plan} />}
                      {!msg.streaming && msg.action === 'AWAITING_PLAN_APPROVAL' && (
                        <div className="mt-4 flex flex-col sm:flex-row gap-2">
                          <button onClick={() => onSendMessage("Looks good, build the application now.")} disabled={isLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-white/20 backdrop-blur-xl hover:bg-white/30 transition-colors disabled:bg-gray-600 border border-white/20">
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
      <div className="p-3 md:p-4 border-t border-white/10">
        {attachments.length > 0 && (
           <div className="pb-2">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative inline-block bg-black/30 rounded-lg p-1.5">
                  <img src={`data:${attachment.type};base64,${attachment.content}`} alt={attachment.name} className="h-16 w-auto rounded" />
                  <button 
                    onClick={() => {
                      setAttachments(prev => prev.filter((_, i) => i !== index));
                      if (attachments.length === 1 && fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }} 
                    className="absolute -top-2 -right-2 bg-gray-800 border border-white/10 rounded-full p-0.5 text-white hover:bg-red-500 transition-colors" 
                    aria-label="Remove attachment"
                  >
                    <Icon name="close" className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
           </div>
        )}
        <div className="relative">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDragOver ? "Drop images here..." : "Describe your web app or attach an image reference..."}
            className="w-full bg-white/5 backdrop-blur-xl rounded-xl p-2.5 md:p-3 pr-16 sm:pr-20 md:pr-24 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-500 transition-shadow border border-white/20"
            rows={1}
            disabled={isLoading || isCancelling}
          />
          <div className="absolute right-1 sm:right-1.5 md:right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 md:gap-1">
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
                    <button onClick={() => fileInputRef.current?.click()} className="p-1.5 md:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10" aria-label="Attach file" disabled={isLoading}><Icon name="paperclip" className="w-4 h-4 md:w-5 md:h-5"/></button>
                    <button onClick={handleSend} disabled={isLoading || (!input.trim() && attachments.length === 0)} className="p-1.5 md:p-2 rounded-lg text-white bg-white/20 backdrop-blur-xl hover:bg-white/30 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors border border-white/20" aria-label="Send message">
                    <Icon name="send" className="w-4 h-4 md:w-5 md:h-5" />
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
      
      {/* Image Modal */}
      {imageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setImageModal(null)}>
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={imageModal.src} 
              alt={imageModal.alt} 
              className="max-w-full max-h-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button 
              onClick={() => setImageModal(null)}
              className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <Icon name="close" className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;