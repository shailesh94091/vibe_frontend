import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../api';
import { useAuth } from '../AuthContext';

interface Message {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  created_at: string;
}

interface ChatBoxProps {
  recipientId: string;
  recipientName: string;
  recipientPhoto?: string;
  onBack?: () => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ recipientId, recipientName, recipientPhoto, onBack }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  
  const socketRef = useRef<Socket | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Request browser notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history & initialize socket connection
  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        const res = await api.get(`/chat/history/${recipientId}`);
        if (active) {
          setMessages(res.data);
        }
      } catch (err) {
        console.error('Failed to load chat logs:', err);
      }
    };

    loadHistory();

    // Configure socket.io
    const token = localStorage.getItem('echo_token') || '';
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const socket = io(backendUrl, {
      withCredentials: true,
      auth: { token }
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (active) setConnectionStatus('connected');
      socket.emit('join_room', { recipientId });
    });

    socket.on('connect_error', () => {
      if (active) setConnectionStatus('error');
    });

    socket.on('receive_message', (msg: Message) => {
      if (!active) return;
      
      setMessages(prev => {
        // Prevent duplicate appending
        if (prev.some(m => m.message_id === msg.message_id)) return prev;
        return [...prev, msg];
      });

      // Browser Notification if tab is hidden
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        if (msg.sender_id === recipientId) {
          new Notification(`New message from ${recipientName}`, {
            body: msg.message_text,
            icon: recipientPhoto
          });
        }
      }
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [recipientId, recipientName, recipientPhoto]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      recipientId,
      messageText: inputMsg.trim()
    });
    setInputMsg('');
  };

  return (
    <div className="flex flex-col bg-white/40 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-xl overflow-hidden h-[680px]">
      
      {/* Header bar */}
      <div className="bg-white/40 border-b border-white/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="lg:hidden material-symbols-outlined text-primary text-2xl cursor-pointer hover:opacity-75 mr-1"
            >
              arrow_back
            </button>
          )}
          <img 
            className="w-10 h-10 rounded-full object-cover"
            src={recipientPhoto || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYiBQ-rjkiGp5aRSCu54YwYw7DXMnn8cfR0vs3WeISSDgZJSGPkc7xaypRHOnUpQkxEkm_CHsMYMzV2onfqGy3HIhEqKxeRpdQGUShhIfOS1RG8S7KICz09V7c0H1DsnGMiCNlXN1Hol0auXQrI-Gzki1YADiMG3Do_sosheWSzqkXdPgpbyzdS5QdhZDNyYMCDy6QTA3fQ7dZp-mHYpGEa_E8FM6AoHY8RMv7lgY8VQb8qR7yYJrOW-Y32CIa365UHf0sH7wVJsoJ'}
            alt={recipientName}
          />
          <div>
            <h4 className="font-label-md text-label-md text-on-surface font-bold">{recipientName}</h4>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : connectionStatus === 'connecting' ? 'bg-amber-400' : 'bg-red-500'}`}></span>
              <span className="text-[10px] text-outline font-label-md uppercase tracking-wider">
                {connectionStatus === 'connected' ? 'Live sync' : connectionStatus === 'connecting' ? 'connecting' : 'offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages listing */}
      <div 
        ref={scrollContainerRef}
        className="flex-grow p-6 overflow-y-auto space-y-4 scrollbar-hide"
      >
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.user_id;
          return (
            <div 
              key={msg.message_id} 
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                isMe 
                  ? 'bg-gradient-to-tr from-primary to-[#783e00] text-white rounded-tr-none'
                  : 'bg-white/70 border border-white/20 text-on-surface rounded-tl-none'
              }`}>
                <p>{msg.message_text}</p>
                <span className={`block text-[9px] text-right mt-1 opacity-70 ${isMe ? 'text-white' : 'text-outline'}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <div className="text-center py-12 text-outline font-body-md text-xs italic">
            Enter the frequency. Start the sync conversation.
          </div>
        )}
      </div>

      {/* Message input */}
      <form onSubmit={handleSend} className="bg-white/40 border-t border-white/20 p-4 flex gap-2">
        <input 
          type="text"
          value={inputMsg}
          onChange={(e) => setInputMsg(e.target.value)}
          placeholder="Sync your frequency..."
          className="flex-grow bg-white/70 border border-white/30 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button 
          type="submit"
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-[#855300] flex items-center justify-center text-white shadow-md active:scale-95 duration-100 hover:shadow-lg"
        >
          <span className="material-symbols-outlined text-lg">send</span>
        </button>
      </form>

    </div>
  );
};
