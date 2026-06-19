import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useGlobalFilter } from '../GlobalFilterContext';

interface Match {
  user_id: string;
  username: string;
  profile_photo_url: string;
  bio: string;
  sync_percentage: number;
  common_tags: string[];
}

export const ArenaFeed: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedTag, setSelectedTag, sortBy } = useGlobalFilter();

  // Connection stats
  const [stats, setStats] = useState<{ followers: any[]; following: any[] }>({ followers: [], following: [] });
  const [requestingIds, setRequestingIds] = useState<string[]>([]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch connection stats', err);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await api.get('/arena/matches');
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to fetch arena matches', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchMatches(), fetchStats()]);
  }, []);

  const handleConnect = async (matchId: string) => {
    if (requestingIds.includes(matchId)) return;
    setRequestingIds(prev => [...prev, matchId]);
    try {
      await api.post('/connections/request', { receiver_id: matchId });
      await fetchStats(); // Refresh connections list
    } catch (err) {
      console.error('Failed to send connect request', err);
    } finally {
      setRequestingIds(prev => prev.filter(id => id !== matchId));
    }
  };

  const isFriend = (matchId: string) => {
    const isFollower = stats.followers.some(f => f.user_id === matchId);
    const isFollowing = stats.following.some(f => f.user_id === matchId);
    return isFollower && isFollowing;
  };

  const isRequested = (matchId: string) => {
    const isFollowing = stats.following.some(f => f.user_id === matchId);
    const isFollower = stats.followers.some(f => f.user_id === matchId);
    return isFollowing && !isFollower;
  };

  const hasIncomingRequest = (matchId: string) => {
    const isFollower = stats.followers.some(f => f.user_id === matchId);
    const isFollowing = stats.following.some(f => f.user_id === matchId);
    return isFollower && !isFollowing;
  };

  if (loading) {
    return <div className="p-8 text-on-surface-variant animate-pulse font-body-md">Scanning the Echo Cloud for matches...</div>;
  }

  // Get unique tags from the matches list to render filters dynamically
  const availableTags = Array.from(
    new Set(matches.flatMap(m => m.common_tags || []))
  );

  const filteredMatches = selectedTag
    ? matches.filter(m => m.common_tags?.includes(selectedTag))
    : matches;

  // Apply sorting based on GlobalFilterContext sortBy
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (sortBy === 'compatibility') {
      return b.sync_percentage - a.sync_percentage;
    }
    if (sortBy === 'alphabetical') {
      return a.username.localeCompare(b.username);
    }
    return 0; // default
  });

  return (
    <div className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      {/* Section Header */}
      <div className="flex flex-col mb-stack-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-display-lg text-display-lg text-on-surface">Arena</h2>
          {sortBy !== 'default' && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-label-md text-xs">
              <span className="material-symbols-outlined text-sm">sort</span>
              <span>Sorted by {sortBy === 'compatibility' ? 'Resonance' : 'Name'}</span>
            </div>
          )}
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mt-2">
          Discover minds that resonate with your frequency. Synchronize through shared aesthetics and interests.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-3 mb-stack-md overflow-x-auto pb-4 no-scrollbar">
        <button 
          onClick={() => setSelectedTag(null)}
          className={`rounded-full px-6 py-2 text-label-md transition-all active:scale-95 duration-200 ${
            selectedTag === null 
              ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg font-bold'
              : 'bg-primary/10 text-primary hover:bg-primary/20 font-bold'
          }`}
        >
          All Echoes
        </button>
        {availableTags.map(tag => (
          <button 
            key={tag}
            onClick={() => setSelectedTag(tag)}
            className={`rounded-full px-6 py-2 text-label-md transition-all active:scale-95 duration-200 ${
              selectedTag === tag 
                ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg font-bold'
                : 'bg-primary/10 text-primary hover:bg-primary/20 font-bold'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid of Match Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {sortedMatches.map(match => (
          <div key={match.user_id} className="group relative rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(133,83,0,0.06)] bg-white/40 backdrop-blur-3xl border border-white/20 transition-all duration-500 hover:-translate-y-2">
            <div className="aspect-[4/5] relative">
              <img 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                src={match.profile_photo_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYiBQ-rjkiGp5aRSCu54YwYw7DXMnn8cfR0vs3WeISSDgZJSGPkc7xaypRHOnUpQkxEkm_CHsMYMzV2onfqGy3HIhEqKxeRpdQGUShhIfOS1RG8S7KICz09V7c0H1DsnGMiCNlXN1Hol0auXQrI-Gzki1YADiMG3Do_sosheWSzqkXdPgpbyzdS5QdhZDNyYMCDy6QTA3fQ7dZp-mHYpGEa_E8FM6AoHY8RMv7lgY8VQb8qR7yYJrOW-Y32CIa365UHf0sH7wVJsoJ'} 
                alt={match.username} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {/* Sync Badge */}
              <div className="absolute top-6 right-6 bg-white/40 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
                <span className="text-label-md font-bold text-on-background">{match.sync_percentage}% Sync</span>
              </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end">
              <div className="min-w-0 flex-1">
                <h3 className="font-headline-lg text-headline-lg text-white mb-2">{match.username}</h3>
                <div className="flex flex-wrap gap-2">
                  {match.common_tags?.map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-widest font-bold bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full border border-white/30">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex-shrink-0 ml-4">
                {isFriend(match.user_id) ? (
                  <Link 
                    to={`/chat/${match.user_id}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-tr from-green-500 to-emerald-600 text-white rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform"
                  >
                    <span className="material-symbols-outlined text-sm">chat_bubble</span>
                    Chat
                  </Link>
                ) : isRequested(match.user_id) ? (
                  <button 
                    disabled
                    className="flex items-center gap-1.5 px-4 py-2 bg-white/30 text-white border border-white/40 rounded-full text-xs font-bold cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-xs animate-pulse">hourglass_top</span>
                    Requested
                  </button>
                ) : hasIncomingRequest(match.user_id) ? (
                  <button 
                    onClick={() => handleConnect(match.user_id)}
                    disabled={requestingIds.includes(match.user_id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-tr from-amber-500 to-orange-600 text-white rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50"
                  >
                    Accept
                  </button>
                ) : (
                  <button 
                    onClick={() => handleConnect(match.user_id)}
                    disabled={requestingIds.includes(match.user_id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-tr from-primary to-secondary text-white rounded-full text-xs font-bold shadow-lg hover:scale-105 transition-transform cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {sortedMatches.length === 0 && (
          <div className="col-span-full text-center py-12 text-on-surface-variant font-body-md">
            {selectedTag 
              ? `No matches found with the tag "${selectedTag}".`
              : 'No active matches in the arena yet. Keep exploring to build your Echo Cloud!'}
          </div>
        )}
      </div>
    </div>
  );
};
