'use client';

import { useEffect, useState, useRef } from 'react';
import type { ChatMessage } from '@/app/page';

interface ChatSessionProps {
  messages: ChatMessage[];
  onNewMessage: (message: ChatMessage) => void;
  onClose: () => void;
}

export default function ChatSession({
  messages,
  onNewMessage,
  onClose,
}: ChatSessionProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom when new messages arrive or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose, isLoading]);

  // Fetch response for the last user message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    // Only fetch if the last message is from user (no response yet)
    if (!lastMessage || lastMessage.role !== 'user') return;

    const fetchResponse = async () => {
      setIsLoading(true);

      try {
        // TODO: Replace with actual RAG API endpoint
        // const res = await fetch('/api/rag', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ query: lastMessage.content }),
        // });
        // const data = await res.json();
        // onNewMessage({ role: 'assistant', content: data.response });

        // Mock response for now
        await new Promise((resolve) => setTimeout(resolve, 1500));
        onNewMessage({
          role: 'assistant',
          content: `According to the archives, your inquiry regarding "${lastMessage.content}" reveals several pertinent observations. The methodologies employed in modern web development have evolved considerably, incorporating principles of structured architecture and maintainable codebases. Further documentation may be found within the chronicles of this establishment.`,
        });
      } catch (err) {
        console.error('RAG error:', err);
        onNewMessage({
          role: 'assistant',
          content: 'Error: Unable to retrieve response. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponse();
  }, [messages, onNewMessage]);

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Update textarea height when input changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onNewMessage({ role: 'user', content: inputValue.trim() });
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        onNewMessage({ role: 'user', content: inputValue.trim() });
        setInputValue('');
      }
    }
  };

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="mb-6 flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Chat Session
        </h2>
        <button
          onClick={onClose}
          disabled={isLoading}
          className="close-btn text-sm"
          aria-label="Close chat session"
        >
          Close
        </button>
      </div>

      {/* Messages Container */}
      <div
        ref={containerRef}
        className="mb-6 max-h-[60vh] space-y-4 overflow-y-auto"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === 'user' ? 'question-box' : 'response-box'
            }
          >
            {message.role === 'user' ? (
              <p className="whitespace-pre-wrap leading-relaxed text-[var(--text-primary)]">
                {message.content}
              </p>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[var(--color-primary)]">
                    Response
                  </h3>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-[var(--text-secondary)]">
                  {message.content}
                </div>
              </>
            )}
          </div>
        ))}

        {/* Loading State */}
        {isLoading && (
          <div className="py-8" aria-live="polite">
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="input-container">
          <label htmlFor="chat-input-session" className="sr-only">
            Ask a follow-up question
          </label>
          <textarea
            ref={textareaRef}
            id="chat-input-session"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a follow-up question..."
            disabled={isLoading}
            rows={1}
            className="text-input resize-none"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            aria-label="Submit question"
            className="submit-btn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
