import React, { useState } from 'react';
import { Star, X, Calendar, Edit3, CheckCircle2 } from 'lucide-react';

export default function RatingModal({ anime, isEditing = false, onClose, onSubmit }) {
  const [rating, setRating] = useState(anime?.rating || 8);
  const [hoverRating, setHoverRating] = useState(0);
  const [startDate, setStartDate] = useState(anime?.start_date ? anime.start_date.slice(0, 10) : '');
  const [completedDate, setCompletedDate] = useState(
    anime?.completed_date ? anime.completed_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState(anime?.notes || '');
  const [removeFromWatchlist, setRemoveFromWatchlist] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        id: anime?.id,
        title: anime?.title || anime?.name,
        name: anime?.title || anime?.name,
        rating: parseInt(rating, 10),
        start_date: startDate || null,
        completed_date: completedDate || null,
        notes: notes || null,
        mal_id: anime?.mal_id || null,
        image_url: anime?.image_url || null,
        remove_from_watchlist: removeFromWatchlist,
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit watched rating:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: 'var(--text-dim)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
          {anime?.image_url && (
            <img
              src={anime.image_url}
              alt={anime.title || anime.name}
              style={{
                width: '60px',
                height: '84px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid var(--border-color)',
              }}
            />
          )}
          <div>
            <span className="badge badge-gold" style={{ marginBottom: '6px' }}>
              {isEditing ? 'Edit Watched Entry' : 'Log as Completed'}
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              {anime?.title || anime?.name}
            </h3>
          </div>
        </div>

        <form onSubmit={handleFormSubmit}>
          {/* Rating 1 - 10 */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Your Personal Score (1 - 10)</span>
              <strong style={{ color: '#fbbf24', fontSize: '1rem' }}>
                {hoverRating || rating} / 10
              </strong>
            </label>
            <div style={{
              display: 'flex',
              gap: '4px',
              background: 'rgba(0,0,0,0.3)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              overflowX: 'auto',
              justifyContent: 'center',
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setRating(score)}
                  onMouseEnter={() => setHoverRating(score)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    flex: 1,
                    minWidth: '30px',
                    height: '34px',
                    borderRadius: '6px',
                    border: 'none',
                    background: (hoverRating || rating) >= score ? '#f59e0b' : 'rgba(255,255,255,0.06)',
                    color: (hoverRating || rating) >= score ? '#000' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Start Date (Optional)</label>
              <div className="input-field-wrapper">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  className="input-field"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Completion Date</label>
              <div className="input-field-wrapper">
                <Calendar size={16} className="input-icon" />
                <input
                  type="date"
                  className="input-field"
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Notes / Thoughts */}
          <div className="form-group">
            <label className="form-label">Personal Review / Notes</label>
            <div className="input-field-wrapper">
              <textarea
                className="input-field"
                style={{ height: '80px', paddingLeft: '14px', paddingTop: '10px', resize: 'vertical' }}
                placeholder="What did you think of the ending, animation, or characters?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Auto remove from watchlist toggle (when adding new) */}
          {!isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="removeFromWatchlist"
                checked={removeFromWatchlist}
                onChange={(e) => setRemoveFromWatchlist(e.target.checked)}
                style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <label htmlFor="removeFromWatchlist" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Remove from Watchlist if already present
              </label>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="spinner" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>{isEditing ? 'Update Rating' : 'Save to Watched List'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
