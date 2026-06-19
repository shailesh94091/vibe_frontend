import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { GlobalFilterProvider } from './GlobalFilterContext';
import { ArenaFeed } from './components/ArenaFeed';
import { VibeFeed } from './components/VibeFeed';
import { BridgeHub } from './components/BridgeHub';
import { ChatHub } from './components/ChatHub';
import { ProfileHub } from './components/ProfileHub';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfService } from './components/TermsOfService';
import api from './api';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Search State
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error('Failed to search users', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // 15s refresh
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleNotificationClick = async (n: any) => {
    try {
      await markAsRead(n.notification_id);
      setShowNotifications(false);
      if (n.sender_id) {
        navigate(`/chat/${n.sender_id}`);
      }
    } catch (err) {
      console.error('Failed to click notification', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        const res = await api.post('/auth/register', { username, email, password });
        login(res.data.token, { user_id: res.data.user_id, username, privacy_level: 'Public' });
      } else {
        const res = await api.post('/auth/login', { username, password });
        login(res.data.token, res.data.user);
      }
    } catch (error) {
      alert('Authentication failed. Check credentials.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-outline font-body-md animate-pulse">
        Entering Echo Sanctuary...
      </div>
    );
  }

  // Allow public access to legal compliance pages
  if (location.pathname === '/privacy') {
    return <PrivacyPolicy />;
  }
  if (location.pathname === '/terms') {
    return <TermsOfService />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-white p-8 rounded-3xl shadow-md border border-outline-variant max-w-sm w-full">
          <h1 className="text-3xl font-display-lg text-on-surface mb-6 text-center">
            {isRegistering ? 'Join Echo' : 'Welcome Back'}
          </h1>
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="text" placeholder="Username" 
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary"
              value={username} onChange={e => setUsername(e.target.value)} required 
            />
            {isRegistering && (
              <input 
                type="email" placeholder="Email" 
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary"
                value={email} onChange={e => setEmail(e.target.value)} required 
              />
            )}
            <input 
              type="password" placeholder="Password" 
              className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary"
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
            <button type="submit" className="w-full bg-primary text-white py-3 rounded-xl font-label-md hover:opacity-90 transition-opacity">
              {isRegistering ? 'Create Profile' : 'Enter Arena'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-on-surface-variant cursor-pointer hover:underline" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
          </p>
          <div className="mt-6 flex justify-center gap-4 text-xs text-outline">
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </div>
    );
  }

  // Resolve current active tab for styles
  const currentTab = location.pathname.startsWith('/bridge') ? 'bridge'
                   : location.pathname.startsWith('/chat') ? 'chat'
                   : location.pathname.startsWith('/profile') ? 'profile'
                   : location.pathname.startsWith('/feed') ? 'feed'
                   : 'arena';

  return (
    <div className="min-h-screen bg-background text-on-surface">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-3xl border-b border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between px-margin-mobile h-16 w-full md:px-margin-desktop">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary text-2xl">bubble_chart</span>
            <h1 className="font-display-lg-mobile text-display-lg-mobile bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Echo</h1>
          </div>
          <div className="flex items-center gap-6 relative">
            {/* Search Input and Button */}
            <div className="relative flex items-center">
              {showSearch ? (
                <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant rounded-full px-3 py-1 animate-[fadeIn_0.15s_ease-out]">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs w-36 text-on-surface placeholder:text-outline"
                    autoFocus
                  />
                  <button 
                    onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                    className="material-symbols-outlined text-outline text-sm hover:text-primary cursor-pointer border-none bg-transparent"
                  >
                    close
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowSearch(true)}
                  className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200 cursor-pointer border-none bg-transparent"
                >
                  search
                </button>
              )}

              {showSearch && searchQuery && (
                <div className="absolute right-0 mt-12 w-64 bg-white border border-outline-variant rounded-2xl shadow-xl z-[120] overflow-hidden">
                  <div className="p-3 border-b border-outline-variant bg-surface-container-low">
                    <span className="font-label-md text-xs text-on-surface font-bold">Search Results</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-outline-variant">
                    {searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-outline italic">No users found.</div>
                    ) : (
                      searchResults.map((userItem: any) => (
                        <Link 
                          to={`/chat/${userItem.user_id}`}
                          key={userItem.user_id}
                          onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                          className="p-3 flex items-center gap-3 hover:bg-surface-container-low/50 transition-colors cursor-pointer text-left decoration-none block"
                        >
                          <img 
                            src={userItem.profile_photo_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYiBQ-rjkiGp5aRSCu54YwYw7DXMnn8cfR0vs3WeISSDgZJSGPkc7xaypRHOnUpQkxEkm_CHsMYMzV2onfqGy3HIhEqKxeRpdQGUShhIfOS1RG8S7KICz09V7c0H1DsnGMiCNlXN1Hol0auXQrI-Gzki1YADiMG3Do_sosheWSzqkXdPgpbyzdS5QdhZDNyYMCDy6QTA3fQ7dZp-mHYpGEa_E8FM6AoHY8RMv7lgY8VQb8qR7yYJrOW-Y32CIa365UHf0sH7wVJsoJ'} 
                            alt="" 
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs text-on-surface block truncate">{userItem.username}</span>
                            <span className="text-[10px] text-outline block">{userItem.privacy_level} Profile</span>
                          </div>
                          <span className="material-symbols-outlined text-primary text-sm">chat</span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="material-symbols-outlined text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200 relative flex items-center justify-center cursor-pointer border-none bg-transparent"
              >
                notifications
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-error text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-surface animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-outline-variant rounded-2xl shadow-xl z-[120] overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                  <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
                    <span className="font-label-md text-sm text-on-surface font-bold">Notifications</span>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-primary font-bold hover:underline border-none bg-transparent"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-outline-variant">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-outline italic">No alerts yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.notification_id} 
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 flex gap-3 cursor-pointer transition-colors ${n.is_read ? 'bg-white hover:bg-surface-container-low/35' : 'bg-primary/5 hover:bg-primary/10'}`}
                        >
                          <img 
                            src={n.profile_photo_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYiBQ-rjkiGp5aRSCu54YwYw7DXMnn8cfR0vs3WeISSDgZJSGPkc7xaypRHOnUpQkxEkm_CHsMYMzV2onfqGy3HIhEqKxeRpdQGUShhIfOS1RG8S7KICz09V7c0H1DsnGMiCNlXN1Hol0auXQrI-Gzki1YADiMG3Do_sosheWSzqkXdPgpbyzdS5QdhZDNyYMCDy6QTA3fQ7dZp-mHYpGEa_E8FM6AoHY8RMv7lgY8VQb8qR7yYJrOW-Y32CIa365UHf0sH7wVJsoJ'} 
                            alt="" 
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-on-surface-variant leading-relaxed">
                              <span className="font-bold text-on-surface mr-1">{n.username}</span>
                              {n.message}
                            </p>
                            <span className="text-[9px] text-outline block mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main routing pages */}
      <main className="min-h-screen">
        <Routes>
          <Route path="/arena" element={<ArenaFeed />} />
          <Route path="/feed" element={<VibeFeed />} />
          <Route path="/bridge" element={<BridgeHub />} />
          <Route path="/chat" element={<ChatHub />} />
          <Route path="/chat/:userId" element={<ChatHub />} />
          <Route path="/profile" element={<ProfileHub />} />
          <Route path="*" element={<Navigate to="/arena" replace />} />
        </Routes>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full z-50 rounded-t-xl bg-surface/60 backdrop-blur-2xl border-t border-white/20 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] flex justify-around items-center h-20 px-4 pb-safe">
        <Link 
          to="/arena"
          className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-300 ease-out ${currentTab === 'arena' ? 'text-primary bg-secondary-container/10 rounded-full px-4 py-1' : 'text-on-surface-variant/70 hover:text-primary'}`}
        >
          <span className="material-symbols-outlined">explore</span>
          <span className="font-label-md text-label-md mt-1">Arena</span>
        </Link>
        <Link 
          to="/feed"
          className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-300 ease-out ${currentTab === 'feed' ? 'text-primary bg-secondary-container/10 rounded-full px-4 py-1' : 'text-on-surface-variant/70 hover:text-primary'}`}
        >
          <span className="material-symbols-outlined">photo_library</span>
          <span className="font-label-md text-label-md mt-1">Feed</span>
        </Link>
        <Link 
          to="/bridge"
          className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-300 ease-out ${currentTab === 'bridge' ? 'text-primary bg-secondary-container/10 rounded-full px-4 py-1' : 'text-on-surface-variant/70 hover:text-primary'}`}
        >
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>electric_bolt</span>
          <span className="font-label-md text-label-md mt-1">Bridge</span>
        </Link>
        <Link 
          to="/chat"
          className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-300 ease-out ${currentTab === 'chat' ? 'text-primary bg-secondary-container/10 rounded-full px-4 py-1' : 'text-on-surface-variant/70 hover:text-primary'}`}
        >
          <span className="material-symbols-outlined">chat_bubble</span>
          <span className="font-label-md text-label-md mt-1">Chat</span>
        </Link>
        <Link 
          to="/profile"
          className={`flex flex-col items-center justify-center transition-colors active:scale-90 duration-300 ease-out ${currentTab === 'profile' ? 'text-primary bg-secondary-container/10 rounded-full px-4 py-1' : 'text-on-surface-variant/70 hover:text-primary'}`}
        >
          <span className="material-symbols-outlined">person</span>
          <span className="font-label-md text-label-md mt-1">Profile</span>
        </Link>
      </nav>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalFilterProvider>
          <AppContent />
        </GlobalFilterProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
