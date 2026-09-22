import React, { useEffect, useRef, useState } from 'react';
import { HERO } from '@/constants/testIds';
import { sendChatStream } from '@/lib/aiService';
import { ArrowUp, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'Plan My Wedding',
  'Create My Budget',
  'Design My Wedding',
  'Find My Venue',
  'Find Vendors',
];

// Simple markdown-ish renderer (headings, bold, lists, paragraphs)
const renderMd = (text) => {
  if (!text) return null;
  const lines = text.split('\n');
  const nodes = [];
  let listBuf = [];
  const flushList = () => {
    if (listBuf.length) {
      nodes.push(<ul key={`ul-${nodes.length}`}>{listBuf.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inline(li) }} />)}</ul>);
      listBuf = [];
    }
  };
  const inline = (s) => s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (/^###\s/.test(line)) { flushList(); nodes.push(<h3 key={i} dangerouslySetInnerHTML={{ __html: inline(line.replace(/^###\s/, '')) }} />); }
    else if (/^##\s/.test(line)) { flushList(); nodes.push(<h2 key={i} dangerouslySetInnerHTML={{ __html: inline(line.replace(/^##\s/, '')) }} />); }
    else if (/^#\s/.test(line)) { flushList(); nodes.push(<h1 key={i} dangerouslySetInnerHTML={{ __html: inline(line.replace(/^#\s/, '')) }} />); }
    else if (/^[-*•]\s+/.test(line)) { listBuf.push(line.replace(/^[-*•]\s+/, '')); }
    else if (line === '') { flushList(); }
    else { flushList(); nodes.push(<p key={i} dangerouslySetInnerHTML={{ __html: inline(line) }} />); }
  });
  flushList();
  return nodes;
};

export const ChatInterface = ({ initialPromptRef }) => {
  const [messages, setMessages] = useState([]); // {role, content}
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (initialPromptRef) initialPromptRef.current = (t) => {
      setInput(t);
      setTimeout(() => inputRef.current?.focus(), 60);
    };
  }, [initialPromptRef]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async (textArg) => {
    const text = (textArg ?? input).trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);

    await sendChatStream({
      message: text,
      sessionId,
      onDelta: (chunk) => {
        setMessages((m) => {
          if (!m.length) return m;
          const last = m[m.length - 1];
          if (last.role !== 'assistant') return m;
          const updatedLast = { ...last, content: last.content + chunk };
          return [...m.slice(0, -1), updatedLast];
        });
      },
      onDone: (sid) => { setSessionId(sid); setSending(false); },
      onError: (err) => {
        setMessages((m) => {
          if (!m.length) return m;
          const last = m[m.length - 1];
          if (last.role !== 'assistant') return m;
          return [...m.slice(0, -1), { ...last, content: `_WEDORA is quietly resting. (${err})_` }];
        });
        setSending(false);
      },
    });
  };

  const hasChat = messages.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Chat messages */}
      {hasChat && (
        <div
          ref={scrollRef}
          data-testid={HERO.messagesList}
          className="chat-scroll pearl-card mb-4 p-4 md:p-6 max-h-[420px] overflow-y-auto"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
              {m.role === 'user' ? (
                <div className="max-w-[85%] rounded-3xl rounded-br-md px-4 py-2.5 text-[#2D2638] bg-gradient-to-r from-[#C9B8FF]/25 via-[#F7B7D8]/25 to-[#A9E8FF]/25 border border-white/80 backdrop-blur-md">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[92%] rounded-3xl rounded-bl-md px-4 py-3 bg-white/85 border border-pink-100/80 shadow-[0_4px_20px_rgba(201,184,255,0.15)] ai-prose">
                  {m.content ? renderMd(m.content) : (
                    <div className="flex items-center gap-2 text-[#6B617A]" data-testid={HERO.thinkingIndicator}>
                      <div className="thinking-orb" />
                      <span className="italic">WEDORA is thinking…</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apple liquid glass input */}
      <div className="liquid-glass-strong rounded-full pl-5 pr-2 py-2 flex items-center gap-3 gradient-border">
        <Sparkles className="w-5 h-5 text-[#C9B8FF] shrink-0" />
        <input
          ref={inputRef}
          data-testid={HERO.chatInput}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Tell WEDORA about your wedding..."
          className="flex-1 bg-transparent outline-none text-[#2D2638] placeholder-[#988FA6] py-2 text-base"
        />
        <button
          data-testid={HERO.sendBtn}
          disabled={sending || !input.trim()}
          onClick={() => send()}
          className="glow-btn h-11 w-11 !p-0 flex items-center justify-center disabled:opacity-50"
          aria-label="Send"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>

      {/* Suggested prompts */}
      <div className="mt-5 flex flex-wrap gap-2 justify-center">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            data-testid={HERO.suggestedPrompt(s)}
            onClick={() => send(s)}
            disabled={sending}
            className="chip disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ChatInterface;
