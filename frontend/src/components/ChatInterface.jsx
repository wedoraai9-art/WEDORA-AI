import React, { useEffect, useRef, useState } from 'react';
import { HERO } from '@/constants/testIds';
import { sendChatStream, apiChatHistory } from '@/lib/aiService';
import {
  ArrowUp,
  RefreshCw,
  Plus,
  RotateCw,
  Share2,
  History,
  Trash2,
  X,
} from 'lucide-react';
import PremiumMarkdown from './PremiumMarkdown';
import { apiCreateShare } from '@/lib/auth';
import { toast } from 'sonner';

const SUGGESTIONS = [
  'Plan My Wedding',
  'Create My Budget',
  'Design My Wedding',
  'Find My Venue',
  'Find Vendors',
];

const HISTORY_KEY = 'wedora_chat_sessions';

const loadSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
};

const upsertSession = (sessionId, title) => {
  if (!sessionId) return;
  const existing = loadSessions();
  const prev = existing.find((s) => s.session_id === sessionId);
  const sessions = existing.filter((s) => s.session_id !== sessionId);
  sessions.unshift({
    session_id: sessionId,
    title: prev?.title || title,
    updated_at: Date.now(),
  });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions.slice(0, 30)));
};

const removeSession = (sessionId) => {
  localStorage.setItem(
    HISTORY_KEY,
    JSON.stringify(loadSessions().filter((s) => s.session_id !== sessionId))
  );
};

const fmtWhen = (ts) => {
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();

  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

export const ChatInterface = ({ initialPromptRef }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState(loadSessions);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const lastUserMsgRef = useRef('');

  useEffect(() => {
    if (initialPromptRef) {
      initialPromptRef.current = (t) => {
        setInput(t);
        setTimeout(() => inputRef.current?.focus(), 60);
      };
    }
  }, [initialPromptRef]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
    setMessages((m) => [
      ...m,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ]);
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
          return [
            ...m.slice(0, -1),
            { ...last, content: last.content + chunk },
          ];
        });
      },
      onDone: (sid) => {
        setSessionId(sid);
        setSending(false);
        upsertSession(sid, text.slice(0, 60));
        setSessions(loadSessions());
      },
      onError: () => {
        setMessages((m) => {
          if (!m.length) return m;
          const last = m[m.length - 1];
          if (last.role !== 'assistant') return m;
          return [
            ...m.slice(0, -1),
            {
              ...last,
              content: gotAnyChunk ? last.content : '',
              error: true,
            },
          ];
        });
        setSending(false);
      },
    });
  };

  const retry = async () => {
    if (!lastUserMsgRef.current || sending) return;

    setMessages((m) => {
      if (!m.length) return m;
      const copy = [...m];

      if (
        copy[copy.length - 1]?.role === 'assistant' &&
        copy[copy.length - 1]?.error
      ) {
        copy.pop();
      }

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

  const openSession = async (sid) => {
    if (sending || loadingHistory) return;
    setLoadingHistory(true);

    try {
      const { messages: msgs } = await apiChatHistory(sid);
      setMessages(
        (msgs || []).map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );
      setSessionId(sid);
      lastUserMsgRef.current =
        [...(msgs || [])].reverse().find((m) => m.role === 'user')?.content ||
        '';
      setShowHistory(false);

      const el = document.querySelector('#hero');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      toast.error('Could not load that conversation.');
    }

    setLoadingHistory(false);
  };

  const deleteSession = (sid) => {
    removeSession(sid);
    setSessions(loadSessions());
    if (sid === sessionId) newChat();
  };

  const shareChat = async () => {
    if (!sessionId) {
      toast.info('Send a message first to create a shareable plan.');
      return;
    }

    let shareId;
    try {
      const res = await apiCreateShare(sessionId);
      shareId = res.share_id;
    } catch {
      toast.error('Could not create the share link. Try again.');
      return;
    }

    const url = `${window.location.origin}/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard — send it to family!', {
        description: url,
      });
    } catch {
      toast.success('Your shareable plan link is ready — copy it below', {
        description: url,
        duration: 15000,
      });
      window.prompt('Copy your wedding plan link:', url);
    }
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
      <style>{`
        .wedora-search-sparkle-slot {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: none;
          width: 1.25rem;
          height: 1.25rem;
        }

        .wedora-search-sparkle {
          position: relative;
          display: block;
          flex: none;
          width: 1.25rem;
          height: 1.25rem;
          transform-origin: center;
          overflow: visible;
          filter:
            drop-shadow(0 0 3px rgba(241, 132, 153, .38))
            drop-shadow(0 0 7px rgba(207, 168, 210, .30))
            drop-shadow(0 0 11px rgba(135, 221, 245, .24));
          animation: wedora-search-sparkle-breathe 2.8s ease-in-out infinite;
        }

        .wedora-search-sparkle-stop-pink {
          animation: wedora-sparkle-pink 3.6s ease-in-out infinite;
        }

        .wedora-search-sparkle-stop-lavender {
          animation: wedora-sparkle-lavender 3.6s ease-in-out infinite;
        }

        .wedora-search-sparkle-stop-blue {
          animation: wedora-sparkle-blue 3.6s ease-in-out infinite;
        }

        @keyframes wedora-search-sparkle-breathe {
          0%, 100% {
            transform: scale(1);
            filter:
              drop-shadow(0 0 3px rgba(241, 132, 153, .34))
              drop-shadow(0 0 7px rgba(207, 168, 210, .26))
              drop-shadow(0 0 11px rgba(135, 221, 245, .20));
          }
          50% {
            transform: scale(1.06);
            filter:
              drop-shadow(0 0 5px rgba(241, 132, 153, .52))
              drop-shadow(0 0 10px rgba(207, 168, 210, .40))
              drop-shadow(0 0 15px rgba(135, 221, 245, .34));
          }
        }

        @keyframes wedora-sparkle-pink {
          0%, 100% { stop-color: #F18499; }
          50% { stop-color: #E99BAF; }
        }

        @keyframes wedora-sparkle-lavender {
          0%, 100% { stop-color: #CFA8D2; }
          50% { stop-color: #BFA8E8; }
        }

        @keyframes wedora-sparkle-blue {
          0%, 100% { stop-color: #87DDF5; }
          50% { stop-color: #A6D0E9; }
        }

        @media (prefers-reduced-motion: reduce) {
          .wedora-search-sparkle,
          .wedora-search-sparkle-stop-pink,
          .wedora-search-sparkle-stop-lavender,
          .wedora-search-sparkle-stop-blue {
            animation: none;
          }
        }
      `}</style>

      {/* Chat toolbar — History always visible; Share/New only during a chat */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="text-[11px] uppercase tracking-widest text-[#988FA6]">
          {hasChat ? 'Conversation' : ''}
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="chat-history-btn"
            onClick={() => {
              setSessions(loadSessions());
              setShowHistory(true);
            }}
            className="chip !text-xs inline-flex items-center gap-1"
            title="Past conversations"
          >
            <History className="w-3.5 h-3.5" /> History
          </button>

          {hasChat && (
            <>
              <button
                data-testid="chat-share-btn"
                onClick={shareChat}
                disabled={sending || !sessionId}
                className="chip !text-xs inline-flex items-center gap-1 disabled:opacity-50"
                title="Create a shareable link for this plan"
              >
                <Share2 className="w-3.5 h-3.5" /> Share plan
              </button>
              <button
                data-testid="chat-new-btn"
                onClick={newChat}
                disabled={sending}
                className="chip !text-xs inline-flex items-center gap-1 disabled:opacity-50"
                title="Start a new conversation"
              >
                <Plus className="w-3.5 h-3.5" /> New chat
              </button>
            </>
          )}
        </div>
      </div>

      {/* History drawer */}
      {showHistory && (
        <div
          className="fixed inset-0 z-[70]"
          data-testid="chat-history-drawer"
        >
          <div
            className="absolute inset-0 bg-[#2D2638]/25 backdrop-blur-sm"
            onClick={() => setShowHistory(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm liquid-glass-strong !rounded-l-[28px] p-5 overflow-y-auto chat-scroll shadow-2xl animate-[slideIn_.3s_ease]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-2xl text-[#2D2638]">
                Your <span className="iridescent-text italic">Plans.</span>
              </h3>
              <button
                data-testid="history-close-btn"
                onClick={() => setShowHistory(false)}
                className="w-9 h-9 rounded-full bg-white/70 border border-white/80 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-[#6B617A] rounded-2xl border border-dashed border-[#C9B8FF]/60 bg-white/50 p-6 text-center">
                No past conversations yet. Ask WEDORA something lovely and it
                will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.session_id}
                    data-testid={`history-item-${s.session_id}`}
                    className={`group w-full text-left rounded-2xl border px-4 py-3 transition cursor-pointer flex items-center gap-2 ${
                      s.session_id === sessionId
                        ? 'bg-gradient-to-r from-[#C9B8FF]/30 to-[#F7B7D8]/30 border-pink-200/80'
                        : 'bg-white/60 border-white/70 hover:border-pink-200/70'
                    }`}
                    onClick={() => openSession(s.session_id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2D2638] truncate">
                        {s.title || 'Wedding conversation'}
                      </p>
                      <p className="text-[11px] text-[#988FA6] mt-0.5">
                        {fmtWhen(s.updated_at)}
                      </p>
                    </div>
                    <button
                      data-testid={`history-delete-${s.session_id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(s.session_id);
                      }}
                      className="w-7 h-7 rounded-full bg-white/70 border border-white/80 flex items-center justify-center opacity-40 group-hover:opacity-100 transition shrink-0"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
            <div
              key={i}
              className={`flex ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              } mb-3`}
            >
              {m.role === 'user' ? (
                <div className="max-w-[85%] rounded-3xl rounded-br-md px-4 py-2.5 text-[#2D2638] bg-gradient-to-r from-[#C9B8FF]/25 via-[#F7B7D8]/25 to-[#A9E8FF]/25 border border-white/80 backdrop-blur-md whitespace-pre-wrap">
                  {m.content}
                </div>
              ) : (
                <div className="max-w-[95%] w-full rounded-3xl rounded-bl-md px-4 py-3 bg-white/85 border border-pink-100/80 shadow-[0_4px_20px_rgba(201,184,255,0.15)]">
                  {m.content ? (
                    <PremiumMarkdown text={m.content} />
                  ) : m.error ? null : (
                    <div
                      className="flex items-center gap-2 text-[#6B617A]"
                      data-testid={HERO.thinkingIndicator}
                    >
                      <div className="thinking-orb" />
                      <span className="italic">WEDORA is thinking…</span>
                    </div>
                  )}

                  {m.error && (
                    <div className="mt-3 rounded-2xl border border-pink-200/70 bg-gradient-to-br from-white/90 to-[#FADBE5]/40 p-3 flex items-center justify-between gap-3">
                      <p className="text-sm text-[#4a4257]">
                        WEDORA is having trouble connecting right now. Please
                        try again.
                      </p>
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

      {/* Search input */}
      <div className="liquid-glass-strong rounded-[28px] pl-5 pr-2 py-2 flex items-center gap-3 gradient-border">
        <span className="wedora-search-sparkle-slot" aria-hidden="true">
          <svg
            data-wedora-search-sparkle
            className="wedora-search-sparkle"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient
                id="wedora-search-sparkle-gradient"
                x1="2"
                y1="2"
                x2="22"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop
                  offset="0"
                  className="wedora-search-sparkle-stop-pink"
                  stopColor="#F18499"
                />
                <stop
                  offset="0.5"
                  className="wedora-search-sparkle-stop-lavender"
                  stopColor="#CFA8D2"
                />
                <stop
                  offset="1"
                  className="wedora-search-sparkle-stop-blue"
                  stopColor="#87DDF5"
                />
              </linearGradient>
            </defs>

            <path
              d="M12 3L13.35 8.65L19 10L13.35 11.35L12 17L10.65 11.35L5 10L10.65 8.65L12 3Z"
              stroke="url(#wedora-search-sparkle-gradient)"
              strokeWidth="1.65"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 15L19.55 17.45L22 18L19.55 18.55L19 21L18.45 18.55L16 18L18.45 17.45L19 15Z"
              stroke="url(#wedora-search-sparkle-gradient)"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
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
          className="glow-btn h-11 w-11 !p-0 flex items-center justify-center disabled:opacity-50 self-center"
          aria-label="Send"
          title="Send (Enter)"
        >
          {sending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
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
