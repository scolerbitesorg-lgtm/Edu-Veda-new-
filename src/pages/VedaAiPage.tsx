import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  Loader2,
  ChevronLeft,
  RotateCcw,
} from 'lucide-react';
import { askVedaAi } from '../services/ai';
import { generateVedaAiEducationalResponse } from '../data/educationalKnowledge';
import { useAuth } from '../context/AuthContext';
import { useAudio } from '../context/AudioContext';
import type { ChatMessage } from '../types';

interface VedaAiPageProps {
  onBack?: () => void;
}

const getInitialWelcomeMessage = (): ChatMessage => ({
  id: `welcome_${Date.now()}`,
  role: 'assistant',
  text: 'Namaste! I am **Veda AI**, your personal academic mentor and doubt-solver on Edu Veda.\n\nAsk me any concept, formula, constitutional article, historical event, or question for **UPSC, SSC, State PSC, NEET/JEE, Boards, or UGC NET**. How can I help your preparation today?',
  timestamp: new Date(),
});

export const VedaAiPage: React.FC<VedaAiPageProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const { playTap, playSuccess } = useAudio();

  // Chat starts fresh every time Veda AI is opened or web is refreshed
  const [messages, setMessages] = useState<ChatMessage[]>([getInitialWelcomeMessage()]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clean up any old chat history in localStorage so it never persists
  useEffect(() => {
    try {
      localStorage.removeItem('edu_veda_chat_history');
    } catch {
      // ignore
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleRestartChat = () => {
    playTap();
    setMessages([getInitialWelcomeMessage()]);
    setInput('');
    setIsLoading(false);
  };

  const handleExit = () => {
    playTap();
    // Reset state and call onBack
    setMessages([getInitialWelcomeMessage()]);
    if (onBack) {
      onBack();
    }
  };

  const quickPrompts = [
    'Explain Newton’s Laws with real examples',
    'Class 10 Light Reflection & Refraction summary',
    'Top 5 MCQs on Indian Constitution',
    'Tips to prepare a daily study timetable',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    playTap();

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    // Format history for backend
    const historyPayload = newMessages
      .slice(-6)
      .map(m => ({ role: m.role, text: m.text }));

    try {
      const response = await askVedaAi(text, historyPayload);

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        text: response.reply,
        provider: response.provider,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      playSuccess();
    } catch {
      const educationalText = generateVedaAiEducationalResponse(text);
      const fallbackMsg: ChatMessage = {
        id: `ai_err_${Date.now()}`,
        role: 'assistant',
        text: educationalText,
        provider: 'educational-engine',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8F9FD] flex flex-col h-[100dvh] w-full overflow-hidden select-none">
      {/* AI Full Screen Header */}
      <header className="bg-white px-4 py-3 border-b border-slate-200/80 shadow-xs flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={handleExit}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors active:scale-95 shrink-0"
              aria-label="Back to Edu Veda"
              title="Back to Edu Veda"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-sm text-slate-900 tracking-tight">Veda AI</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                Online
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Intelligent Educational Mentor &bull; 24/7 Companion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Restart / New Chat button */}
          <button
            type="button"
            onClick={handleRestartChat}
            className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-xs font-semibold active:scale-95 transition-all flex items-center gap-1"
            title="Restart Fresh Chat"
            aria-label="Restart Fresh Chat"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">New Chat</span>
          </button>

          {onBack && (
            <button
              type="button"
              onClick={handleExit}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold active:scale-95 transition-all"
            >
              Exit
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full select-text">
        {messages.map(msg => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                  isUser
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? (
                  profile?.name ? (
                    profile.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-4 h-4" />
                  )
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-tl-xs whitespace-pre-wrap'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[9px] mt-1.5 flex items-center justify-between gap-2 select-none ${
                    isUser ? 'text-indigo-200 justify-end' : 'text-slate-400'
                  }`}
                >
                  {!isUser && msg.provider && msg.provider !== 'built-in' && msg.provider !== 'educational-engine' && (
                    <span className="capitalize text-[8.5px] px-1.5 py-0.2 rounded-sm bg-slate-100 text-slate-500 font-medium">
                      {msg.provider}
                    </span>
                  )}
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* AI Typing Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs border border-slate-100 flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-1.5 font-medium">Veda is formulating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Prompts */}
      {messages.length <= 1 && !isLoading && (
        <div className="max-w-2xl mx-auto w-full px-4 pt-1 pb-2 shrink-0">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            <Lightbulb className="w-3 h-3 text-amber-500" />
            <span>Suggested Topics</span>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(p)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 whitespace-nowrap active:scale-95 transition-all shadow-xs shrink-0"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Highly Visible Input Box Bar - Pinned above bottom edge and safe area */}
      <div className="shrink-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_25px_rgba(0,0,0,0.06)] z-20">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="max-w-2xl mx-auto"
        >
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask Veda AI any topic or study question..."
              disabled={isLoading}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white pl-4 pr-12 py-3.5 rounded-2xl border border-slate-300 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 shadow-inner transition-all"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-95 disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 shadow-md shadow-indigo-600/20"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
