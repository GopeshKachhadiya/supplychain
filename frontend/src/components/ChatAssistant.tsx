'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'Why is demand spiking?',
  'Which product needs reorder?',
  'Best route Mumbai to Delhi?',
  'Simulate supplier disruption',
];

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm AnvayaAI, your supply chain intelligence assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
        }
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      setMessages((prev) => [...prev, data]);
    } catch (error: unknown) {
      console.error('Chat Error:', error);
      const message =
        error instanceof Error
          ? error.message
          : "I'm sorry, I'm having trouble connecting right now. Please try again later.";
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: message,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-[500px] w-[400px] flex-col overflow-hidden rounded-2xl border border-[#acb3ba]/20 bg-white shadow-2xl animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between bg-[#7C3AED] p-4 text-white shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">AnvayaAI Assistant</h3>
                <p className="text-[10px] text-white/70">Supply Chain Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 transition-colors hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#f9f9fc] p-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn('flex gap-3', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg shadow-sm',
                    m.role === 'user' ? 'bg-white text-[#596067]' : 'bg-[#7C3AED]/10 text-[#7C3AED]'
                  )}
                >
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl p-3 text-sm shadow-sm',
                    m.role === 'user'
                      ? 'rounded-tr-none bg-[#7C3AED] text-white'
                      : 'rounded-tl-none border border-[#acb3ba]/10 bg-white text-[#2d3339]'
                  )}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex animate-pulse gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                  <Bot className="h-4 w-4 text-[#7C3AED]" />
                </div>
                <div className="rounded-2xl rounded-tl-none border border-[#acb3ba]/10 bg-white p-3 shadow-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-[#7C3AED]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && !isLoading && (
            <div className="flex flex-wrap gap-2 bg-[#f9f9fc] px-4 pb-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="cursor-pointer rounded-full border border-[#7C3AED]/20 bg-white px-3 py-1.5 text-[11px] text-[#7C3AED] shadow-sm transition-all hover:bg-[#7C3AED] hover:text-white"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-[#acb3ba]/10 bg-white p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AnvayaAI..."
                className="flex-1 rounded-xl border-none bg-[#f2f3f8] px-4 py-2.5 text-sm outline-none transition-all focus:ring-2 focus:ring-[#7C3AED]/20"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="rounded-xl bg-[#7C3AED] p-2.5 text-white shadow-lg shadow-[#7C3AED]/20 transition-all hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'group flex h-14 w-14 transform items-center justify-center rounded-full shadow-xl transition-all duration-300 active:scale-95',
          isOpen ? 'rotate-0 bg-white text-[#2d3339]' : 'bg-[#7C3AED] text-white shadow-[#7C3AED]/30 hover:bg-[#6D28D9]'
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-7 w-7 transition-transform group-hover:scale-110" />
        )}
      </button>
    </div>
  );
}
