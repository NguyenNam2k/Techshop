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

const QUICK_TOPICS = [
  { label: '🛠️ Báo sự cố kỹ thuật & Bảo hành', key: 'tech_support' },
  { label: '⚡ Tư vấn cấu hình PC Gaming', key: 'build_pc' },
  { label: '🚚 Giao hàng hỏa tốc 2H', key: 'delivery' },
  { label: '🛡️ Chính sách 1 đổi 1 trong 30 ngày', key: 'warranty' }
];

export default function SupportBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      time: '08:00',
      text: 'Xin chào! Em là chuyên viên hỗ trợ của Techshop. Em có thể hỗ trợ tư vấn cấu hình, kiểm tra tương thích linh kiện hay tiếp nhận bảo hành gì cho anh/chị hôm nay ạ?'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (customText) => {
    const text = (customText || inputVal).trim();
    if (!text) return;
    setInputVal('');

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: 'user', time: timeStr, text }
    ]);

    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const lower = text.toLowerCase();

      if (lower.includes('sự cố') || lower.includes('lỗi') || lower.includes('hỏng') || lower.includes('kỹ thuật') || lower.includes('bảo hành')) {
        const ticketId = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
        reply = `🎫 Em đã tạo phiếu hỗ trợ kỹ thuật #${ticketId} cho bạn:\n\n• Nội dung: "${text}"\n• Trạng thái: Đang chuyển tiếp kỹ sư phần cứng\n• Thời gian phản hồi: Kỹ sư Techshop sẽ gọi điện hỗ trợ trực tiếp trong vòng 15 phút!`;
      } else if (lower.includes('pc') || lower.includes('cấu hình') || lower.includes('build')) {
        reply = 'Techshop có hỗ trợ build PC theo mọi mức ngân sách! Bạn đang nhắm tới mức giá khoảng bao nhiêu (vd: 20tr, 35tr, 50tr+) và nhu cầu chính là chiến game 2K/4K hay Render/Đồ họa để bên mình gửi bảng linh kiện tối ưu nhất nhé!';
      } else if (lower.includes('giao hàng') || lower.includes('hỏa tốc') || lower.includes('vận chuyển')) {
        reply = 'Techshop hỗ trợ giao hỏa tốc 2H cho mọi đơn hàng trong nội thành Hà Nội & TP.HCM từ 8:00 đến 21:00 mỗi ngày. Đơn hàng ngoại tỉnh được chuyển phát nhanh qua GHN/GHTK trong 1-2 ngày!';
      } else {
        reply = 'Dạ chuyên viên kỹ thuật Techshop đã ghi nhận thông tin. Bên mình đang kiểm tra kho dữ liệu và hỗ trợ giải đáp cho bạn ngay đây ạ!';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: reply
        }
      ]);
      setIsTyping(false);
    }, 700);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        text: 'Cuộc trò chuyện đã được làm mới. Em có thể hỗ trợ gì thêm cho anh/chị ạ?'
      }
    ]);
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

            {isTyping && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs w-24">
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Topic Chips */}
          <div className="px-3 py-2 border-t border-slate-800/80 bg-slate-900/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
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
