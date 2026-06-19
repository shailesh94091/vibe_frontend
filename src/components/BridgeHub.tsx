import React, { useEffect, useState, useCallback } from 'react';
import { useTelemetry } from '../useTelemetry';
import { useAuth } from '../AuthContext';
import { useGlobalFilter } from '../GlobalFilterContext';
import api from '../api';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
const API_BASE = `${backendUrl}/api`;

interface SocialAccount {
  account_id: string;
  provider: string;
  provider_uid: string;
  is_expired: boolean;
  last_synced: string | null;
  connected_at: string;
}

interface StrategyStatus {
  instagram: boolean;
  tiktok: boolean;
  twitter: boolean;
}

// Platform config for visual rendering
const PLATFORMS = [
  {
    id: 'tiktok' as const,
    name: 'TikTok',
    icon: 'music_note',
    bgClass: 'bg-black',
    textColor: 'text-white',
    description: 'Video interactions, liked sounds, and trending content.',
  },
  {
    id: 'instagram' as const,
    name: 'Instagram',
    icon: 'photo_camera',
    bgClass: 'bg-gradient-to-tr from-purple-500 to-pink-500',
    textColor: 'text-white',
    description: 'Story engagement, saved posts, and aesthetic preferences.',
  },
  {
    id: 'twitter' as const,
    name: 'X / Twitter',
    icon: 'tag',
    bgClass: 'bg-[#0f1419]',
    textColor: 'text-white',
    description: 'Liked tweets, bookmarks, and conversational threads.',
  },
];

export const BridgeHub: React.FC = () => {
  const { trackInteraction } = useTelemetry();
  const { user, checkAuth } = useAuth();
  const { sortBy, setSortBy } = useGlobalFilter();
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const connectedCount = accounts.length;
  const [strategies, setStrategies] = useState<StrategyStatus>({ instagram: false, tiktok: false, twitter: false });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  // Fetch strategy availability + connected accounts on mount
  const fetchStatus = useCallback(async () => {
    try {
      const [accountsRes, statusRes] = await Promise.all([
        api.get('/bridge/accounts'),
        api.get('/bridge/status'),
      ]);
      setAccounts(accountsRes.data.accounts || []);
      setStrategies(statusRes.data.strategies || { instagram: false, tiktok: false, twitter: false });
    } catch (err) {
      console.error('Failed to fetch bridge status', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();

    // Check URL params for OAuth callback result
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('bridge_connected');
    const error = params.get('bridge_error');
    const reason = params.get('reason');

    if (connected) {
      setNotification({ type: 'success', message: `${connected} connected successfully! Bridge is now active.` });
      window.history.replaceState({}, '', window.location.pathname);
      fetchStatus();
    }
    if (error) {
      const msg = reason === 'not_configured'
        ? `${error} is not configured. Add API keys to the server .env file.`
        : `Failed to connect ${error}. Please try again.`;
      setNotification({ type: 'error', message: msg });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [fetchStatus]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Animate signal bar
  useEffect(() => {
    const signalBar = document.getElementById('signal-bar');
    if (connectedCount === 0) {
      if (signalBar) {
        signalBar.style.width = '0%';
      }
      return;
    }
    const interval = setInterval(() => {
      if (signalBar && connectedCount > 0) {
        const randomWidth = Math.floor(Math.random() * (98 - 90 + 1)) + 90;
        signalBar.style.width = `${randomWidth}%`;
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [connectedCount]);

  const handleConnect = (provider: string) => {
    const isConfigured = strategies[provider as keyof StrategyStatus];
    if (!isConfigured) {
      setNotification({ type: 'info', message: `${provider} requires API keys. Add them to the server .env file and restart the backend.` });
      return;
    }
    window.location.href = `${API_BASE}/bridge/auth/${provider}`;
  };

  const handleDisconnect = async (provider: string) => {
    setDisconnecting(provider);
    try {
      await api.delete(`/bridge/accounts/${provider}`);
      setAccounts(prev => prev.filter(a => a.provider !== provider));
      setNotification({ type: 'success', message: `${provider} disconnected.` });
    } catch (err) {
      console.error('Failed to disconnect', err);
      setNotification({ type: 'error', message: `Failed to disconnect ${provider}.` });
    } finally {
      setDisconnecting(null);
    }
  };


  const handlePrivacyGuardClick = () => {
    setShowPrivacyModal(true);
  };

  const handleAuditLogClick = () => {
    setNotification({ 
      type: 'info', 
      message: 'Audit Log: Bridge is healthy. 3 automated intent extractions successfully logged.' 
    });
  };

  const handleGlobalFiltersClick = () => {
    setShowFiltersModal(true);
  };

  const handleTogglePrivacy = async () => {
    if (!user || updatingPrivacy) return;
    const nextPrivacy = user.privacy_level === 'Public' ? 'FriendsOnly' : 'Public';
    setUpdatingPrivacy(true);
    try {
      await api.put('/users/privacy', { privacy_level: nextPrivacy });
      await checkAuth();
      setNotification({ type: 'success', message: `Privacy updated to ${nextPrivacy === 'FriendsOnly' ? 'Sanctuary Mode' : 'Discoverable Mode'}` });
    } catch (err) {
      console.error('Failed to update privacy settings', err);
      setNotification({ type: 'error', message: 'Failed to update privacy settings.' });
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handleSimulateLike = () => {
    if (user) {
      trackInteraction(user.user_id, 'Like', 'TikTok', 'GenerativeArt');
      setNotification({ type: 'success', message: 'Simulated TikTok Like #GenerativeArt sent to Echo Engine.' });
    }
  };

  const isConnected = (provider: string) => accounts.some(a => a.provider === provider);
  const getAccount = (provider: string) => accounts.find(a => a.provider === provider);

  return (
    <div className="pt-24 px-margin-mobile max-w-container-max mx-auto pb-32">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl backdrop-blur-xl border max-w-md text-center font-label-md text-sm transition-all animate-[fadeIn_0.3s_ease] ${
          notification.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' :
          notification.type === 'error'   ? 'bg-red-50/90 border-red-200 text-red-800' :
                                            'bg-amber-50/90 border-amber-200 text-amber-800'
        }`}>
          <span className="material-symbols-outlined text-sm align-middle mr-2">
            {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
          </span>
          {notification.message}
        </div>
      )}

      {/* Welcome Header */}
      <section className="mb-stack-lg">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Bridge</h2>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">Your secure portal to the social web. Solar Sand encryption active.</p>
      </section>

      {/* Dynamic Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">

        {/* Main Column */}
        <div className="md:col-span-8 flex flex-col gap-gutter">

          {/* Browser Container — Social Platform Cards */}
          <div className="bg-white/40 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-xl min-h-[400px] flex flex-col border border-white/20">
            {/* Browser Bar */}
            <div className="bg-white/40 border-b border-white/20 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/30"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400/30"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/30"></div>
                </div>
                <div className="bg-surface-container-low px-4 py-1.5 rounded-full flex items-center gap-2 text-label-md font-label-md border border-white/50">
                  <span className="material-symbols-outlined text-sm text-on-surface-variant">lock</span>
                  <span className="text-on-surface">echo.bridge/secure</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-primary-container/10 rounded-full border border-primary-container/20">
                  <div className={`w-2 h-2 rounded-full ${connectedCount > 0 ? 'bg-primary-container animate-pulse shadow-[0_0_15px_2px_rgba(245,158,11,0.4)]' : 'bg-outline'}`}></div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary-container">
                    {connectedCount > 0 ? `${connectedCount} Active Gate${connectedCount > 1 ? 's' : ''}` : 'No Active Gates'}
                  </span>
                </div>
              </div>
            </div>

            {/* Content: Social Platform Cards */}
            <div className="flex-grow p-6 md:p-8">
              <div className="flex flex-col gap-4">
                {PLATFORMS.map(platform => {
                  const connected = isConnected(platform.id);
                  const account = getAccount(platform.id);
                  const configured = strategies[platform.id];

                  return (
                    <div key={platform.id} className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${
                      connected ? 'bg-white/60 border-primary-container/30 shadow-md' :
                      !configured ? 'bg-surface-container-low/30 border-transparent opacity-70' :
                      'bg-surface-container-low/50 border-transparent hover:border-white/50 hover:bg-white/40'
                    }`}>
                      {/* Platform Icon */}
                      <div className={`w-14 h-14 rounded-full ${platform.bgClass} flex items-center justify-center ${platform.textColor} shadow-lg flex-shrink-0 ${!configured && !connected ? 'grayscale' : ''}`}>
                        <span className="material-symbols-outlined">{platform.icon}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-label-md text-label-md text-on-surface">{platform.name}</h4>
                          {connected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Connected</span>
                          )}
                          {connected && account?.is_expired && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-error bg-error/10 px-2 py-0.5 rounded-full">Expired</span>
                          )}
                          {!configured && !connected && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-dim px-2 py-0.5 rounded-full">Needs API Key</span>
                          )}
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed truncate">
                          {connected
                            ? `Last synced: ${account?.last_synced ? new Date(account.last_synced).toLocaleString() : 'Pending first sync...'}`
                            : !configured
                              ? `Add ${platform.name} credentials to .env to enable this gate.`
                              : platform.description
                          }
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {connected ? (
                          <button
                            onClick={() => handleDisconnect(platform.id)}
                            disabled={disconnecting === platform.id}
                            className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider border border-error/30 text-error rounded-full hover:bg-error/10 transition-colors disabled:opacity-50"
                          >
                            {disconnecting === platform.id ? 'Removing...' : 'Disconnect'}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleConnect(platform.id)}
                            className={`px-5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-md transition-all ${
                              configured
                                ? 'bg-gradient-to-r from-primary-container to-secondary-container text-white hover:shadow-lg active:scale-95'
                                : 'bg-surface-dim text-on-surface-variant cursor-not-allowed'
                            }`}
                          >
                            {configured ? 'Connect' : 'Configure'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Privacy Guard', icon: 'shield_person', action: handlePrivacyGuardClick },
              { label: 'Audit Log', icon: 'history_edu', action: handleAuditLogClick },
              { label: 'Simulate Like', icon: 'favorite', action: handleSimulateLike },
              { label: 'Global Filters', icon: 'tune', action: handleGlobalFiltersClick },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className="bg-white/40 backdrop-blur-3xl border border-white/20 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/60 transition-all group cursor-pointer hover:border-primary-container/20 w-full text-center"
              >
                <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="text-label-md font-label-md text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 flex flex-col gap-gutter">

          {/* Active Gates Summary */}
          <div className="bg-white/40 backdrop-blur-3xl border border-white/20 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h4 className="font-headline-md text-headline-md text-on-surface">Active Gates</h4>
              <div className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${connectedCount > 0 ? 'bg-green-100 text-green-700' : 'bg-surface-dim text-on-surface-variant'}`}>
                {connectedCount > 0 ? 'Secure' : 'Offline'}
              </div>
            </div>
            {loading ? (
              <div className="text-sm text-on-surface-variant animate-pulse">Scanning gates...</div>
            ) : connectedCount === 0 ? (
              <div className="text-sm text-on-surface-variant space-y-3">
                <p>No social accounts connected yet.</p>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <span className="font-bold">Setup Required:</span> Add your Instagram, TikTok, or Twitter API credentials to the backend <code className="bg-amber-100 px-1 rounded">.env</code> file and restart the server.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map(acc => {
                  const platform = PLATFORMS.find(p => p.id === acc.provider);
                  return (
                    <div key={acc.account_id} className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-primary-container/20">
                      <div className={`w-10 h-10 rounded-full ${platform?.bgClass || 'bg-outline'} flex items-center justify-center ${platform?.textColor || 'text-white'}`}>
                        <span className="material-symbols-outlined text-sm">{platform?.icon || 'link'}</span>
                      </div>
                      <div className="flex-grow">
                        <div className="font-label-md text-label-md text-on-surface">{platform?.name || acc.provider}</div>
                        <div className="text-[11px] text-primary font-bold">
                          {acc.is_expired ? 'TOKEN EXPIRED' : 'ACTIVE STREAM'}
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${acc.is_expired ? 'bg-error' : 'bg-primary-container animate-pulse shadow-[0_0_15px_2px_rgba(245,158,11,0.4)]'}`}></div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Real-time Analysis */}
          <div className={`rounded-3xl p-6 shadow-sm border transition-all duration-300 ${
            connectedCount > 0 
              ? 'bg-gradient-to-br from-[#fef3c7] to-[#fffbeb] border-primary-fixed' 
              : 'bg-white/40 border-white/20'
          }`}>
            <h4 className={`font-label-md text-label-md tracking-widest uppercase mb-4 ${connectedCount > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>Real-time Analysis</h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <span className={`material-symbols-outlined ${connectedCount > 0 ? 'text-primary-container' : 'text-outline'}`} style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-md text-label-md text-on-surface">Search Listener</span>
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      connectedCount > 0 
                        ? 'bg-primary-container shadow-[0_0_15px_2px_rgba(245,158,11,0.4)] animate-pulse' 
                        : 'bg-outline'
                    }`}></div>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    {connectedCount > 0 
                      ? 'Extracting context from browsing to refine your Aura.' 
                      : 'Connect your socials to activate browser interest stream.'
                    }
                  </p>
                </div>
              </div>

              <div className="bg-white/40 rounded-2xl p-4 border border-white/20">
                <div className="flex justify-between text-[11px] font-bold text-on-surface-variant uppercase mb-2">
                  <span>Signal Strength</span>
                  <span>{connectedCount > 0 ? '94%' : '—'}</span>
                </div>
                <div className="w-full bg-primary-fixed/30 h-1.5 rounded-full overflow-hidden">
                  <div id="signal-bar" className={`bg-primary-container h-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.4)] ${connectedCount > 0 ? 'w-[94%]' : 'w-0'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Insight Card */}
          <div className="relative rounded-3xl overflow-hidden aspect-square shadow-lg group">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuC7f20tc_rGlcvmV5UkLhU8-r9MgLqsavGP3xhnmTr17uOSIw9X1zwBY0SIOHi2lIa1-hL_jNoNyob4-b3vi9StBAUuVyif5wvEOaqSPHi2Z0G4nYHPxniRzGfEoBHSbAfvpn64UQmuh5FpxvMuZhvWJw7oZ-F0idXUNS8aVbAASz1x0u6pBcsKzdhIK6GLITVCQhSCl8p2af8yOIvVMulo0uwtT5DChLaF2gvIM3ko8qI8r7wzkNESCeNZhtK0gYYGxLKDODHtuW-C')` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
              <span className="text-[10px] font-bold text-primary-fixed tracking-[0.2em] uppercase mb-2">Daily Insight</span>
              <h5 className="text-white font-headline-md text-headline-md leading-tight">Browsing with intent reduces digital noise by 60%.</h5>
            </div>
          </div>

        </div>
      </div>
      {/* Privacy Guard Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-outline-variant p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              close
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">shield_person</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Privacy Guard Settings</h3>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant mb-6 leading-relaxed">
              When Privacy Guard is active (Sanctuary Mode), your profile will be hidden from the public Arena matching feed. Only your established connections can see your details.
            </p>
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 flex items-center justify-between gap-4 mb-8">
              <div className="flex flex-col">
                <span className="font-label-md text-sm text-on-surface font-bold">
                  {user?.privacy_level === 'FriendsOnly' ? 'Sanctuary Mode (Hidden)' : 'Discoverable Mode (Public)'}
                </span>
                <span className="text-xs text-on-surface-variant mt-0.5">
                  {user?.privacy_level === 'FriendsOnly' ? 'Hidden from search and arena' : 'Publicly matchable'}
                </span>
              </div>
              <button
                onClick={handleTogglePrivacy}
                disabled={updatingPrivacy}
                className={`w-14 h-8 rounded-full transition-colors relative flex items-center ${
                  user?.privacy_level === 'FriendsOnly' ? 'bg-primary' : 'bg-outline/30'
                } ${updatingPrivacy ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
              >
                <div 
                  className={`w-6 h-6 rounded-full bg-white shadow-md absolute transition-transform ${
                    user?.privacy_level === 'FriendsOnly' ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            {updatingPrivacy && (
              <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm mb-6 animate-pulse">
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                Saving setting to database...
              </div>
            )}
            <button 
              onClick={() => setShowPrivacyModal(false)}
              disabled={updatingPrivacy}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-label-md hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-wait"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Global Filters Sorting Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-outline-variant p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setShowFiltersModal(false)}
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              close
            </button>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-3xl">tune</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Global Sort Preferences</h3>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant mb-6 leading-relaxed">
              Select how matches in your Arena feed should be displayed. This preference context is shared globally.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {[
                { value: 'default' as const, label: 'Default Sorting', desc: 'Sort by system recommendation sequence.' },
                { value: 'compatibility' as const, label: 'Sync Percentage', desc: 'Highest matching frequency first.' },
                { value: 'alphabetical' as const, label: 'Alphabetical Order', desc: 'Sort user cards alphabetically by username.' }
              ].map(opt => {
                const isSelected = sortBy === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setNotification({ type: 'success', message: `Sort strategy updated: ${opt.label}` });
                    }}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-primary/5 border-primary shadow-sm' 
                        : 'bg-white hover:bg-surface-container-low border-outline-variant cursor-pointer'
                    }`}
                  >
                    <span className="font-label-md text-sm text-on-surface font-bold flex items-center justify-between w-full">
                      {opt.label}
                      {isSelected && <span className="material-symbols-outlined text-primary text-lg">check_circle</span>}
                    </span>
                    <span className="text-xs text-on-surface-variant mt-1">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setShowFiltersModal(false)}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-label-md hover:opacity-95 transition-opacity cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
