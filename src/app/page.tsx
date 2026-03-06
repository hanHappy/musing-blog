'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import TableOfContents from '@/components/TableOfContents';
import ChatInput from '@/components/ChatInput';
import ChatSession from '@/components/ChatSession';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Mock data for demonstration
const categories = [
  {
    name: 'Technology',
    slug: 'technology',
    count: 15,
    children: [
      {
        name: 'Web Development',
        slug: 'web-development',
        count: 10,
        children: [
          { name: 'Frontend', slug: 'frontend', count: 5 },
          { name: 'Backend', slug: 'backend', count: 5 },
        ],
      },
      {
        name: 'Mobile Development',
        slug: 'mobile-development',
        count: 5,
        children: [
          { name: 'iOS', slug: 'ios', count: 2 },
          { name: 'Android', slug: 'android', count: 3 },
        ],
      },
    ],
  },
  {
    name: 'Design',
    slug: 'design',
    count: 8,
    children: [
      {
        name: 'UI/UX',
        slug: 'ui-ux',
        count: 8,
        children: [
          { name: 'User Research', slug: 'user-research', count: 4 },
          { name: 'Prototyping', slug: 'prototyping', count: 4 },
        ],
      },
    ],
  },
];

const posts = [
  {
    title: 'On the Modern Art of Web Construction',
    excerpt:
      "A gentleman's guide to the construction of digital estates using the latest methodologies of Next.js, as observed in the year 2026.",
    slug: 'getting-started-nextjs-16',
    date: '28th of February, 2026',
    category: 'Frontend',
  },
  {
    title: 'The Science of RESTful Communication',
    excerpt:
      'Wherein we explore the establishment of reliable channels of data exchange through the noble art of Node.js programming.',
    slug: 'building-restful-api-nodejs',
    date: '27th of February, 2026',
    category: 'Backend',
  },
  {
    title: 'Principles of Aesthetic Digital Design',
    excerpt:
      'Essential tenets for the creation of beautiful and functional user experiences, as befitting a modern technical endeavor.',
    slug: 'ui-design-principles',
    date: '26th of February, 2026',
    category: 'UI/UX',
  },
];

const tocItems = [
  { id: 'section-1', text: 'Latest Chronicles', level: 2 },
  { id: 'section-2', text: 'Featured Tales', level: 2 },
  { id: 'section-3', text: 'Archives', level: 2 },
];

export default function Home() {
  const [isChatActive, setIsChatActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleChatSubmit = (query: string) => {
    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setIsChatActive(true);
  };

  const handleChatClose = () => {
    setMessages([]);
    setIsChatActive(false);
  };

  const handleNewMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 3-Panel Layout: 20% | 55% | 25% */}
      <div className="flex flex-col gap-0 lg:flex-row">
        {/* Left Panel - Categories */}
        <Sidebar categories={categories} />

        {/* Center Panel - Main Content */}
        <main className="flex-1 px-6 lg:w-[55%]">
          {/* Chat Input - Only show when chat is not active */}
          {!isChatActive && (
            <ChatInput onSubmit={handleChatSubmit} isLoading={false} />
          )}

          {/* Chat Session - Show when active */}
          {isChatActive && (
            <div className="fade-in">
              <ChatSession
                messages={messages}
                onNewMessage={handleNewMessage}
                onClose={handleChatClose}
              />
            </div>
          )}

          {/* Post List - Hide when chat is active */}
          {!isChatActive && (
            <div className="fade-in">
              <div className="mb-8 border-b border-[var(--border-color)] pb-4">
                <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                  Latest Posts
                </h2>
              </div>

              <div>
                {posts.map((post) => (
                  <PostCard key={post.slug} {...post} />
                ))}
              </div>

              {/* Infinite Scroll Indicator */}
              <div className="mt-8 border-t border-[var(--border-color)] pt-6">
                <p className="text-center text-xs text-[var(--text-muted)]">
                  More posts below...
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Panel - About & Contact */}
        <TableOfContents items={tocItems} />
      </div>
    </div>
  );
}
