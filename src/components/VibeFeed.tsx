import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

interface Post {
  post_id: string;
  photo_url: string;
  caption: string;
  created_at: string;
  creator_id: string;
  creator_username: string;
  creator_photo_url: string;
  compatibility_score: number;
  likes_count: string | number;
  comments_count: string | number;
  has_liked: boolean;
  tags: string[];
}

export const VibeFeed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Comments state
  const [showCommentsPostId, setShowCommentsPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');

  const fetchFeed = async () => {
    try {
      const response = await api.get('/posts/feed');
      setPosts(response.data);
    } catch (err) {
      console.error('Failed to fetch vibe feed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleLike = async (post: Post) => {
    try {
      const res = await api.post(`/posts/${post.post_id}/like`);
      const status = res.data.status;

      setPosts(prev =>
        prev.map(p => {
          if (p.post_id === post.post_id) {
            const isLikedNow = status === 'liked';
            return {
              ...p,
              has_liked: isLikedNow,
              likes_count: isLikedNow ? Number(p.likes_count) + 1 : Math.max(0, Number(p.likes_count) - 1)
            };
          }
          return p;
        })
      );

      if (status === 'liked') {
        showToast("Vibe aligned! Your Echo Cloud has synchronized with this post's aesthetics.");
      }
    } catch (err) {
      console.error('Failed to toggle post like', err);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchComments = async (postId: string) => {
    try {
      setLoadingComments(true);
      const res = await api.get(`/posts/${postId}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to fetch comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenComments = (postId: string) => {
    setShowCommentsPostId(postId);
    fetchComments(postId);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCommentsPostId || !newCommentText.trim()) return;
    try {
      await api.post(`/posts/${showCommentsPostId}/comments`, { comment_text: newCommentText.trim() });
      setNewCommentText('');
      fetchComments(showCommentsPostId);
      
      // Update local comment count
      setPosts(prev =>
        prev.map(p =>
          p.post_id === showCommentsPostId
            ? { ...p, comments_count: Number(p.comments_count) + 1 }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  if (loading) {
    return <div className="p-8 text-on-surface-variant animate-pulse font-body-md">Scanning the space for vibes...</div>;
  }

  return (
    <div className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto relative">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] max-w-md w-full px-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-gradient-to-r from-primary to-secondary text-white border border-white/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3">
            <span className="material-symbols-outlined text-white animate-bounce">sync</span>
            <p className="text-xs font-bold text-left">{toast}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col mb-stack-lg">
        <h2 className="font-display-lg text-display-lg text-on-surface">Vibe Feed</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mt-2">
          Discover posts aligned with your frequency. Liking compatible posts synchronizes their vibes to your Echo Cloud.
        </p>
      </div>

      {/* Post Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter max-w-4xl mx-auto">
        {posts.map(post => (
          <div key={post.post_id} className="group relative rounded-[2rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.04)] bg-white/50 backdrop-blur-3xl border border-white/20 transition-all duration-300 flex flex-col">
            {/* Header: User Profile */}
            <div className="p-4 flex items-center justify-between border-b border-outline-variant/30">
              <Link to={`/chat/${post.creator_id}`} className="flex items-center gap-3 decoration-none cursor-pointer">
                <img 
                  src={post.creator_photo_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYiBQ-rjkiGp5aRSCu54YwYw7DXMnn8cfR0vs3WeISSDgZJSGPkc7xaypRHOnUpQkxEkm_CHsMYMzV2onfqGy3HIhEqKxeRpdQGUShhIfOS1RG8S7KICz09V7c0H1DsnGMiCNlXN1Hol0auXQrI-Gzki1YADiMG3Do_sosheWSzqkXdPgpbyzdS5QdhZDNyYMCDy6QTA3fQ7dZp-mHYpGEa_E8FM6AoHY8RMv7lgY8VQb8qR7yYJrOW-Y32CIa365UHf0sH7wVJsoJ'} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-white/40"
                />
                <div className="text-left min-w-0">
                  <span className="font-bold text-sm text-on-surface block truncate hover:text-primary transition-colors">{post.creator_username}</span>
                  <span className="text-[10px] text-outline block">{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
              {/* Compatibility score if present */}
              {Number(post.compatibility_score) > 0 && (
                <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold">
                  {post.compatibility_score} Resonance
                </div>
              )}
            </div>

            {/* Post Image */}
            <div className="aspect-[4/3] relative overflow-hidden bg-black/5">
              <img 
                src={post.photo_url} 
                alt="" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Caption & Info */}
            <div className="p-6 flex-grow flex flex-col justify-between">
              <div>
                <p className="text-sm text-on-surface-variant leading-relaxed text-left mb-4">
                  <span className="font-bold text-on-surface mr-2">{post.creator_username}</span>
                  {post.caption}
                </p>

                {/* Tag Pills */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-[9px] uppercase tracking-widest font-bold bg-primary/5 text-primary/80 px-2.5 py-1 rounded-full border border-primary/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-6 border-t border-outline-variant/30 pt-4 mt-auto">
                <button 
                  onClick={() => handleLike(post)}
                  className={`flex items-center gap-1.5 bg-transparent border-none outline-none cursor-pointer transition-transform active:scale-95 duration-200 ${
                    post.has_liked ? 'text-error font-bold' : 'text-on-surface-variant hover:text-error'
                  }`}
                >
                  <span className={`material-symbols-outlined text-xl ${post.has_liked ? 'filled' : ''}`}>
                    favorite
                  </span>
                  <span className="text-xs font-bold">{post.likes_count}</span>
                </button>

                <button 
                  onClick={() => handleOpenComments(post.post_id)}
                  className="flex items-center gap-1.5 bg-transparent border-none outline-none cursor-pointer text-on-surface-variant hover:text-primary transition-transform active:scale-95 duration-200"
                >
                  <span className="material-symbols-outlined text-xl">
                    chat_bubble
                  </span>
                  <span className="text-xs font-bold">{post.comments_count}</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="col-span-full text-center py-16 text-on-surface-variant font-body-md bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/20 shadow-sm">
            <span className="material-symbols-outlined text-4xl text-outline mb-3">camera_roll</span>
            <p className="text-sm font-bold">Scanning the frequency...</p>
            <p className="text-xs text-outline mt-1 max-w-xs mx-auto">No discovery posts found yet. Create a post with a caption on your Profile tab to set the vibe!</p>
          </div>
        )}
      </div>

      {/* MODAL: Comments Drawer */}
      {showCommentsPostId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-outline-variant p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full mx-4 relative flex flex-col h-[520px]">
            <button 
              onClick={() => setShowCommentsPostId(null)}
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              close
            </button>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex-shrink-0 text-left">Comments</h3>

            <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2">
              {loadingComments ? (
                <div className="text-center py-12 text-sm text-outline animate-pulse">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-sm text-outline italic">No comments yet. Be the first to comment!</div>
              ) : (
                comments.map(c => (
                  <div key={c.comment_id} className="flex items-start gap-3 bg-surface-container-low/30 border border-outline-variant/30 p-3 rounded-2xl">
                    <img 
                      src={c.profile_photo_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAr_3abBqL4JjKYx6E46VtyyJM1Na8XT0s1p7UOEZYDVjPGB61J1XXRLs8C7RRkxtEIKT9N_xP-AY_08bG0oP4Wynupp0i4X2DyFdRjLUI7XPH0NIqWNATYPWsSmT77FVQaHoMuPXmMM3Q-fP_qTmLxQ5k3YeXDvOk6jQBwY3IR1nXNGbfsORxvxLkN_iVCEIlfsRkDuo0qyNFhY1mE_ZJm3bvUrKofUzffRqhUTYj8EgK3EvqSWT_xlcK1mZQC0SYam3fXSKtI2uIy"} 
                      alt="" 
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/40"
                    />
                    <div className="flex-grow min-w-0 text-left">
                      <div className="font-label-md text-xs text-on-surface font-bold mb-0.5">{c.username}</div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">{c.comment_text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 border-t border-outline-variant/50 pt-4 flex-shrink-0">
              <input 
                type="text" 
                placeholder="Add a comment..."
                value={newCommentText}
                onChange={e => setNewCommentText(e.target.value)}
                className="flex-grow px-4 py-2.5 bg-surface border border-outline-variant rounded-full text-xs focus:outline-none focus:border-primary"
                required
              />
              <button 
                type="submit"
                className="bg-primary text-white px-5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
