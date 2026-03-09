import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  relatedSlugs?: string[];
  onSlugClick?: (slug: string) => void;
}

export function ChatBubble({ role, content, relatedSlugs, onSlugClick }: ChatBubbleProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(role === 'assistant');

  useEffect(() => {
    if (role === 'assistant') {
      setIsTyping(true);
      let index = 0;
      const interval = setInterval(() => {
        setDisplayedText(content.slice(0, index));
        index++;
        
        if (index > content.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, 20);
      
      return () => clearInterval(interval);
    } else {
      setDisplayedText(content);
    }
  }, [content, role]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className="max-w-[80%]">
        <div
          className={`px-4 py-3 rounded-2xl ${
            role === 'user'
              ? 'bg-[#00FFC820] border border-[#00FFC840]'
              : 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)]'
          }`}
          style={{
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <p className="text-[#F0F0F0] text-sm leading-relaxed whitespace-pre-wrap">
            {displayedText}
            {isTyping && <span className="inline-block w-1 h-4 ml-1 bg-[#00FFC8] animate-pulse" />}
          </p>
        </div>
        
        {relatedSlugs && relatedSlugs.length > 0 && !isTyping && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 flex flex-wrap gap-2"
          >
            {relatedSlugs.map(slug => (
              <button
                key={slug}
                onClick={() => onSlugClick?.(slug)}
                className="px-3 py-1 text-xs rounded-full border border-[#00FFC840] text-[#00FFC8] hover:bg-[#00FFC810] transition-colors"
                style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              >
                관련 글: {slug}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
