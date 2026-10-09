import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { EventItem } from '../types';
import { askCampusAi } from '../services/aiService';
import { EventCard } from './EventCard';

interface AskAiViewProps {
  events: EventItem[];
  bookmarkedIds: string[];
  onToggleBookmark: (id: string) => void;
  onOpenDetail: (event: EventItem) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  matchingEvents?: EventItem[];
  timestamp: string;
}

const EXAMPLE_QUESTIONS = [
  'Any free coding events this weekend?',
  'Which events offer certificates or cash prizes?',
  'What cultural or sports competitions are happening soon?',
];

export const AskAiView: React.FC<AskAiViewProps> = ({
  events,
  bookmarkedIds,
  onToggleBookmark,
  onOpenDetail,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hello! I am your SNPSU EVENTRA assistant. Ask me anything about upcoming hackathons, fests, workshops, venue changes, certificates, or free events on campus. I answer strictly using verified Sapthagiri NPS University club records.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const handleSend = async (queryToSend?: string) => {
    const q = (queryToSend || inputQuery).trim();
    if (!q || loading) return;

    setErrorNotice(null);
    setInputQuery('');

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const result = await askCampusAi(q, events);

      // Find matching events to show cards underneath answer
      const matching = (result.matchingEventIds || [])
        .map(id => events.find(e => e.id === id))
        .filter((e): e is EventItem => Boolean(e) && !e?.hidden);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: result.answer,
        matchingEvents: matching.length > 0 ? matching : undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error('Ask AI error:', err);
      setErrorNotice(
        err.message || 'Could not connect to Gemini AI. You can still browse events in the main feed.'
      );
      const errorReply: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I couldn't find a matching event.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorReply]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-emerald-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Grounded Campus AI • Gemini 3.8</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Ask AI: Campus Events Concierge
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Answers are grounded <em>only</em> on verified Sapthagiri NPS University club events. No hallucinated dates or fake prizes.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-emerald-200">
          Private: No student login needed
        </div>
      </div>

      {/* Suggested Question Chips */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Suggested Questions:
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_QUESTIONS.map(chip => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              disabled={loading}
              className="text-xs bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 px-3.5 py-2 rounded-xl text-slate-700 font-medium transition shadow-2xs active:scale-95 text-left disabled:opacity-50"
            >
              "{chip}"
            </button>
          ))}
        </div>
      </div>

      {errorNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Chat History Box */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[460px]">
        <div className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto max-h-[600px]">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.sender === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${
                  msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                    msg.sender === 'user'
                      ? 'bg-slate-800'
                      : 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-xs'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div>
                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-emerald-600 text-white rounded-tr-none'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              {/* Matching Event Cards under AI Answer */}
              {msg.matchingEvents && msg.matchingEvents.length > 0 && (
                <div className="mt-4 w-full pl-0 sm:pl-11 space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Matching Event Cards:</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {msg.matchingEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isBookmarked={bookmarkedIds.includes(event.id)}
                        onToggleBookmark={onToggleBookmark}
                        onOpenDetail={onOpenDetail}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-500 italic pl-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center animate-spin">
                <Sparkles className="w-4 h-4" />
              </div>
              <span>Searching verified SNPSU club events with Gemini...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder="Ask about events (e.g. 'Are there any free hackathons next week?')..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-2xs"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
            >
              <span>Ask</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-2 text-center">
            Grounded directly on current campus events • Never shares personal student data
          </p>
        </div>
      </div>
    </div>
  );
};
