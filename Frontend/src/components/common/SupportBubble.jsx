import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Headphones,
  CheckCircle2,
  Wrench,
  Truck,
  ShieldCheck,
  Cpu,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createSupportTicket,
  fetchSupportTicket,
  sendSupportMessage,
  connectSupportSocket
} from '../../services/supportApi';

const QUICK_TOPICS = [
  { label: '🛠️ Báo sự cố kỹ thuật & Bảo hành', key: 'tech_support' },
  { label: '⚡ Tư vấn cấu hình PC Gaming', key: 'build_pc' },
  { label: '🚚 Giao hàng hỏa tốc 2H', key: 'delivery' },
  { label: '🛡️ Chính sách 1 đổi 1 trong 30 ngày', key: 'warranty' }
];

export default function SupportBubble() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  const customerName = user?.full_name || user?.name || 'Khách hàng';

  // Map tin nhắn từ backend -> bong bóng chat của khách
  const toBubbleMessage = (msg) => ({
    id: msg.id,
    sender: msg.sender === 'customer' ? 'user' : 'bot',
    time: msg.time,
    text:
      msg.sender === 'customer'
        ? msg.text
        : msg.sender_name
          ? `👨‍💼 [${msg.sender_name}]: ${msg.text}`
          : msg.text
  });

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Khởi tạo ticket hỗ trợ cho khách hàng (lưu mã ticket vào localStorage của trình duyệt)
  useEffect(() => {
    let cancelled = false;
    const storageKey = 'techshop_support_ticket_code';

    const boot = async () => {
      try {
        const savedCode = localStorage.getItem(storageKey);
        if (savedCode) {
          const ticket = await fetchSupportTicket(savedCode);
          if (cancelled) return;
          setTicketCode(ticket.ticket_id);
          setMessages((ticket.messages || []).map(toBubbleMessage));
          return;
        }
      } catch (error) {
        console.warn('SupportBubble: ticket đã lưu không còn tồn tại, tạo ticket mới.', error);
        localStorage.removeItem(storageKey);
      }

      try {
        const ticket = await createSupportTicket({
          customerId: user?.id || null,
          customerName,
          customerPhone: user?.phone || '',
          customerEmail: user?.email || '',
          subject: 'Tư vấn từ khung chat hỗ trợ'
        });
        if (cancelled) return;
        localStorage.setItem(storageKey, ticket.ticket_id);
        setTicketCode(ticket.ticket_id);
        setMessages((ticket.messages || []).map(toBubbleMessage));
      } catch (error) {
        console.warn('SupportBubble: không tạo được ticket hỗ trợ.', error);
      }
    };

    boot();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // WebSocket realtime: nhận tin nhắn của Staff ngay khi họ gửi
  useEffect(() => {
    if (!ticketCode) return undefined;

    const socket = connectSupportSocket({
      ticketId: ticketCode,
      role: 'customer',
      onEvent: (event) => {
        if (event.type !== 'message' || !event.message) return;
        setMessages((prev) =>
          prev.some((m) => m.id === event.message.id) ? prev : [...prev, toBubbleMessage(event.message)]
        );
      }
    });

    return () => {
      if (socket) socket.close();
    };
  }, [ticketCode]);

  const handleSend = async (customText) => {
    const text = (customText || inputVal).trim();
    if (!text || !ticketCode) return;
    setInputVal('');

    try {
      const { message } = await sendSupportMessage(ticketCode, {
        senderType: 'customer',
        senderName: customerName,
        text
      });
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, toBubbleMessage(message)]
      );
    } catch (error) {
      console.warn('SupportBubble: gửi tin nhắn thất bại.', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: 'Không gửi được tin nhắn tới tổng đài. Anh/chị vui lòng thử lại sau ít phút ạ.'
        }
      ]);
    }
  };

  const handleResetChat = async () => {
    if (!ticketCode) return;
    try {
      const ticket = await fetchSupportTicket(ticketCode);
      setMessages((ticket.messages || []).map(toBubbleMessage));
    } catch (error) {
      console.warn('SupportBubble: không tải lại được hội thoại.', error);
    }
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-40 select-none safe-bottom">
      {/* Floating Chat Window (When Open) */}
      {isOpen && (
        <div className="dark dark-locked w-[calc(100vw-1.5rem)] sm:w-[390px] h-[min(520px,calc(100vh-5rem))] max-h-[85vh] bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden motion-pop">
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow">
                  <Headphones className="w-5 h-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm tracking-tight">Techshop Support 24/7</h3>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-emerald-400/20 text-emerald-300 border border-emerald-400/40">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-sky-100/90 leading-tight">
                  Tư vấn kỹ thuật &amp; CSKH trực tuyến
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Làm mới đoạn chat"
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition cursor-pointer"
                title="Đóng cửa sổ hỗ trợ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/50 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-700/60 [&::-webkit-scrollbar-track]:bg-transparent">
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-sky-600 text-white rounded-br-none shadow-md shadow-sky-600/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                    {m.time}
                  </span>
                </div>
              );
            })}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Topic Chips */}
          <div
            onWheel={(e) => {
              const el = e.currentTarget;
              if (e.deltaY !== 0 && el.scrollWidth > el.clientWidth) {
                el.scrollLeft += e.deltaY;
              }
            }}
            className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"
          >
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.key}
                type="button"
                onClick={() => handleSend(topic.label)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/15 text-slate-300 hover:text-sky-300 text-[11px] font-medium whitespace-nowrap border border-slate-700/60 hover:border-sky-500/30 transition cursor-pointer"
              >
                {topic.label}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-slate-800 bg-slate-900 flex gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Nhập câu hỏi hoặc sự cố cần hỗ trợ..."
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition cursor-pointer shrink-0 shadow-md shadow-sky-600/20"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Trigger Bubble Button (Only shown when window is closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-2xl shadow-sky-600/40 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-sky-400/30"
          title="Mở Chat Tư Vấn & Hỗ Trợ 24/7"
        >
          <div className="relative">
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline">
            Hỗ Trợ &amp; Chat 24/7
          </span>
        </button>
      )}
    </div>
  );
}
