import { useState, useRef, useEffect } from 'react';
import { Send, Github, Rss, User } from 'lucide-react';
import { ChatBubble } from './ChatBubble';
import { searchPosts } from '../data/blogData';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  relatedSlugs?: string[];
}

interface CenterCardProps {
  onSlugClick: (slug: string) => void;
  onHighlightPosts: (slugs: string[]) => void;
}

export function CenterCard({ onSlugClick, onHighlightPosts }: CenterCardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateResponse = (query: string): { content: string; relatedSlugs: string[] } => {
    const posts = searchPosts(query);
    
    if (posts.length === 0) {
      return {
        content: `"${query}"에 대한 글을 찾지 못했어요. 다른 키워드로 검색해보시거나, 아래 주제들에 대해 물어봐주세요:\n\n- IT 개발 경험\n- 아이디어와 사고\n- 주식 투자 기록\n- 일상과 관계`,
        relatedSlugs: []
      };
    }

    const slugs = posts.map(p => p.slug!);
    const postTitles = posts.map(p => p.label).join(', ');
    
    return {
      content: `${posts.length}개의 관련 글을 찾았습니다: ${postTitles}\n\n아래 링크를 클릭하면 전체 내용을 확인할 수 있어요.`,
      relatedSlugs: slugs
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Simulate thinking time
    setTimeout(() => {
      const response = generateResponse(userMessage.content);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.content,
        relatedSlugs: response.relatedSlugs
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);

      // Highlight related posts in the network
      if (response.relatedSlugs.length > 0) {
        onHighlightPosts(response.relatedSlugs);
      }
    }, 800);
  };

  return (
    <div 
      className="w-[60%] h-[640px] flex flex-col"
      style={{
        background: 'var(--card-bg)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glow)',
        borderRadius: '16px',
        boxShadow: '0 0 30px rgba(0, 255, 200, 0.2), inset 0 0 20px rgba(0, 255, 200, 0.05)',
      }}
    >
      {/* Header */}
      <div className="p-8 pb-4">
        <h1 
          className="text-3xl mb-2"
          style={{
            fontFamily: 'Space Grotesk, Noto Sans KR, sans-serif',
            color: 'var(--text-primary)',
            fontWeight: 600,
          }}
        >
          muse.log
        </h1>
        <p 
          className="text-sm mb-4"
          style={{
            fontFamily: 'Inter, Noto Sans KR, sans-serif',
            color: 'var(--text-muted)',
          }}
        >
          개발하고 투자하고 살아가는 사람의 기록
        </p>
        
        {/* Links */}
        <div className="flex gap-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm hover:text-[var(--accent-color)] transition-colors"
            style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
          <a 
            href="#about"
            className="flex items-center gap-1.5 text-sm hover:text-[var(--accent-color)] transition-colors"
            style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
          >
            <User size={16} />
            <span>About</span>
          </a>
          <a 
            href="#rss"
            className="flex items-center gap-1.5 text-sm hover:text-[var(--accent-color)] transition-colors"
            style={{ color: 'var(--text-muted)', fontFamily: 'Inter, sans-serif' }}
          >
            <Rss size={16} />
            <span>RSS</span>
          </a>
        </div>
      </div>

      <div 
        className="mx-8 mb-4"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--border-glow), transparent)',
          opacity: 0.3,
        }}
      />

      {/* Chat History */}
      <div 
        ref={scrollRef}
        className="flex-1 px-8 overflow-y-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--border-glow) transparent',
        }}
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p 
              className="text-center"
              style={{
                color: 'var(--text-muted)',
                fontFamily: 'Inter, Noto Sans KR, sans-serif',
              }}
            >
              무엇이든 물어보세요 ✨
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatBubble
              key={index}
              role={message.role}
              content={message.content}
              relatedSlugs={message.relatedSlugs}
              onSlugClick={onSlugClick}
            />
          ))
        )}
      </div>

      <div 
        className="mx-8 mb-4"
        style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, var(--border-glow), transparent)',
          opacity: 0.3,
        }}
      />

      {/* Input */}
      <div className="p-8 pt-0">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="🔍 muse에게 무엇이든 물어보세요..."
            disabled={isProcessing}
            className="w-full px-4 py-3 pr-12 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] focus:border-[var(--accent-color)] focus:outline-none transition-colors"
            style={{
              fontFamily: 'Inter, Noto Sans KR, sans-serif',
              color: 'var(--text-primary)',
              fontSize: '14px',
            }}
          />
          <button
            type="submit"
            disabled={isProcessing || !inputValue.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-[rgba(0,255,200,0.1)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} style={{ color: 'var(--accent-color)' }} />
          </button>
        </form>
      </div>
    </div>
  );
}
