import React from 'react';
import { Info } from 'lucide-react';

/*
 Premium markdown-lite renderer for WEDORA AI.
 Supports:
  - # / ## / ### headings
  - **bold** and *italic* and `inline code`
  - > callout (pearlescent card)
  - - / * bullet lists
  - 1. numbered lists
  - --- horizontal rule
  - GFM tables (responsive: table on desktop, cards on mobile)
  - ```palette ... ``` custom code fence renders a swatch strip
*/

const inline = (s) => {
  if (!s) return '';
  let out = s;
  // Escape HTML (basic)
  out = out.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic (skip if already inside a tag)
  out = out.replace(/(^|[\s(])\*(?!\s)([^*]+?)\*(?=[\s.,!?)]|$)/g, '$1<em>$2</em>');
  // Links [text](url)
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="underline decoration-pink-300 hover:decoration-pink-500">$1</a>');
  return out;
};

const parseTable = (lines, start) => {
  // Return { rows, end } or null
  const header = lines[start];
  const sep = lines[start + 1];
  if (!header || !sep) return null;
  if (!/^\s*\|.+\|\s*$/.test(header)) return null;
  if (!/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(sep)) return null;

  const splitRow = (row) =>
    row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  const headers = splitRow(header);
  const rows = [];
  let i = start + 2;
  while (i < lines.length && /^\s*\|.+\|\s*$/.test(lines[i])) {
    rows.push(splitRow(lines[i]));
    i++;
  }
  return { headers, rows, end: i };
};

const Palette = ({ hexes }) => (
  <div className="my-3 flex items-center gap-2 flex-wrap">
    {hexes.map((h, i) => (
      <div key={i} className="flex flex-col items-center">
        <div
          className="w-10 h-10 rounded-2xl border border-white/80 shadow-inner"
          style={{ background: h }}
          title={h}
        />
        <span className="mt-1 text-[10px] uppercase tracking-widest text-[#988FA6]">{h}</span>
      </div>
    ))}
  </div>
);

const Table = ({ headers, rows }) => (
  <div className="my-3">
    {/* Desktop / md+ */}
    <div className="hidden md:block overflow-hidden rounded-2xl border border-white/70 bg-white/60 backdrop-blur">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-[#C9B8FF]/25 via-[#F7B7D8]/25 to-[#A9E8FF]/25">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-2.5 font-heading font-semibold text-[#2D2638]">
                <span dangerouslySetInnerHTML={{ __html: inline(h) }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-white/70">
              {r.map((c, ci) => (
                <td key={ci} className="px-4 py-2.5 align-top text-[#4a4257]">
                  <span dangerouslySetInnerHTML={{ __html: inline(c) }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    {/* Mobile — stacked cards */}
    <div className="md:hidden flex flex-col gap-2">
      {rows.map((r, ri) => (
        <div key={ri} className="rounded-2xl border border-white/70 bg-white/70 backdrop-blur p-3">
          {r.map((c, ci) => (
            <div key={ci} className="flex justify-between gap-3 py-1 border-b border-white/60 last:border-0">
              <span className="text-[10px] uppercase tracking-widest text-[#988FA6] mt-0.5 shrink-0">
                {headers[ci] || ''}
              </span>
              <span className="text-sm text-[#2D2638] text-right" dangerouslySetInnerHTML={{ __html: inline(c) }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const Callout = ({ children }) => (
  <div className="my-3 flex gap-3 rounded-2xl border border-white/70 bg-gradient-to-br from-white/85 to-[#FFF8EF]/60 backdrop-blur p-3.5 shadow-[0_4px_20px_rgba(201,184,255,0.15)]">
    <Info className="w-4 h-4 text-[#C9B8FF] mt-0.5 shrink-0" />
    <div className="text-sm text-[#4a4257] leading-relaxed">{children}</div>
  </div>
);

export const PremiumMarkdown = ({ text }) => {
  if (!text) return null;
  const lines = text.replace(/\r/g, '').split('\n');
  const nodes = [];
  let i = 0;
  let ulBuf = null;
  let olBuf = null;
  let calloutBuf = null;

  const flushList = () => {
    if (ulBuf) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} className="ai-ul">
          {ulBuf.map((li, k) => (
            <li key={k} dangerouslySetInnerHTML={{ __html: inline(li) }} />
          ))}
        </ul>
      );
      ulBuf = null;
    }
    if (olBuf) {
      nodes.push(
        <ol key={`ol-${nodes.length}`} className="ai-ol">
          {olBuf.map((li, k) => (
            <li key={k} dangerouslySetInnerHTML={{ __html: inline(li) }} />
          ))}
        </ol>
      );
      olBuf = null;
    }
  };

  const flushCallout = () => {
    if (calloutBuf) {
      const html = calloutBuf.map((l) => inline(l)).join('<br/>');
      nodes.push(
        <Callout key={`cb-${nodes.length}`}>
          <span dangerouslySetInnerHTML={{ __html: html }} />
        </Callout>
      );
      calloutBuf = null;
    }
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw ?? '';
    const trimmed = line.trim();

    // Palette code fence
    if (/^```palette\s*$/i.test(trimmed)) {
      flushList(); flushCallout();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      const hexes = (buf.join(' ').match(/#[0-9a-fA-F]{3,8}/g) || []).slice(0, 8);
      if (hexes.length) nodes.push(<Palette key={`pal-${nodes.length}`} hexes={hexes} />);
      i++; // skip closing ```
      continue;
    }

    // Generic code fence (render as pre)
    if (/^```/.test(trimmed)) {
      flushList(); flushCallout();
      const buf = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) { buf.push(lines[i]); i++; }
      nodes.push(
        <pre key={`pre-${nodes.length}`} className="my-3 rounded-2xl border border-white/70 bg-white/70 backdrop-blur p-3 overflow-x-auto text-[13px] text-[#2D2638]">
          <code>{buf.join('\n')}</code>
        </pre>
      );
      i++;
      continue;
    }

    // Table
    if (/^\s*\|.+\|\s*$/.test(trimmed) && lines[i + 1] && /^\s*\|?\s*:?-{2,}:?/.test(lines[i + 1])) {
      flushList(); flushCallout();
      const parsed = parseTable(lines, i);
      if (parsed) {
        nodes.push(<Table key={`t-${nodes.length}`} headers={parsed.headers} rows={parsed.rows} />);
        i = parsed.end;
        continue;
      }
    }

    // Callout
    if (/^>\s?/.test(line)) {
      flushList();
      calloutBuf = calloutBuf || [];
      calloutBuf.push(line.replace(/^>\s?/, ''));
      i++;
      continue;
    } else if (calloutBuf) {
      flushCallout();
    }

    // Headings
    if (/^###\s+/.test(trimmed)) {
      flushList(); flushCallout();
      nodes.push(<h3 key={i} dangerouslySetInnerHTML={{ __html: inline(trimmed.replace(/^###\s+/, '')) }} />);
      i++; continue;
    }
    if (/^##\s+/.test(trimmed)) {
      flushList(); flushCallout();
      nodes.push(<h2 key={i} dangerouslySetInnerHTML={{ __html: inline(trimmed.replace(/^##\s+/, '')) }} />);
      i++; continue;
    }
    if (/^#\s+/.test(trimmed)) {
      flushList(); flushCallout();
      nodes.push(<h1 key={i} dangerouslySetInnerHTML={{ __html: inline(trimmed.replace(/^#\s+/, '')) }} />);
      i++; continue;
    }

    // HR
    if (/^-{3,}$/.test(trimmed)) {
      flushList(); flushCallout();
      nodes.push(<div key={i} className="my-4 h-[1px] bg-gradient-to-r from-transparent via-[#C9B8FF]/60 to-transparent" />);
      i++; continue;
    }

    // Ordered list
    const ol = /^(\d+)\.\s+(.+)$/.exec(trimmed);
    if (ol) {
      if (ulBuf) flushList();
      olBuf = olBuf || [];
      olBuf.push(ol[2]);
      i++; continue;
    }
    // Bullet list
    const ul = /^[-*•]\s+(.+)$/.exec(trimmed);
    if (ul) {
      if (olBuf) flushList();
      ulBuf = ulBuf || [];
      ulBuf.push(ul[1]);
      i++; continue;
    }

    // Blank
    if (trimmed === '') {
      flushList();
      i++; continue;
    }

    // Paragraph
    flushList();
    nodes.push(<p key={i} dangerouslySetInnerHTML={{ __html: inline(trimmed) }} />);
    i++;
  }

  flushList(); flushCallout();
  return <div className="ai-prose">{nodes}</div>;
};

export default PremiumMarkdown;
