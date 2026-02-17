
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types';

import { queryRAG } from '../services/geminiService';

interface AIChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const AIChat: React.FC<AIChatProps> = ({ messages, setMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages
      .map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

    // Remove the last message from history as it is the current query which retrieves the answer
    // Actually, the chat.sendMessage in service handles the current query separately from history initialization.
    // The history passed to chat.create should NOT include the latest user message that we are about to send via sendMessage?
    // Wait, the `chat.sendMessage` method in the service takes the query. The `history` passed to `ai.chats.create` should be everything BEFORE the current query.
    // In handleSend, we added the user message to state `setMessages(prev => [...prev, userMsg])`.
    // So `messages` contains the current query at the end.
    // We should pass `messages` up to (but not including) the last one if we want to initialize history, 
    // OR we relies on the service to handle it?
    // Let's look at `geminiService.ts`:
    // It does `ai.chats.create({ history: history ... })` then `chat.sendMessage(query)`.
    // So `history` should be past messages, and `query` is the new one.

    // Construct history excluding the very last message (which is `input` / `userMsg`)
    // But wait, `setMessages` is async-ish in React state, but here we are in the function closure.
    // We already did `setMessages(prev => [...prev, userMsg])`.
    // But `messages` variable in this closure is the OLD state (pre-update).
    // So `messages` here is exactly the history BEFORE the new user message. Perfect.

    const contextHistory = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await queryRAG(input, contextHistory);

    setMessages(prev => [...prev, { role: 'model', text: response, timestamp: new Date() }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[600px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
          <span className="font-semibold text-slate-700">Enlasa AI Assistant</span>
        </div>
        <span className="text-xs bg-enlasa-blue/10 text-enlasa-blue px-2 py-1 rounded-full font-medium">RAG Active</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${m.role === 'user'
              ? 'bg-enlasa-blue text-white rounded-tr-none'
              : 'bg-white text-slate-700 shadow-sm border border-slate-200 rounded-tl-none'
              }`}>
              {m.role === 'model' ? (
                <div className="text-sm markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{m.text}</p>
              )}

              <p className={`text-[10px] mt-1 ${m.role === 'user' ? 'text-white/70' : 'text-slate-400'}`}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-200 flex gap-2">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre normativas, leyes o personal..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-enlasa-blue/20 focus:border-enlasa-blue transition-all"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-enlasa-blue text-white p-3 rounded-xl hover:bg-opacity-90 transition-all disabled:bg-slate-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
