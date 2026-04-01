'use client';

import { useEffect, useRef, useState } from 'react';

interface MermaidDiagramProps {
  chart: string;
}

export default function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const render = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#00FFC8',
            primaryTextColor: '#E2E8F0',
            primaryBorderColor: '#00FFC840',
            lineColor: '#A78BFA',
            secondaryColor: '#1a1f2e',
            tertiaryColor: '#0d1117',
            background: '#080B10',
            mainBkg: '#0d1117',
            nodeBorder: '#00FFC840',
            clusterBkg: '#1a1f2e',
            titleColor: '#E2E8F0',
            edgeLabelBackground: '#1a1f2e',
          },
        });

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, chart.trim());
        if (ref.current) {
          ref.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Mermaid 렌더링 실패');
      }
    };

    render();
  }, [chart]);

  if (error) {
    return (
      <pre
        style={{
          color: '#F87171',
          background: 'rgba(248, 113, 113, 0.1)',
          border: '1px solid rgba(248, 113, 113, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          fontSize: '12px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {error}
      </pre>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        background: 'rgba(13, 17, 23, 0.8)',
        border: '1px solid #00FFC820',
        borderRadius: '12px',
        padding: '1.5rem',
        margin: '1.5rem 0',
        display: 'flex',
        justifyContent: 'center',
        overflowX: 'auto',
      }}
    />
  );
}
