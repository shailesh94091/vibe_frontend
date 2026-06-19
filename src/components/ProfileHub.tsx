import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';

export const ProfileHub: React.FC = () => {
  const { user, checkAuth, logout } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [stats, setStats] = useState<{ followers: any[]; following: any[] }>({ followers: [], following: [] });
  const [posts, setPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Modals state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState<'followers' | 'following' | null>(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCommentsPostId, setShowCommentsPostId] = useState<string | null>(null);

  // Input states
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const [postPhotoPreview, setPostPhotoPreview] = useState<string | null>(null);
  const [postCaption, setPostCaption] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch user stats', err);
    }
  };

  const fetchPosts = async () => {
    if (!user) return;
    try {
      setLoadingPosts(true);
      const res = await api.get(`/posts/${user.user_id}`);
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to fetch posts', err);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      fetchPosts();
    }
  }, [user]);

  const togglePrivacy = async () => {
    if (!user || updating) return;
    const nextPrivacy = user.privacy_level === 'Public' ? 'FriendsOnly' : 'Public';
    setUpdating(true);
    try {
      await api.put('/users/privacy', { privacy_level: nextPrivacy });
      await checkAuth();
    } catch (err) {
      console.error('Failed to update privacy level', err);
      alert('Failed to update privacy settings.');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profilePhotoPreview) return;
    setSavingPhoto(true);
    try {
      await api.put('/users/profile-photo', { profile_photo_url: profilePhotoPreview });
      await checkAuth();
      setShowPhotoModal(false);
      setProfilePhotoPreview(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile photo.');
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postPhotoPreview) return;
    setCreatingPost(true);
    try {
      await api.post('/posts', { photo_url: postPhotoPreview, caption: postCaption.trim() });
      setPostPhotoPreview(null);
      setPostCaption('');
      setShowCreatePostModal(false);
      fetchPosts();
    } catch (err) {
      console.error(err);
      alert('Failed to create post.');
    } finally {
      setCreatingPost(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(p => {
        if (p.post_id === postId) {
          const nextLiked = !p.has_liked;
          return {
            ...p,
            has_liked: nextLiked,
            likes_count: nextLiked ? parseInt(p.likes_count) + 1 : parseInt(p.likes_count) - 1
          };
        }
        return p;
      }));
    } catch (err) {
      console.error('Failed to like post', err);
    }
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
      setPosts(prev => prev.map(p => p.post_id === showCommentsPostId ? { ...p, comments_count: parseInt(p.comments_count) + 1 } : p));
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  return (
    <div className="pt-24 pb-32 min-h-screen max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-12">
        <div className="relative mb-6">
          <img 
            className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-2xl" 
            src={user?.profile_photo_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAr_3abBqL4JjKYx6E46VtyyJM1Na8XT0s1p7UOEZYDVjPGB61J1XXRLs8C7RRkxtEIKT9N_xP-AY_08bG0oP4Wynupp0i4X2DyFdRjLUI7XPH0NIqWNATYPWsSmT77FVQaHoMuPXmMM3Q-fP_qTmLxQ5k3YeXDvOk6jQBwY3IR1nXNGbfsORxvxLkN_iVCEIlfsRkDuo0qyNFhY1mE_ZJm3bvUrKofUzffRqhUTYj8EgK3EvqSWT_xlcK1mZQC0SYam3fXSKtI2uIy"}
            alt={user?.username || "Aura Curator"}
          />
          <button 
            onClick={() => setShowPhotoModal(true)}
            className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-[#855300] to-[#613b00] rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
        
        <h2 className="font-display-lg text-display-lg text-on-surface mb-2">{user?.username}</h2>
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full font-label-md text-[11px] font-bold uppercase tracking-widest mb-6">
          Pro Member
        </div>

        <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-md mb-8">
          Curating moments of solar serenity. Digital architect & sun-chaser. Capturing the intersection of light and minimalist design through a glass lens.
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-center gap-12">
          <div className="text-center">
            <div className="font-headline-lg text-headline-lg text-on-surface">{user?.top_echoes?.length || 0}</div>
            <div className="font-label-md text-[11px] text-outline uppercase tracking-wider">Echoes</div>
          </div>
          <button 
            onClick={() => setShowStatsModal('followers')}
            className="text-center hover:opacity-85 transition-opacity cursor-pointer bg-transparent border-none"
          >
            <div className="font-headline-lg text-headline-lg text-on-surface">{stats.followers.length}</div>
            <div className="font-label-md text-[11px] text-outline uppercase tracking-wider">Followers</div>
          </button>
          <button 
            onClick={() => setShowStatsModal('following')}
            className="text-center hover:opacity-85 transition-opacity cursor-pointer bg-transparent border-none"
          >
            <div className="font-headline-lg text-headline-lg text-on-surface">{stats.following.length}</div>
            <div className="font-label-md text-[11px] text-outline uppercase tracking-wider">Following</div>
          </button>
        </div>
      </div>

      {/* Echo Cloud Section */}
      <section className="mb-12">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Echo Cloud</h3>
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          {user?.top_echoes && user.top_echoes.length > 0 ? (
            user.top_echoes.map(tag => (
              <div key={tag.tag_name} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-container to-secondary-container text-white rounded-full font-label-md shadow-md cursor-pointer hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-sm">tag</span>
                {tag.tag_name}
              </div>
            ))
          ) : (
            <div className="text-sm text-on-surface-variant italic">No interest echoes detected yet. Connect social accounts in the Bridge tab to synchronize your frequency!</div>
          )}
        </div>
      </section>

      {/* Privacy & Security Section */}
      <section className="mb-12">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Privacy & Security</h3>
        <div className="bg-white border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="font-title-md text-on-surface mb-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">shield</span>
              Privacy Guard
            </h4>
            <p className="font-body-md text-sm text-on-surface-variant">
              When enabled, your profile is hidden from the Arena and only visible to your connections.
            </p>
          </div>
          <div className="flex items-center gap-4 animate-fade-in">
            <span className={`font-label-md text-sm ${user?.privacy_level === 'FriendsOnly' ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              {user?.privacy_level === 'FriendsOnly' ? 'Sanctuary Mode (Hidden)' : 'Discoverable Mode (Public)'}
            </span>
            <button 
              onClick={togglePrivacy}
              disabled={updating}
              className={`w-14 h-8 rounded-full transition-colors relative flex items-center ${
                user?.privacy_level === 'FriendsOnly' ? 'bg-primary' : 'bg-outline/30'
              } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div 
                className={`w-6 h-6 rounded-full bg-white shadow-md absolute transition-transform ${
                  user?.privacy_level === 'FriendsOnly' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Gallery / Posts Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Gallery</h3>
            <p className="font-body-md text-sm text-on-surface-variant">Private collection of visual explorations</p>
          </div>
          <button 
            onClick={() => setShowCreatePostModal(true)}
            className="flex items-center gap-1.5 font-label-md bg-primary text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity text-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">add_a_photo</span> Create Post
          </button>
        </div>

        {loadingPosts ? (
          <div className="text-center py-12 text-outline font-body-md animate-pulse">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 bg-white/30 border border-outline-variant rounded-3xl text-outline font-body-md italic text-sm p-6">
            No posts uploaded yet. Capture a moment and publish it here!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <div key={post.post_id} className="bg-white/40 border border-white/20 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                <div className="aspect-square relative overflow-hidden group bg-surface-container-low">
                  <img 
                    src={post.photo_url} 
                    alt={post.caption || ''} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  {post.caption && <p className="text-xs text-on-surface-variant mb-4 leading-relaxed font-body-md">{post.caption}</p>}
                  <div className="mt-auto flex items-center justify-between border-t border-outline-variant/30 pt-3">
                    <button 
                      onClick={() => handleLikePost(post.post_id)}
                      className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-colors ${post.has_liked ? 'text-error animate-[heartBeat_0.4s_ease-out]' : 'text-on-surface-variant hover:text-error'}`}
                    >
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: post.has_liked ? "'FILL' 1" : undefined }}>favorite</span>
                      {post.likes_count}
                    </button>
                    <button 
                      onClick={() => handleOpenComments(post.post_id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">comment</span>
                      {post.comments_count}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-16 text-center">
         <button onClick={logout} className="px-6 py-2 border border-error/50 text-error rounded-full font-label-md hover:bg-error/10 transition-colors cursor-pointer">
            Log Out
         </button>
      </div>

      {/* MODAL 1: Edit Profile Photo */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <form onSubmit={handleUpdatePhoto} className="bg-white border border-outline-variant p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 relative">
            <button 
              type="button"
              onClick={() => {
                setShowPhotoModal(false);
                setProfilePhotoPreview(null);
              }}
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              close
            </button>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Edit Profile Photo</h3>
            <div className="space-y-4 mb-6">
              {profilePhotoPreview && (
                <div className="flex justify-center mb-4">
                  <img src={profilePhotoPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
                </div>
              )}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer bg-surface hover:bg-surface-container-low transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="material-symbols-outlined text-primary mb-2">upload_file</span>
                    <p className="mb-2 text-xs text-on-surface-variant"><span className="font-bold">Click to upload photo</span></p>
                    <p className="text-[10px] text-outline">PNG, JPG or WEBP (Max 2MB)</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
            {savingPhoto && <div className="text-xs text-primary font-bold animate-pulse text-center mb-4">Updating profile photo...</div>}
            <button 
              type="submit"
              disabled={savingPhoto || !profilePhotoPreview}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-label-md hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              Save Changes
            </button>
          </form>
        </div>
      )}

      {/* MODAL 2: Followers / Following List */}
      {showStatsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-outline-variant p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setShowStatsModal(null)}
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              close
            </button>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-6 capitalize">{showStatsModal}</h3>
            
            <div className="max-h-72 overflow-y-auto space-y-4 pr-2">
              {showStatsModal === 'followers' ? (
                stats.followers.length === 0 ? (
                  <div className="text-center py-6 text-sm text-outline italic">No followers yet.</div>
                ) : (
                  stats.followers.map(f => (
                    <div key={f.user_id} className="flex items-center gap-3">
                      <img src={f.profile_photo_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAr_3abBqL4JjKYx6E46VtyyJM1Na8XT0s1p7UOEZYDVjPGB61J1XXRLs8C7RRkxtEIKT9N_xP-AY_08bG0oP4Wynupp0i4X2DyFdRjLUI7XPH0NIqWNATYPWsSmT77FVQaHoMuPXmMM3Q-fP_qTmLxQ5k3YeXDvOk6jQBwY3IR1nXNGbfsORxvxLkN_iVCEIlfsRkDuo0qyNFhY1mE_ZJm3bvUrKofUzffRqhUTYj8EgK3EvqSWT_xlcK1mZQC0SYam3fXSKtI2uIy"} alt="" className="w-10 h-10 rounded-full object-cover"/>
                      <span className="font-label-md text-sm text-on-surface font-bold">{f.username}</span>
                    </div>
                  ))
                )
              ) : (
                stats.following.length === 0 ? (
                  <div className="text-center py-6 text-sm text-outline italic">Not following anyone yet.</div>
                ) : (
                  stats.following.map(f => (
                    <div key={f.user_id} className="flex items-center gap-3">
                      <img src={f.profile_photo_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAr_3abBqL4JjKYx6E46VtyyJM1Na8XT0s1p7UOEZYDVjPGB61J1XXRLs8C7RRkxtEIKT9N_xP-AY_08bG0oP4Wynupp0i4X2DyFdRjLUI7XPH0NIqWNATYPWsSmT77FVQaHoMuPXmMM3Q-fP_qTmLxQ5k3YeXDvOk6jQBwY3IR1nXNGbfsORxvxLkN_iVCEIlfsRkDuo0qyNFhY1mE_ZJm3bvUrKofUzffRqhUTYj8EgK3EvqSWT_xlcK1mZQC0SYam3fXSKtI2uIy"} alt="" className="w-10 h-10 rounded-full object-cover"/>
                      <span className="font-label-md text-sm text-on-surface font-bold">{f.username}</span>
                    </div>
                  ))
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Create Post */}
      {showCreatePostModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <form onSubmit={handleCreatePost} className="bg-white border border-outline-variant p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 relative">
            <button 
              type="button"
              onClick={() => {
                setShowCreatePostModal(false);
                setPostPhotoPreview(null);
              }}
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              close
            </button>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Create Post</h3>
            <div className="space-y-4 mb-6">
              {postPhotoPreview && (
                <div className="flex justify-center mb-4">
                  <img src={postPhotoPreview} alt="Preview" className="w-full h-48 object-cover rounded-2xl border border-outline-variant" />
                </div>
              )}
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer bg-surface hover:bg-surface-container-low transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <span className="material-symbols-outlined text-primary mb-2">add_photo_alternate</span>
                    <p className="mb-2 text-xs text-on-surface-variant"><span className="font-bold">Select from gallery/files</span></p>
                    <p className="text-[10px] text-outline">PNG, JPG or WEBP (Max 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePostPhotoChange}
                    className="hidden" 
                  />
                </label>
              </div>
              <input 
                type="text" 
                placeholder="Caption (optional)"
                value={postCaption}
                onChange={e => setPostCaption(e.target.value)}
                className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-sm"
              />
            </div>
            {creatingPost && <div className="text-xs text-primary font-bold animate-pulse text-center mb-4">Publishing post...</div>}
            <button 
              type="submit"
              disabled={creatingPost || !postPhotoPreview}
              className="w-full bg-primary text-white py-3.5 rounded-xl font-label-md hover:opacity-95 transition-opacity disabled:opacity-50"
            >
              Post Photo
            </button>
          </form>
        </div>
      )}

      {/* MODAL 4: Post Comments */}
      {showCommentsPostId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white border border-outline-variant p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-full mx-4 relative flex flex-col h-[520px]">
            <button 
              onClick={() => setShowCommentsPostId(null)}
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              close
            </button>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4 flex-shrink-0">Comments</h3>

            <div className="flex-grow overflow-y-auto space-y-4 mb-4 pr-2">
              {loadingComments ? (
                <div className="text-center py-12 text-sm text-outline animate-pulse">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-12 text-sm text-outline italic">No comments yet. Be the first to comment!</div>
              ) : (
                comments.map(c => (
                  <div key={c.comment_id} className="flex items-start gap-3 bg-surface-container-low/30 border border-outline-variant/30 p-3 rounded-2xl">
                    <img src={c.profile_photo_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAr_3abBqL4JjKYx6E46VtyyJM1Na8XT0s1p7UOEZYDVjPGB61J1XXRLs8C7RRkxtEIKT9N_xP-AY_08bG0oP4Wynupp0i4X2DyFdRjLUI7XPH0NIqWNATYPWsSmT77FVQaHoMuPXmMM3Q-fP_qTmLxQ5k3YeXDvOk6jQBwY3IR1nXNGbfsORxvxLkN_iVCEIlfsRkDuo0qyNFhY1mE_ZJm3bvUrKofUzffRqhUTYj8EgK3EvqSWT_xlcK1mZQC0SYam3fXSKtI2uIy"} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0"/>
                    <div className="flex-grow min-w-0">
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
                className="bg-primary text-white px-5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
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
