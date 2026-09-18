import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { animeApi, watchlistApi, watchedApi } from '../services/api';
import RatingModal from './RatingModal';
import {
  Search,
  Bookmark,
  CheckCircle2,
  Star,
  LogOut,
  Trash2,
  Plus,
  Flame,
  Calendar,
  Layers,
  Sparkles,
  Edit2,
  Tv,
  Check,
  AlertCircle,
  Filter,
  Tag,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Radio,
  X
} from 'lucide-react';

const GENRE_OPTIONS = [
  'All Genres',
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Fantasy',
  'Romance',
  'Sci-Fi',
  'Supernatural',
  'Mystery',
  'Shounen',
  'Slice of Life',
  'Horror',
  'Sports'
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'watchlist' | 'watched'

  // Data States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Live Dynamic Trending Anime from Jikan API
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Live Ongoing Season Anime from Jikan API with Pagination
  const [ongoingAnime, setOngoingAnime] = useState([]);
  const [ongoingPage, setOngoingPage] = useState(1);
  const [ongoingPagination, setOngoingPagination] = useState({
    current_page: 1,
    has_next_page: false,
    last_visible_page: 1,
    total_items: 0,
  });
  const [loadingOngoing, setLoadingOngoing] = useState(false);

  const [watchlist, setWatchlist] = useState([]);
  const [watchedList, setWatchedList] = useState([]);
  const [watchedSort, setWatchedSort] = useState('recent');
  const [loadingLists, setLoadingLists] = useState(false);

  // In-list filters
  const [watchlistSearch, setWatchlistSearch] = useState('');
  const [watchlistGenre, setWatchlistGenre] = useState('All Genres');

  const [watchedSearch, setWatchedSearch] = useState('');
  const [watchedGenre, setWatchedGenre] = useState('All Genres');

  // Modal State
  const [selectedAnimeForRating, setSelectedAnimeForRating] = useState(null);
  const [isEditingWatched, setIsEditingWatched] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Live Trending Anime from Jikan/Kitsu API
  useEffect(() => {
    const fetchTrending = async () => {
      setLoadingTrending(true);
      try {
        const res = await animeApi.getTrending(5);
        setTrendingAnime(res.data.data || []);
      } catch (err) {
        console.error('Failed to load trending anime:', err);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrending();
  }, []);

  // Fetch Live Ongoing Anime with Pagination
  const fetchOngoing = async (page = 1) => {
    setLoadingOngoing(true);
    try {
      const res = await animeApi.getOngoing(page, 8);
      setOngoingAnime(res.data.data || []);
      if (res.data.pagination) {
        setOngoingPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load ongoing anime:', err);
    } finally {
      setLoadingOngoing(false);
    }
  };

  useEffect(() => {
    fetchOngoing(ongoingPage);
  }, [ongoingPage]);


  // Load Watchlist & Watched Lists
  const fetchUserData = async () => {
    setLoadingLists(true);
    try {
      const [wlRes, wRes] = await Promise.all([
        watchlistApi.getWatchlist(),
        watchedApi.getWatched(watchedSort),
      ]);
      setWatchlist(wlRes.data.data || []);
      setWatchedList(wRes.data.data || []);
    } catch (error) {
      console.error('Error fetching user lists:', error);
      showToast('Failed to load your lists', 'error');
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [watchedSort]);

  // Search Anime Handler
  const handleSearch = async (queryToSearch) => {
    const q = queryToSearch !== undefined ? queryToSearch : searchQuery;
    if (!q || !q.trim()) return;

    setSearching(true);
    setHasSearched(true);
    try {
      const res = await animeApi.search(q, 12);
      setSearchResults(res.data.data || []);
    } catch (error) {
      console.error('Search failed:', error);
      showToast('Search error. External anime service might be busy.', 'error');
    } finally {
      setSearching(false);
    }
  };

  // Add to Watchlist
  const handleAddToWatchlist = async (anime) => {
    try {
      const genre = anime.genre || (Array.isArray(anime.genres) ? anime.genres.join(', ') : null);
      const description = anime.description || anime.synopsis || null;

      await watchlistApi.addToWatchlist({
        name: anime.title || anime.name,
        image_url: anime.image_url,
        mal_id: anime.mal_id,
        genre,
        description,
      });
      showToast(`Added "${anime.title || anime.name}" to your Watchlist!`);
      fetchUserData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Could not add to Watchlist';
      showToast(msg, 'error');
    }
  };

  // Remove from Watchlist
  const handleRemoveFromWatchlist = async (id, title) => {
    try {
      await watchlistApi.removeFromWatchlist(id);
      showToast(`Removed from Watchlist`);
      setWatchlist((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      showToast('Failed to remove item', 'error');
    }
  };

  // Submit Watched (Add or Update)
  const handleWatchedSubmit = async (payload) => {
    try {
      if (isEditingWatched) {
        await watchedApi.updateWatched(payload.id, {
          rating: payload.rating,
          notes: payload.notes,
          start_date: payload.start_date,
          completed_date: payload.completed_date,
          genre: payload.genre,
          description: payload.description,
        });
        showToast(`Updated "${payload.title}" rating & review!`);
      } else {
        await watchedApi.addToWatched(payload);
        showToast(`Logged "${payload.title}" as Watched!`);
      }
      fetchUserData();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save watched anime';
      showToast(msg, 'error');
    }
  };

  // Delete from Watched
  const handleDeleteWatched = async (id) => {
    try {
      await watchedApi.deleteWatched(id);
      showToast('Removed from Watched list');
      setWatchedList((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      showToast('Failed to delete item', 'error');
    }
  };

  // Filtered Watchlist items
  const filteredWatchlist = useMemo(() => {
    return watchlist.filter((item) => {
      const matchesSearch = !watchlistSearch || 
        item.name?.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
        item.genre?.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(watchlistSearch.toLowerCase());
      
      const matchesGenre = watchlistGenre === 'All Genres' || 
        item.genre?.toLowerCase().includes(watchlistGenre.toLowerCase());

      return matchesSearch && matchesGenre;
    });
  }, [watchlist, watchlistSearch, watchlistGenre]);

  // Filtered Watched items
  const filteredWatched = useMemo(() => {
    return watchedList.filter((item) => {
      const matchesSearch = !watchedSearch || 
        item.title?.toLowerCase().includes(watchedSearch.toLowerCase()) ||
        item.genre?.toLowerCase().includes(watchedSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(watchedSearch.toLowerCase()) ||
        item.notes?.toLowerCase().includes(watchedSearch.toLowerCase());

      const matchesGenre = watchedGenre === 'All Genres' || 
        item.genre?.toLowerCase().includes(watchedGenre.toLowerCase());

      return matchesSearch && matchesGenre;
    });
  }, [watchedList, watchedSearch, watchedGenre]);

  // Check if anime is in list helper
  const isInWatchlist = (malId, name) => {
    return watchlist.some((item) => (malId && item.mal_id === malId) || item.name?.toLowerCase() === name?.toLowerCase());
  };

  const isWatched = (malId, title) => {
    return watchedList.some((item) => (malId && item.mal_id === malId) || item.title?.toLowerCase() === title?.toLowerCase());
  };

  // Stats
  const avgRating = watchedList.length > 0 
    ? (watchedList.reduce((acc, curr) => acc + (curr.rating || 0), 0) / watchedList.length).toFixed(1)
    : '0.0';

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 2000,
            maxWidth: '380px',
          }}
          className={`alert-box ${toast.type === 'error' ? 'alert-error' : 'alert-success'}`}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header style={{
        background: 'rgba(9, 12, 21, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}>
              🎌
            </div>
            <div>
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                AniVault
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Personal Anime Hub</p>
            </div>
          </div>

          {/* User Section & Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                color: '#fff',
              }}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{user?.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{user?.email}</p>
              </div>
            </div>

            <button onClick={logout} className="btn btn-secondary btn-sm" title="Sign Out">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 24px', width: '100%', flexGrow: 1 }}>
        {/* Top Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}>
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <Bookmark size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Watchlist</p>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{watchlist.length}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Completed</p>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{watchedList.length}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)' }}>
              <Star size={24} />
            </div>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Score</p>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>{avgRating} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 500 }}>/ 10</span></h3>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
        }}>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'search' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeTab === 'search' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'search' ? '2px solid var(--primary)' : '2px solid transparent',
            }}
          >
            <Search size={18} />
            <span>Search & Discover</span>
          </button>

          <button
            onClick={() => setActiveTab('watchlist')}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'watchlist' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeTab === 'watchlist' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'watchlist' ? '2px solid var(--primary)' : '2px solid transparent',
            }}
          >
            <Bookmark size={18} />
            <span>My Watchlist ({watchlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('watched')}
            style={{
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: activeTab === 'watched' ? 'rgba(99,102,241,0.2)' : 'transparent',
              color: activeTab === 'watched' ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              borderBottom: activeTab === 'watched' ? '2px solid var(--primary)' : '2px solid transparent',
            }}
          >
            <CheckCircle2 size={18} />
            <span>Completed / Watched ({watchedList.length})</span>
          </button>
        </div>

        {/* TAB 1: Search & Discover */}
        {activeTab === 'search' && (
          <div>
            {/* Search Bar */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              style={{ display: 'flex', gap: '12px', maxWidth: '680px', marginBottom: '28px' }}
            >
              <div className="input-field-wrapper" style={{ flexGrow: 1 }}>
                <Search size={18} className="input-icon" />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Search any anime (e.g. Demon Slayer, Solo Leveling, One Piece)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setHasSearched(false);
                      setSearchResults([]);
                    }}
                    className="input-action-btn"
                    title="Clear query"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="btn btn-primary" disabled={searching}>
                {searching ? <div className="spinner" /> : <Search size={18} />}
                <span>Search</span>
              </button>
              {hasSearched && (
                <button
                  type="button"
                  onClick={() => {
                    setHasSearched(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="btn btn-secondary"
                  title="Return to Discover & Ongoing"
                >
                  Discover
                </button>
              )}
            </form>

            {/* Search Results Grid */}
            {searching ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Searching external Anime database...</p>
              </div>
            ) : !hasSearched ? (
              <div>
                {/* 1. Popular / Top Trending Section */}
                <div className="glass-panel" style={{ padding: '36px 24px', textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }} className="badge badge-gold">
                    <Flame size={14} /> Live Top Trending Anime
                  </div>
                  <h3 style={{ fontSize: '1.45rem', color: '#fff', marginBottom: '8px', fontWeight: 800 }}>
                    Popular Anime
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '540px', margin: '0 auto 24px' }}>
                    Search for any title above or tap one of the live top 5 trending anime below fetched directly from the database:
                  </p>

                  {loadingTrending ? (
                    <div style={{ padding: '20px 0' }}>
                      <div className="spinner" style={{ margin: '0 auto 10px' }} />
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Loading trending anime...</p>
                    </div>
                  ) : trendingAnime.length > 0 ? (
                    <div>
                      {/* Top 5 Trending Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '28px' }}>
                        {trendingAnime.slice(0, 5).map((anime, idx) => (
                          <button
                            key={anime.mal_id || anime.title}
                            type="button"
                            onClick={() => {
                              setSearchQuery(anime.title);
                              handleSearch(anime.title);
                            }}
                            className="btn btn-secondary btn-sm"
                            style={{
                              borderRadius: '9999px',
                              fontSize: '0.85rem',
                              padding: '8px 16px',
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.12)',
                            }}
                          >
                            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>#{idx + 1}</span> {anime.title}
                          </button>
                        ))}
                      </div>

                      {/* Top 5 Trending Poster Cards Preview */}
                      <div className="anime-grid">
                        {trendingAnime.slice(0, 5).map((anime) => {
                          const onWatchlist = isInWatchlist(anime.mal_id, anime.title);
                          const isAlreadyWatched = isWatched(anime.mal_id, anime.title);
                          const genreString = anime.genre || (Array.isArray(anime.genres) ? anime.genres.slice(0, 3).join(', ') : '');

                          return (
                            <div key={anime.mal_id || anime.title} className="anime-card" style={{ textAlign: 'left' }}>
                              <div className="poster-container">
                                {anime.image_url ? (
                                  <img src={anime.image_url} alt={anime.title} className="poster-img" loading="lazy" />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                                    No Cover
                                  </div>
                                )}
                                <div className="poster-overlay" />
                                {anime.rating > 0 && (
                                  <div className="poster-rating">
                                    <Star size={12} fill="#fbbf24" />
                                    <span>{anime.rating}</span>
                                  </div>
                                )}
                              </div>

                              <div className="anime-card-content">
                                <div>
                                  <h4 className="anime-title" title={anime.title}>{anime.title}</h4>
                                  <p className="anime-meta">
                                    {anime.episodes ? `${anime.episodes} Episodes` : 'Series'} • Trending
                                  </p>
                                  {genreString && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                                      {genreString.split(',').slice(0, 2).map((g) => (
                                        <span key={g} style={{
                                          fontSize: '0.7rem',
                                          background: 'rgba(99,102,241,0.15)',
                                          color: '#a5b4fc',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontWeight: 600,
                                        }}>
                                          {g.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {anime.synopsis && (
                                    <p style={{
                                      fontSize: '0.78rem',
                                      color: 'var(--text-dim)',
                                      lineHeight: '1.35',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      marginBottom: '10px',
                                    }}>
                                      {anime.synopsis}
                                    </p>
                                  )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                  <button
                                    onClick={() => handleAddToWatchlist(anime)}
                                    disabled={onWatchlist || isAlreadyWatched}
                                    className={`btn btn-sm ${onWatchlist ? 'btn-secondary' : 'btn-primary'}`}
                                  >
                                    <Bookmark size={14} />
                                    <span>{onWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedAnimeForRating(anime);
                                      setIsEditingWatched(false);
                                    }}
                                    className={`btn btn-sm ${isAlreadyWatched ? 'btn-secondary' : 'btn-cyan'}`}
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>{isAlreadyWatched ? 'Watched' : 'Mark Watched'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* 2. Ongoing Anime Section with Pagination */}
                <div style={{ marginTop: '36px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: 'rgba(6, 182, 212, 0.15)',
                        border: '1px solid rgba(6, 182, 212, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--cyan)'
                      }}>
                        <Radio size={22} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                            Ongoing
                          </h2>
                          <div className="badge badge-cyan" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                            <div className="pulse-dot" style={{ marginRight: '4px' }} /> Airing Now
                          </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                          Currently broadcasting anime from the ongoing season (Live Jikan API)
                        </p>
                      </div>
                    </div>

                    {ongoingPagination.last_visible_page ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        Page <span style={{ color: '#fff', fontWeight: 700 }}>{ongoingPage}</span> of <span style={{ color: '#fff', fontWeight: 700 }}>{ongoingPagination.last_visible_page}</span>
                      </div>
                    ) : null}
                  </div>

                  {loadingOngoing ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                      <div className="spinner" style={{ margin: '0 auto 16px', width: '32px', height: '32px' }} />
                      <p style={{ color: 'var(--text-muted)' }}>Loading ongoing anime for page {ongoingPage}...</p>
                    </div>
                  ) : ongoingAnime.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                      <Tv size={36} style={{ color: 'var(--text-dim)', marginBottom: '10px' }} />
                      <p style={{ color: 'var(--text-muted)' }}>No ongoing anime found at this moment.</p>
                    </div>
                  ) : (
                    <>
                      <div className="anime-grid">
                        {ongoingAnime.map((anime) => {
                          const onWatchlist = isInWatchlist(anime.mal_id, anime.title);
                          const isAlreadyWatched = isWatched(anime.mal_id, anime.title);
                          const genreString = anime.genre || (Array.isArray(anime.genres) ? anime.genres.slice(0, 3).join(', ') : '');

                          return (
                            <div key={anime.mal_id || anime.title} className="anime-card">
                              <div className="poster-container">
                                {anime.image_url ? (
                                  <img src={anime.image_url} alt={anime.title} className="poster-img" loading="lazy" />
                                ) : (
                                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                                    No Cover
                                  </div>
                                )}
                                <div className="poster-overlay" />
                                <div style={{
                                  position: 'absolute',
                                  top: '10px',
                                  left: '10px',
                                  background: 'rgba(6, 182, 212, 0.9)',
                                  backdropFilter: 'blur(6px)',
                                  color: '#fff',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}>
                                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />
                                  Airing
                                </div>
                                {anime.rating > 0 && (
                                  <div className="poster-rating">
                                    <Star size={12} fill="#fbbf24" />
                                    <span>{anime.rating}</span>
                                  </div>
                                )}
                              </div>

                              <div className="anime-card-content">
                                <div>
                                  <h4 className="anime-title" title={anime.title}>{anime.title}</h4>
                                  <p className="anime-meta">
                                    {anime.episodes ? `${anime.episodes} Episodes` : 'Ongoing Series'} • {anime.year || 'Current Season'}
                                  </p>
                                  {genreString && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                                      {genreString.split(',').slice(0, 2).map((g) => (
                                        <span key={g} style={{
                                          fontSize: '0.7rem',
                                          background: 'rgba(6, 182, 212, 0.15)',
                                          color: '#67e8f9',
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          fontWeight: 600,
                                        }}>
                                          {g.trim()}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {anime.synopsis && (
                                    <p style={{
                                      fontSize: '0.78rem',
                                      color: 'var(--text-dim)',
                                      lineHeight: '1.35',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      marginBottom: '10px',
                                    }}>
                                      {anime.synopsis}
                                    </p>
                                  )}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                                  <button
                                    onClick={() => handleAddToWatchlist(anime)}
                                    disabled={onWatchlist || isAlreadyWatched}
                                    className={`btn btn-sm ${onWatchlist ? 'btn-secondary' : 'btn-primary'}`}
                                  >
                                    <Bookmark size={14} />
                                    <span>{onWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedAnimeForRating(anime);
                                      setIsEditingWatched(false);
                                    }}
                                    className={`btn btn-sm ${isAlreadyWatched ? 'btn-secondary' : 'btn-cyan'}`}
                                  >
                                    <CheckCircle2 size={14} />
                                    <span>{isAlreadyWatched ? 'Watched' : 'Mark Watched'}</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Pagination Controls */}
                      <div className="pagination-container">
                        <button
                          type="button"
                          onClick={() => {
                            setOngoingPage((p) => Math.max(1, p - 1));
                          }}
                          disabled={ongoingPage <= 1 || loadingOngoing}
                          className="pagination-btn"
                          title="Previous Page"
                        >
                          <ChevronLeft size={16} />
                          <span>Prev</span>
                        </button>

                        {/* Direct Page Jump Buttons */}
                        {(() => {
                          const totalPages = ongoingPagination.last_visible_page || 1;
                          const pages = [];
                          const start = Math.max(1, ongoingPage - 2);
                          const end = Math.min(totalPages, ongoingPage + 2);

                          for (let i = start; i <= end; i++) {
                            pages.push(
                              <button
                                key={i}
                                type="button"
                                onClick={() => setOngoingPage(i)}
                                disabled={loadingOngoing}
                                className={`pagination-btn ${ongoingPage === i ? 'active' : ''}`}
                              >
                                {i}
                              </button>
                            );
                          }
                          return pages;
                        })()}

                        <button
                          type="button"
                          onClick={() => {
                            setOngoingPage((p) => p + 1);
                          }}
                          disabled={!ongoingPagination.has_next_page || loadingOngoing}
                          className="pagination-btn"
                          title="Next Page"
                        >
                          <span>Next</span>
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
                <Tv size={40} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '6px' }}>No Anime Found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Try searching for a different anime title or check spelling.</p>
                <button
                  onClick={() => {
                    setHasSearched(false);
                    setSearchQuery('');
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  Return to Popular & Ongoing
                </button>
              </div>
            ) : (
              <div className="anime-grid">
                {searchResults.map((anime) => {
                  const onWatchlist = isInWatchlist(anime.mal_id, anime.title);
                  const isAlreadyWatched = isWatched(anime.mal_id, anime.title);
                  const genreString = anime.genre || (Array.isArray(anime.genres) ? anime.genres.slice(0, 3).join(', ') : '');

                  return (
                    <div key={anime.mal_id || anime.title} className="anime-card">
                      <div className="poster-container">
                        {anime.image_url ? (
                          <img src={anime.image_url} alt={anime.title} className="poster-img" loading="lazy" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                            No Cover
                          </div>
                        )}
                        <div className="poster-overlay" />
                        {anime.rating > 0 && (
                          <div className="poster-rating">
                            <Star size={12} fill="#fbbf24" />
                            <span>{anime.rating}</span>
                          </div>
                        )}
                      </div>

                      <div className="anime-card-content">
                        <div>
                          <h4 className="anime-title" title={anime.title}>{anime.title}</h4>
                          <p className="anime-meta">
                            {anime.episodes ? `${anime.episodes} Episodes` : 'Series'} • {anime.year || 'Anime'}
                          </p>
                          {genreString && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                              {genreString.split(',').slice(0, 2).map((g) => (
                                <span key={g} style={{
                                  fontSize: '0.7rem',
                                  background: 'rgba(99,102,241,0.15)',
                                  color: '#a5b4fc',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: 600,
                                }}>
                                  {g.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                          {anime.synopsis && (
                            <p style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-dim)',
                              lineHeight: '1.35',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              marginBottom: '10px',
                            }}>
                              {anime.synopsis}
                            </p>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                          <button
                            onClick={() => handleAddToWatchlist(anime)}
                            disabled={onWatchlist || isAlreadyWatched}
                            className={`btn btn-sm ${onWatchlist ? 'btn-secondary' : 'btn-primary'}`}
                          >
                            <Bookmark size={14} />
                            <span>{onWatchlist ? 'In Watchlist' : 'Add to Watchlist'}</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedAnimeForRating(anime);
                              setIsEditingWatched(false);
                            }}
                            className={`btn btn-sm ${isAlreadyWatched ? 'btn-secondary' : 'btn-cyan'}`}
                          >
                            <CheckCircle2 size={14} />
                            <span>{isAlreadyWatched ? 'Watched' : 'Mark Watched'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: My Watchlist */}
        {activeTab === 'watchlist' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>My Watchlist</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Anime you are planning or eager to watch.</p>
              </div>

              {/* In-List Search & Filter Controls */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="input-field-wrapper" style={{ width: '220px' }}>
                  <Search size={15} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: '7px 10px 7px 34px', fontSize: '0.85rem' }}
                    placeholder="Filter watchlist..."
                    value={watchlistSearch}
                    onChange={(e) => setWatchlistSearch(e.target.value)}
                  />
                </div>

                <select
                  value={watchlistGenre}
                  onChange={(e) => setWatchlistGenre(e.target.value)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <button onClick={() => setActiveTab('search')} className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Search & Add</span>
                </button>
              </div>
            </div>

            {watchlist.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <Bookmark size={48} style={{ color: 'var(--text-dim)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>Your Watchlist is Empty</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
                  Search for anime titles you want to watch and add them to your personalized vault.
                </p>
                <button onClick={() => setActiveTab('search')} className="btn btn-primary">
                  <Search size={18} />
                  <span>Discover Anime Now</span>
                </button>
              </div>
            ) : filteredWatchlist.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Filter size={36} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px' }}>No Matching Watchlist Items</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No anime match your filter or search query.</p>
              </div>
            ) : (
              <div className="anime-grid">
                {filteredWatchlist.map((item) => (
                  <div key={item.id} className="anime-card">
                    <div className="poster-container">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="poster-img" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                          No Cover
                        </div>
                      )}
                      <div className="poster-overlay" />
                    </div>

                    <div className="anime-card-content">
                      <div>
                        <h4 className="anime-title" title={item.name}>{item.name}</h4>
                        <p className="anime-meta">
                          Added {new Date(item.created_at).toLocaleDateString()}
                        </p>

                        {item.genre && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                            {item.genre.split(',').slice(0, 2).map((g) => (
                              <span key={g} style={{
                                fontSize: '0.7rem',
                                background: 'rgba(99,102,241,0.15)',
                                color: '#a5b4fc',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}>
                                {g.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.description && (
                          <p style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-dim)',
                            lineHeight: '1.35',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            marginBottom: '10px',
                          }}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            setSelectedAnimeForRating(item);
                            setIsEditingWatched(false);
                          }}
                          className="btn btn-cyan btn-sm"
                          style={{ flex: 1 }}
                        >
                          <CheckCircle2 size={14} />
                          <span>Complete</span>
                        </button>

                        <button
                          onClick={() => handleRemoveFromWatchlist(item.id, item.name)}
                          className="btn btn-danger btn-sm"
                          title="Remove from Watchlist"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Completed / Watched List */}
        {activeTab === 'watched' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>Completed Anime</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Your logged anime journeys, personal ratings, and notes.</p>
              </div>

              {/* In-List Search, Genre, and Sorting Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div className="input-field-wrapper" style={{ width: '200px' }}>
                  <Search size={15} className="input-icon" />
                  <input
                    type="text"
                    className="input-field"
                    style={{ padding: '7px 10px 7px 34px', fontSize: '0.85rem' }}
                    placeholder="Search completed..."
                    value={watchedSearch}
                    onChange={(e) => setWatchedSearch(e.target.value)}
                  />
                </div>

                <select
                  value={watchedGenre}
                  onChange={(e) => setWatchedGenre(e.target.value)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {GENRE_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>

                <select
                  value={watchedSort}
                  onChange={(e) => setWatchedSort(e.target.value)}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    padding: '7px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="recent">Recently Completed</option>
                  <option value="rating_desc">Highest Rating (10 → 1)</option>
                  <option value="rating_asc">Lowest Rating (1 → 10)</option>
                  <option value="title">Title (A - Z)</option>
                </select>
              </div>
            </div>

            {watchedList.length === 0 ? (
              <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--text-dim)', marginBottom: '16px' }} />
                <h3 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '8px' }}>No Completed Anime Logged</h3>
                <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
                  Finished watching a series? Mark it as watched, rate it, and add your personal thoughts!
                </p>
                <button onClick={() => setActiveTab('search')} className="btn btn-primary">
                  <Search size={18} />
                  <span>Search Anime to Log</span>
                </button>
              </div>
            ) : filteredWatched.length === 0 ? (
              <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <Filter size={36} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.15rem', color: '#fff', marginBottom: '6px' }}>No Matching Completed Anime</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No anime match your filter or search query.</p>
              </div>
            ) : (
              <div className="anime-grid">
                {filteredWatched.map((item) => (
                  <div key={item.id} className="anime-card">
                    <div className="poster-container">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.title} className="poster-img" />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                          No Cover
                        </div>
                      )}
                      <div className="poster-overlay" />
                      <div className="poster-rating">
                        <Star size={12} fill="#fbbf24" />
                        <span>{item.rating} / 10</span>
                      </div>
                    </div>

                    <div className="anime-card-content">
                      <div>
                        <h4 className="anime-title" title={item.title}>{item.title}</h4>
                        <p className="anime-meta">
                          Finished {item.completed_date ? new Date(item.completed_date).toLocaleDateString() : 'Completed'}
                        </p>

                        {item.genre && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                            {item.genre.split(',').slice(0, 2).map((g) => (
                              <span key={g} style={{
                                fontSize: '0.7rem',
                                background: 'rgba(99,102,241,0.15)',
                                color: '#a5b4fc',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 600,
                              }}>
                                {g.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.description && (
                          <p style={{
                            fontSize: '0.78rem',
                            color: 'var(--text-dim)',
                            lineHeight: '1.35',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            marginBottom: '8px',
                          }}>
                            {item.description}
                          </p>
                        )}

                        {item.notes && (
                          <div style={{
                            background: 'rgba(0,0,0,0.35)',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            fontStyle: 'italic',
                            lineHeight: 1.4,
                            marginBottom: '10px',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            "{item.notes}"
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            setSelectedAnimeForRating(item);
                            setIsEditingWatched(true);
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ flex: 1 }}
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteWatched(item.id)}
                          className="btn btn-danger btn-sm"
                          title="Delete from Watched"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Rating & Review Modal */}
      {selectedAnimeForRating && (
        <RatingModal
          anime={selectedAnimeForRating}
          isEditing={isEditingWatched}
          onClose={() => setSelectedAnimeForRating(null)}
          onSubmit={handleWatchedSubmit}
        />
      )}
    </div>
  );
}
