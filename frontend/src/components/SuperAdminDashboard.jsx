import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import {
  Shield,
  Users,
  UserCheck,
  UserX,
  Activity,
  KeyRound,
  Power,
  RefreshCw,
  Search,
  LogOut,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, inactiveUsers: 0, totalLogins: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [toastMessage, setToastMessage] = useState(null);

  // Password Modal state
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers(),
        adminApi.getStats()
      ]);
      if (usersRes.data?.data) {
        setUsers(usersRes.data.data);
      }
      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
      showToast(err.response?.data?.message || 'Failed to load user management data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (targetUser) => {
    const nextStatus = !targetUser.is_active;
    try {
      const res = await adminApi.updateStatus(targetUser.id, nextStatus);
      showToast(res.data?.message || `User status updated successfully`);
      setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_active: nextStatus } : u));
      // Refresh stats
      const statsRes = await adminApi.getStats();
      if (statsRes.data?.data) setStats(statsRes.data.data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update user status', 'error');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'error');
      return;
    }
    setUpdatingPassword(true);
    try {
      const res = await adminApi.updatePassword(passwordModalUser.id, newPassword);
      showToast(res.data?.message || 'Password updated in database successfully!');
      setPasswordModalUser(null);
      setNewPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id.toString().includes(searchQuery);

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return u.is_active;
    if (statusFilter === 'inactive') return !u.is_active;
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Never logged in';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? '#ef4444' : '#10b981',
          color: '#fff',
          padding: '12px 20px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          fontWeight: 600,
          fontSize: '0.9rem',
          animation: 'slideIn 0.25s ease'
        }}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="header" style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.25)', background: '#0b0d14' }}>
        <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)'
          }}>
            <Shield size={22} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 className="logo-text" style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>AniVault</h1>
              <span style={{
                background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Super Admin
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>User Monitoring & Access Control</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.04)',
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#8b5cf6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#fff'
            }}>
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#a78bfa' }}>{user?.email}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderColor: 'rgba(239, 68, 68, 0.3)',
              color: '#f87171'
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Metric Cards Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          {/* Total Users */}
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={26} color="#a78bfa" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total Registered Users</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{stats.totalUsers}</div>
            </div>
          </div>

          {/* Active Users */}
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserCheck size={26} color="#34d399" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Active Accounts</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{stats.activeUsers}</div>
            </div>
          </div>

          {/* Inactive Users */}
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserX size={26} color="#f87171" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Deactivated Accounts</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stats.inactiveUsers > 0 ? '#f87171' : 'var(--text-dim)' }}>
                {stats.inactiveUsers}
              </div>
            </div>
          </div>

          {/* Total Logins */}
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Activity size={26} color="#22d3ee" />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Total User Logins Logged</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22d3ee' }}>{stats.totalLogins}</div>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
        }}>
          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                User Monitoring & Access Management
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Track login sessions, manage MySQL passwords, and toggle active status.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Search Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '6px 12px',
                gap: '8px',
                minWidth: '240px'
              }}>
                <Search size={16} color="var(--text-dim)" />
                <input
                  type="text"
                  placeholder="Search user, email, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '0.85rem',
                    width: '100%'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div style={{
                display: 'flex',
                background: 'rgba(0,0,0,0.35)',
                padding: '3px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                {['all', 'active', 'inactive'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: statusFilter === filter ? 'var(--primary)' : 'transparent',
                      color: statusFilter === filter ? '#fff' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={loadData}
                disabled={loading}
                className="btn btn-secondary"
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Refresh user data"
              >
                <RefreshCw size={15} className={loading ? 'spinner' : ''} />
                <span style={{ fontSize: '0.85rem' }}>Refresh</span>
              </button>
            </div>
          </div>

          {/* User Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="spinner" style={{ width: '36px', height: '36px', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading user registry from database...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>No matching users found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.85rem'
              }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    fontSize: '0.72rem',
                    letterSpacing: '0.5px'
                  }}>
                    <th style={{ padding: '12px 16px' }}>User</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Total Logins</th>
                    <th style={{ padding: '12px 16px' }}>Last Logged In</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* User Column */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: u.role === 'superadmin' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : '#1e293b',
                            border: '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#fff',
                            fontSize: '0.85rem'
                          }}>
                            {u.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>ID #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      {/* Email Column */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                        {u.email}
                      </td>

                      {/* Role Column */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: u.role === 'superadmin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.06)',
                          color: u.role === 'superadmin' ? '#c084fc' : 'var(--text-muted)',
                          border: u.role === 'superadmin' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-color)'
                        }}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: u.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: u.is_active ? '#34d399' : '#f87171',
                          border: u.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: u.is_active ? '#34d399' : '#f87171'
                          }} />
                          {u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                        </span>
                      </td>

                      {/* Login Count Column */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Activity size={14} color="#22d3ee" />
                          <span style={{ fontWeight: 700, color: '#fff' }}>{u.login_count}</span>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>logins</span>
                        </div>
                      </td>

                      {/* Last Login Column */}
                      <td style={{ padding: '14px 16px', color: u.last_login ? '#e2e8f0' : 'var(--text-dim)' }}>
                        {formatDate(u.last_login)}
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {/* Change Password Button */}
                          <button
                            onClick={() => {
                              setPasswordModalUser(u);
                              setNewPassword('');
                            }}
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              borderColor: 'rgba(139, 92, 246, 0.3)',
                              color: '#c084fc'
                            }}
                            title="Update user password in MySQL database"
                          >
                            <KeyRound size={13} />
                            <span>Change Password</span>
                          </button>

                          {/* Toggle Active / Inactive Button */}
                          {u.role !== 'superadmin' && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              className="btn btn-secondary"
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                borderColor: u.is_active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                                color: u.is_active ? '#f87171' : '#34d399'
                              }}
                              title={u.is_active ? 'Deactivate account (block logins)' : 'Activate account'}
                            >
                              <Power size={13} />
                              <span>{u.is_active ? 'Deactivate' : 'Activate'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Change Password Modal */}
      {passwordModalUser && (
        <div className="modal-backdrop" onClick={() => setPasswordModalUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <button
              onClick={() => setPasswordModalUser(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(139, 92, 246, 0.15)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Lock size={20} color="#c084fc" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Change User Password
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  {passwordModalUser.name} ({passwordModalUser.email})
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>New Password</label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#a78bfa',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Auto Generate</span>
                  </button>
                </div>

                <div className="input-field-wrapper" style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{ paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                marginBottom: '20px'
              }}>
                <span style={{ color: '#c084fc', fontWeight: 600 }}>MySQL DB Update:</span> This will hash the password with bcrypt and update the record for User ID #{passwordModalUser.id} in the database immediately.
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPasswordModalUser(null)}
                  disabled={updatingPassword}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updatingPassword || newPassword.length < 6}
                >
                  {updatingPassword ? (
                    <>
                      <div className="spinner" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={15} />
                      <span>Save New Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
