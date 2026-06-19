import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ChatBox } from './ChatBox';

interface Friend {
  user_id: string;
  username: string;
  profile_photo_url: string;
}

interface IncomingRequest {
  connection_id: string;
  user_id: string;
  username: string;
  profile_photo_url: string;
}

export const ChatHub: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'messages' | 'requests'>('messages');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      const res = await api.get('/connections/friends');
      setFriends(res.data);
    } catch (err) {
      console.error('Failed to load friends', err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get('/connections/incoming');
      setRequests(res.data);
    } catch (err) {
      console.error('Failed to load incoming requests', err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFriends(), fetchRequests()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleAccept = async (senderId: string) => {
    try {
      await api.put('/connections/accept', { sender_id: senderId });
      await Promise.all([fetchFriends(), fetchRequests()]);
    } catch (err) {
      console.error('Failed to accept request', err);
    }
  };

  const handleReject = async (senderId: string) => {
    try {
      await api.delete(`/connections/request/${senderId}`);
      await fetchRequests();
    } catch (err) {
      console.error('Failed to reject request', err);
    }
  };

  const activeFriend = friends.find((f) => f.user_id === userId);

  return (
    <div className="pt-24 pb-32 min-h-screen max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      {/* Welcome & Sanctuary Aura */}
      <section className="mb-stack-md">
        <h2 className="font-headline-lg text-headline-lg text-on-surface-variant">Inner Sanctuary</h2>
        <p className="font-body-md text-body-md text-outline">Your high-vibration connections await.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Left Panel: Active Matches / Requests list */}
        <div className={`lg:col-span-5 xl:col-span-4 flex flex-col gap-stack-sm ${userId ? 'hidden lg:flex' : 'flex'}`}>
          <nav className="flex w-full bg-white/40 backdrop-blur-3xl border border-white/20 rounded-xl p-1 mb-4">
            <button 
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3 px-4 font-label-md text-label-md rounded-lg transition-all duration-300 cursor-pointer ${activeTab === 'messages' ? 'text-primary bg-surface-container-lowest/80 font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Messages
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-4 font-label-md text-label-md rounded-lg transition-all duration-300 relative cursor-pointer ${activeTab === 'requests' ? 'text-primary bg-surface-container-lowest/80 font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Requests
              {requests.length > 0 && (
                <span className="absolute top-1/2 -translate-y-1/2 right-3 bg-primary text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {requests.length}
                </span>
              )}
            </button>
          </nav>

          <div className="relative mb-2">
            <input 
              className="w-full bg-surface-container-low border-none rounded-full py-3 px-12 font-body-md text-on-surface placeholder-outline-variant focus:ring-2 focus:ring-primary-container/20 transition-all" 
              placeholder="Search conversations..." 
              type="text"
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-xl">search</span>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto scrollbar-hide max-h-[calc(100vh-400px)] lg:max-h-[618px]">
            {loading ? (
              <div className="text-center py-6 text-outline font-body-md animate-pulse">
                Syncing sanctuary...
              </div>
            ) : activeTab === 'messages' ? (
              friends.length === 0 ? (
                <div className="text-center py-12 bg-white/30 rounded-2xl border border-white/10 p-6 text-outline font-body-md">
                  <p className="mb-2">No matched waves detected.</p>
                  <p className="text-xs">Explore the Arena and sync tags to establish connections.</p>
                </div>
              ) : (
                friends.map((friend) => {
                  const isActive = friend.user_id === userId;
                  return (
                    <div 
                      key={friend.user_id} 
                      onClick={() => navigate(`/chat/${friend.user_id}`)}
                      className={`group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                        isActive 
                          ? 'bg-white/70 border-primary-container/30 shadow-md border-l-4 border-l-primary-container' 
                          : 'bg-white/40 border-transparent hover:bg-white/60 hover:border-white/20'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img 
                          className="w-14 h-14 rounded-full object-cover" 
                          src={friend.profile_photo_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYiBQ-rjkiGp5aRSCu54YwYw7DXMnn8cfR0vs3WeISSDgZJSGPkc7xaypRHOnUpQkxEkm_CHsMYMzV2onfqGy3HIhEqKxeRpdQGUShhIfOS1RG8S7KICz09V7c0H1DsnGMiCNlXN1Hol0auXQrI-Gzki1YADiMG3Do_sosheWSzqkXdPgpbyzdS5QdhZDNyYMCDy6QTA3fQ7dZp-mHYpGEa_E8FM6AoHY8RMv7lgY8VQb8qR7yYJrOW-Y32CIa365UHf0sH7wVJsoJ'}
                          alt={friend.username}
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary-container border-2 border-surface rounded-full"></span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <h3 className="font-headline-md text-label-md truncate text-on-surface font-bold mb-1">{friend.username}</h3>
                        <p className="font-body-md text-xs text-on-surface-variant truncate italic">Tap to open secure chat channel</p>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              requests.length === 0 ? (
                <div className="text-center py-12 bg-white/30 rounded-2xl border border-white/10 p-6 text-outline font-body-md">
                  <p>No pending requests.</p>
                </div>
              ) : (
                requests.map((reqItem) => (
                  <div 
                    key={reqItem.connection_id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-transparent"
                  >
                    <div className="flex items-center gap-3">
                      <img 
                        className="w-11 h-11 rounded-full object-cover" 
                        src={reqItem.profile_photo_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYiBQ-rjkiGp5aRSCu54YwYw7DXMnn8cfR0vs3WeISSDgZJSGPkc7xaypRHOnUpQkxEkm_CHsMYMzV2onfqGy3HIhEqKxeRpdQGUShhIfOS1RG8S7KICz09V7c0H1DsnGMiCNlXN1Hol0auXQrI-Gzki1YADiMG3Do_sosheWSzqkXdPgpbyzdS5QdhZDNyYMCDy6QTA3fQ7dZp-mHYpGEa_E8FM6AoHY8RMv7lgY8VQb8qR7yYJrOW-Y32CIa365UHf0sH7wVJsoJ'}
                        alt={reqItem.username}
                      />
                      <span className="font-label-md text-sm text-on-surface font-bold">{reqItem.username}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAccept(reqItem.user_id)}
                        className="px-3.5 py-1.5 bg-gradient-to-tr from-primary to-secondary text-white text-xs font-bold rounded-full cursor-pointer hover:opacity-90 shadow-sm"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleReject(reqItem.user_id)}
                        className="px-3.5 py-1.5 border border-outline text-on-surface-variant text-xs font-bold rounded-full cursor-pointer hover:bg-surface-container-low"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        {/* Right Panel: Chat Box Thread */}
        <div className={`lg:col-span-7 xl:col-span-8 flex-col ${userId ? 'flex' : 'hidden lg:flex'}`}>
          {userId && activeFriend ? (
            <ChatBox 
              recipientId={activeFriend.user_id} 
              recipientName={activeFriend.username} 
              recipientPhoto={activeFriend.profile_photo_url} 
              onBack={() => navigate('/chat')}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/40 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-xl h-[680px]">
              <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-surface-container to-surface-container-highest flex items-center justify-center shadow-inner animate-[fadeIn_0.5s_ease]">
                <span className="material-symbols-outlined text-5xl text-outline-variant">forum</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">Select a Conversation</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
                Tap on an Echo Match to enter their frequency and start synchronizing in real time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
