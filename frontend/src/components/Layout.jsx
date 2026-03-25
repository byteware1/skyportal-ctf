import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/labs', icon: '⬢', label: 'Labs' },
  { to: '/leaderboard', icon: '◈', label: 'Leaderboard' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 220,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        overflow: 'hidden'
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '24px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between'
        }}>
          {!collapsed && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>SKY</span>
              <span style={{ color: 'var(--text2)' }}>PORTAL</span>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            cursor: 'pointer', fontSize: '1rem', padding: 4,
            display: 'flex', alignItems: 'center'
          }}>
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 8px' }}>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius)',
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                border: isActive ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
                textDecoration: 'none',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: 1,
                transition: 'all var(--transition)',
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              })}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && item.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '12px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius)',
                color: isActive ? 'var(--orange)' : 'var(--text3)',
                background: isActive ? 'rgba(255,140,0,0.1)' : 'transparent',
                border: isActive ? '1px solid rgba(255,140,0,0.3)' : '1px solid transparent',
                textDecoration: 'none',
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                fontSize: '0.95rem',
                letterSpacing: 1,
                transition: 'all var(--transition)',
                marginBottom: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              })}
            >
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚙</span>
              {!collapsed && 'Admin'}
            </NavLink>
          )}
        </nav>

        {/* User section */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: collapsed ? '16px 8px' : '16px',
        }}>
          {!collapsed && (
            <div style={{ marginBottom: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: 'var(--bg2)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--purple))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 'bold', color: '#000',
                  flexShrink: 0
                }}>
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.username}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
                    {user?.role === 'admin' ? '⚡ ADMIN' : '◉ HACKER'}
                  </div>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: collapsed ? '10px 0' : '8px 12px',
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text3)',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              fontSize: '0.85rem',
              letterSpacing: 1,
              transition: 'all var(--transition)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--red)'; e.target.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--text3)'; }}
          >
            <span>⏻</span>
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: collapsed ? 64 : 220,
        transition: 'margin-left 0.2s ease',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Outlet />
      </main>
    </div>
  );
}
