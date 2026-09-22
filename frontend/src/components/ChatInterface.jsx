import React, { useEffect, useRef, useState } from 'react';
import { HERO } from '@/constants/testIds';
import { sendChatStream } from '@/lib/aiService';
import { ArrowUp, Sparkles, RefreshCw, Plus, RotateCw } from 'lucide-react';
import PremiumMarkdown from './PremiumMarkdown';

const SUGGESTIONS = [
  'Plan My Wedding',
  'Create My Budget',
  'Design My Wedding',
  'Find My Venue',
  'Find Vendors',
];

export const ChatInterface = ({ initialPromptRef }) => {
  const [messages, setMessages] = useState([]); // {role, content, error?}
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const lastUserMsgRef = useRef('');

  useEffect(() => {
    if (initialPromptRef) initialPromptRef.current = (t) => {
      setInput(t);
      setTimeout(() => inputRef.current?.focus(), 60);
    };
  }, [initialPromptRef]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  // Auto-grow textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }, [input]);

  const send = async (textArg) => {
    const text = (textArg ?? input).trim();
    if (!text || sending) return;
    lastUserMsgRef.current = text;
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setInput('');
    setSending(true);

    let gotAnyChunk = false;

    await sendChatStream({
      message: text,
      sessionId,
      onDelta: (chunk) => {
        gotAnyChunk = true;
        setMessages((m) => {
          if (!m.length) return m;
          const last = m[m.length - 1];
          if (last.role !== 'assistant') return m;
          return [...m.slice(0, -1), { ...last, content: last.content + chunk }];
        });
      },
      onDone: (sid) => { setSessionId(sid); setSending(false); },
      onError: () => {
        setMessages((m) => {
          if (!m.length) return m;
          const last = m[m.length - 1];
          if (last.role !== 'assistant') return m;
          return [...m.slice(0, -1), {
            ...last,
            content: gotAnyChunk ? last.content : '',
            error: true,
          }];
        });
        setSending(false);
      },
    });
  };

  const retry = async () => {
    if (!lastUserMsgRef.current || sending) return;
    // Remove trailing error assistant and re-send using last user message
    setMessages((m) => {
      if (!m.length) return m;
      const copy = [...m];
      // pop the errored assistant
      if (copy[copy.length - 1]?.role === 'assistant' && copy[copy.length - 1]?.error) copy.pop();
      // pop the last user (we're re-sending it)
      if (copy[copy.length - 1]?.role === 'user') copy.pop();
      return copy;
    });
    setTimeout(() => send(lastUserMsgRef.current), 30);
  };

  const newChat = () => {
    if (sending) return;
    setMessages([]);
    setSessionId(null);
    setInput('');
    lastUserMsgRef.current = '';
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const hasChat = messages.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Chat toolbar */}
      {hasChat && (
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-[11px] uppercase tracking-widest text-[#988FA6]">Conversation</div>
          <div className="flex items-center gap-2">
            <button
              data-testid="chat-new-btn"
              onClick={newChat}
              disabled={sending}
              className="chip !text-xs inline-flex items-center gap-1 disabled:opacity-50"
              title="Start a new conversation"
            >
              <Plus className="w-3.5 h-3.5" /> New chat
            </button>
          </div>
        </div>
      )}

      {/* Chat messages */}
      {hasChat && (
        <div
          ref={scrollRef}
          data-testid={HERO.messagesList}
          className="chat-scroll pearl-card mb-4 p-4 md:p-6 max-h-[520px] overflow-y-auto"
        >
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
              {m.role === 'user' ? (
                <div className="max-w-[85%] rounded-3xl rounded-br-md px-4 py-2.5 text-[#2D2638] bg-gradient-to-r from-[#C9B8FF]/25 via-[#F7B7D8]/25 to-[#A9E8FF]/25 border border-white/80 backdrop-blur-md whitespace-pre-wrap">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[95%] w-full rounded-3xl rounded-bl-md px-4 py-3 bg-white/85 border border-pink-100/80 shadow-[0_4px_20px_rgba(201,184,255,0.15)]">
                  {m.content ? (
                    <PremiumMarkdown text={m.content} />
                  ) : m.error ? null : (
                    <div className="flex items-center gap-2 text-[#6B617A]" data-testid={HERO.thinkingIndicator}>
                      <div className="thinking-orb" />
                      <span className="italic">WEDORA is thinking…</span>
                    </div>
                  )}

                  {/* Error inline (kept after any partial content) */}
                  {m.error && (
                    <div className="mt-3 rounded-2xl border border-pink-200/70 bg-gradient-to-br from-white/90 to-[#FADBE5]/40 p-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-[#4a4257]">WEDORA is having trouble connecting right now. Please try again.</p>
                      <button
                        data-testid="chat-retry-btn"
                        onClick={retry}
                        className="chip !text-xs inline-flex items-center gap-1"
                      >
                        <RotateCw className="w-3.5 h-3.5" /> Try again
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apple liquid glass input (textarea) */}
      <div className="liquid-glass-strong rounded-[28px] pl-5 pr-2 py-2 flex items-end gap-3 gradient-border">
        <Sparkles className="w-5 h-5 text-[#C9B8FF] shrink-0 mt-3" />
        <textarea
          ref={inputRef}
          data-testid={HERO.chatInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Tell WEDORA about your wedding…  (Shift + Enter for a new line)"
          className="flex-1 bg-transparent outline-none text-[#2D2638] placeholder-[#988FA6] py-2 text-base resize-none leading-relaxed max-h-[180px]"
        />
        <button
          data-testid={HERO.sendBtn}
          disabled={sending || !input.trim()}
          onClick={() => send()}
          className="glow-btn h-11 w-11 !p-0 flex items-center justify-center disabled:opacity-50 self-end mb-1"
          aria-label="Send"
          title="Send (Enter)"
        >
          {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-5 h-5" />}
        </button>
      </div>

      {/* Suggested prompts */}
      {!hasChat && (
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
      )}
    </div>
  );
};

export default ChatInterface;
