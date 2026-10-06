import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  ArrowRight,
  Zap,
  MapPin,
  Clock,
  Car,
  CornerDownLeft,
} from 'lucide-react';
import { api } from '../../services/api';
import { AIChatResponse, AIRecommendation } from '../../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: AIChatResponse;
}

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSlotToBook: (params: {
    slotId: string;
    locationId: string;
    startTime: string;
    endTime: string;
    vehicleType: string;
  }) => void;
  onNavigateToBookings?: () => void;
}

const SAMPLE_PROMPTS = [
  'Park my EV at Phoenix Marketcity tomorrow at 7 PM for 2 hours',
  'Need SUV spot at Jio World Centre BKC tomorrow at 6 PM for 3 hrs',
  'Show my bookings and slot details',
  'Can I extend my parking for another 2 hours?',
];

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSlotToBook,
  onNavigateToBookings,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hello! I'm your ParkEase AI Assistant. You can describe your parking requirements naturally (e.g. *\"I need parking at Phoenix Marketcity tomorrow at 7 PM for my SUV\"*), or ask about your active bookings.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.ai.chat({
        message: textToSend,
        context: {
          previousMessages: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
      });

      const assistantMsg: Message = {
        role: 'assistant',
        content: response.message,
        data: response,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            err.message === 'Unauthorized. Bearer token is missing or malformed.'
              ? 'Please log in first to use the AI parking assistant and make reservations.'
              : `Sorry, I encountered an issue: ${err.message}. Please try again!`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReserveRecommendation = (
    rec: AIRecommendation,
    search?: AIChatResponse['search']
  ) => {
    const startTime = search?.startTime
      ? new Date(`${search.date || new Date().toISOString().slice(0, 10)}T${search.startTime}:00.000Z`).toISOString()
      : new Date().toISOString();
    const endTime = search?.endTime
      ? new Date(`${search.date || new Date().toISOString().slice(0, 10)}T${search.endTime}:00.000Z`).toISOString()
      : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    onClose();
    onSelectSlotToBook({
      slotId: rec.slotId,
      locationId: rec.locationId,
      startTime,
      endTime,
      vehicleType: rec.vehicleType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl border-l border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-600 to-indigo-700 text-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white backdrop-blur-sm shadow-xs">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                  ParkEase AI Assistant
                </h3>
                <span className="text-[10px] text-white/80 block">
                  Gemini Flash + Deterministic Parser
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts bar */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
            <span className="text-slate-400 font-bold shrink-0">Try:</span>
            {SAMPLE_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-brand-400 hover:text-brand-700 text-slate-600 transition-colors shadow-2xs"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2.5`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-brand-600 text-white rounded-br-none shadow-xs font-medium'
                        : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                  </div>

                  {/* Render Recommended Slot Cards */}
                  {m.data?.recommendations && m.data.recommendations.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Recommended Available Slots
                      </span>
                      {m.data.recommendations.map((rec) => (
                        <div
                          key={rec.slotId}
                          className="p-3 bg-white rounded-2xl border border-brand-200 shadow-xs hover:border-brand-400 transition-all flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-sm text-slate-900">
                                Slot {rec.slotNumber}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-100 text-slate-600">
                                Floor {rec.floor}
                              </span>
                              {rec.isEVCharging && (
                                <span className="p-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                  <Zap className="w-3 h-3 fill-current" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 block mt-0.5">
                              {rec.locationName} · {rec.vehicleType}
                            </span>
                            <span className="text-xs font-black text-brand-600 mt-1 block">
                              {rec.formattedTotal} ({rec.durationHours} hrs)
                            </span>
                          </div>

                          <button
                            onClick={() => handleReserveRecommendation(rec, m.data?.search)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition-all shrink-0 hover:scale-105"
                          >
                            <span>Reserve</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Booking or Extension Quick Navigation Button */}
                  {m.data?.intent === 'CHECK_BOOKING' && onNavigateToBookings && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToBookings();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 bg-brand-50 px-3 py-1.5 rounded-xl border border-brand-200"
                    >
                      View in My Bookings →
                    </button>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl w-fit">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span>ParkEase AI is checking slot availability...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-3.5 border-t border-slate-200 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask e.g. 'SUV parking at Jio World tomorrow at 6 PM'..."
                className="w-full pl-3.5 pr-12 py-2.5 rounded-2xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-xs sm:text-sm outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="absolute right-1.5 p-2 rounded-xl text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-center text-slate-400 mt-2">
              Conversational slot discovery with real-time collision prevention.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
