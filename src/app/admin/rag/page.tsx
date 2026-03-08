'use client';

import { useState } from 'react';

export default function RAGSettingsPage() {
  const [matchThreshold, setMatchThreshold] = useState(0.7);
  const [matchCount, setMatchCount] = useState(3);
  const [maxTokens, setMaxTokens] = useState(300);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerateAll = async () => {
    if (
      !confirm(
        'This will regenerate embeddings for all published posts. This may take a while and will consume OpenAI API credits. Continue?'
      )
    ) {
      return;
    }

    setRegenerating(true);
    try {
      // TODO: Implement bulk regeneration endpoint
      alert('Bulk regeneration will be implemented in the future');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div>
      <h1
        className="text-3xl font-bold mb-8"
        style={{ color: 'var(--text-primary)' }}
      >
        RAG Settings
      </h1>

      <div className="card p-6 space-y-6">
        <div>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Search Parameters
          </h2>

          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Match Threshold: {matchThreshold.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.5"
                max="0.9"
                step="0.05"
                value={matchThreshold}
                onChange={(e) => setMatchThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Higher values return more relevant results
              </p>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Number of Results: {matchCount}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={matchCount}
                onChange={(e) => setMatchCount(parseInt(e.target.value))}
                className="w-full"
              />
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Number of posts to use as context
              </p>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                Max Response Tokens: {maxTokens}
              </label>
              <input
                type="range"
                min="100"
                max="500"
                step="50"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full"
              />
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Maximum length of chatbot responses
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: 'var(--border-color)' }}>
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Embeddings Management
          </h2>

          <p
            className="text-sm mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Embeddings are automatically generated when you create or update a
            published post. You can manually regenerate all embeddings if
            needed.
          </p>

          <button
            onClick={handleRegenerateAll}
            disabled={regenerating}
            className="px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: regenerating
                ? 'var(--bg-tertiary)'
                : 'var(--color-primary)',
              color: 'white',
              opacity: regenerating ? 0.6 : 1,
              cursor: regenerating ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!regenerating) {
                e.currentTarget.style.background = 'var(--color-primary-light)';
              }
            }}
            onMouseLeave={(e) => {
              if (!regenerating) {
                e.currentTarget.style.background = 'var(--color-primary)';
              }
            }}
          >
            {regenerating ? 'Regenerating...' : '🔄 Regenerate All Embeddings'}
          </button>
        </div>

        <div
          className="border-t pt-6"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Model Information
          </h2>

          <div
            className="space-y-2 text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            <p>
              <strong>Embedding Model:</strong> text-embedding-3-small
            </p>
            <p>
              <strong>Chat Model:</strong> gpt-4o-mini
            </p>
            <p>
              <strong>Cost per embedding:</strong> ~$0.00004 per post
            </p>
            <p>
              <strong>Cost per chat:</strong> ~$0.0007 per conversation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
