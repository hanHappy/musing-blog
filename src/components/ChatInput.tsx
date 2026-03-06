'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function ChatInput({
  onSubmit,
  isLoading = false,
  disabled = false,
}: ChatInputProps) {
  const [query, setQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
  }, [query]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (query.trim() && !isLoading && !disabled) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim() && !isLoading && !disabled) {
        onSubmit(query.trim());
        setQuery('');
      }
    }
  };

  return (
    <div className="mb-12">
      {/* Guide Text */}
      <div className="mb-6 text-center">
        <p className="text-base text-[var(--text-secondary)]">
          블로그에 대해 궁금한 점을 물어보세요
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <label htmlFor="chat-input" className="sr-only">
            Ask about the blog
          </label>
          <textarea
            ref={textareaRef}
            id="chat-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the blog..."
            disabled={isLoading || disabled}
            aria-label="Search blog"
            rows={1}
            className="text-input resize-none"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!query.trim() || isLoading || disabled}
            aria-label="Submit query"
            className="submit-btn"
          >
            {isLoading ? (
              <svg
                className="loading-spinner"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            ) : (
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
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
