import React, { useState } from 'react';
import { PageRoute, User } from '../types.js';
import { Menu, X, Sun, Moon, LogIn, Command, LayoutDashboard, LogOut, ShieldCheck, FileText, UserCog, Loader2, Eye, EyeOff, Save } from 'lucide-react';

interface NavbarProps {
  currentRoute: PageRoute;
  user: User | null;
  token: string | null;
  onLogout: () => void;
  onProfileUpdated: (user: User) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function Navbar({ currentRoute, user, token, onLogout, onProfileUpdated, darkMode, setDarkMode }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [showProfilePassword, setShowProfilePassword] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  const openProfileModal = () => {
    setProfileName(user?.name || '');
    setProfilePhone(user?.phone || '');
    setProfilePassword('');
    setProfileError('');
    setProfileSuccess('');
    setProfileModalOpen(true);
  };

  const handleSaveAdminProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (profilePhone && !/^\d{10}$/.test(profilePhone)) {
      setProfileError('Mobile number must be exactly 10 digits.');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');
    fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: profileName, phone: profilePhone, password: profilePassword || undefined })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not update profile.');
        setProfileSuccess('Profile updated!');
        setProfilePassword('');
        if (user) onProfileUpdated({ ...user, ...data.user });
      })
      .catch(err => setProfileError(err.message))
      .finally(() => setProfileSaving(false));
  };

  const navLinks = user?.is_admin ? [] : [
    { label: 'Home', hash: '#/' },
    { label: 'Syllabus', hash: '#/samples' },
    { label: 'Pricing', hash: '#/pricing' },
    { label: 'Testimonials', hash: '#/testimonials' },
    { label: 'Contact', hash: '#/contact' },
  ];

  return (
    <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 backdrop-blur-md ${
      darkMode ? 'bg-slate-900/90 border-slate-850 text-gray-100' : 'bg-white/90 border-slate-200 text-gray-800'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <a href="#/" className="flex items-center space-x-2 font-display text-xl font-bold tracking-tight">
            <span className="p-1.5 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
              <Command className="w-5 h-5" id="nav-logo" />
            </span>
            <span>
              QA <span className="text-emerald-500">Interview</span> Kit
            </span>
          </a>

          {/* Desktop Nav links */}
          <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
            {navLinks.map((link) => {
              const cleanedHash = link.hash.replace('#/', '') || 'home';
              const isCurrent = currentRoute === cleanedHash || (cleanedHash === 'home' && currentRoute === 'home');
              return (
                <a
                  key={link.label}
                  href={link.hash}
                  className={`transition-colors py-1 ${
                    isCurrent 
                      ? 'text-emerald-500 border-b-2 border-emerald-500 font-semibold' 
                      : darkMode ? 'text-gray-300 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-500'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
          </div>

          {/* Desktop Action Buttons bar */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Toggle Light/Dark Theme"
              id="theme-toggle"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                {user.is_admin && (
                  <a
                    href="#/admin"
                    className="flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </a>
                )}
                {!user.is_admin && (
                  <a
                    href="#/dashboard"
                    className="flex items-center space-x-1 px-3 py-1.5 border border-emerald-500 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-white transition text-sm font-medium"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>My Dashboard</span>
                  </a>
                )}
                {user.is_admin && (
                  <button
                    onClick={openProfileModal}
                    id="nav-profile-btn"
                    className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm font-medium"
                  >
                    <UserCog className="w-4 h-4" />
                    <span>Profile</span>
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-slate-200 text-gray-700 hover:bg-red-500 hover:text-white transition text-sm font-semibold rounded-lg dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-red-650"
                  id="nav-logout-btn"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <a
                  href="#/login"
                  className={`text-sm px-3 py-2 transition-colors ${
                    darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </a>
                <a
                  href="#/register"
                  className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition text-sm font-semibold shadow-md shadow-emerald-500/10 flex items-center space-x-1"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Register</span>
                </a>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'text-yellow-400' : 'text-slate-600'
              }`}
              id="mobile-theme-toggle"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-lg ${
                darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
              }`}
              id="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className={`md:hidden border-t px-4 pt-2 pb-4 space-y-2 animate-fadeIn ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.hash}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-lg transition-colors text-sm font-semibold ${
                currentRoute === (link.hash.replace('#/', '') || 'home')
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : darkMode ? 'hover:bg-slate-800 text-gray-300' : 'hover:bg-slate-100 text-gray-600'
              }`}
            >
              {link.label}
            </a>
          ))}
          <hr className={darkMode ? 'border-slate-800' : 'border-slate-100'} />
          {user ? (
            <div className="space-y-2 pt-1">
              <div className="px-3 text-xs text-gray-400 font-medium">Signed in as: {user.email}</div>
              {user.is_admin && (
                <a
                  href="#/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-indigo-500/10 text-indigo-400 rounded-lg"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Panel</span>
                </a>
              )}
              {!user.is_admin && (
                <a
                  href="#/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm bg-emerald-500/10 text-emerald-400 rounded-lg"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>My Dashboard</span>
                </a>
              )}
              {user.is_admin && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openProfileModal();
                  }}
                  id="mobile-profile-btn"
                  className="w-full flex items-center space-x-2 px-3 py-2 text-sm bg-slate-500/10 text-gray-500 dark:text-gray-300 rounded-lg text-left"
                >
                  <UserCog className="w-4 h-4" />
                  <span>Profile</span>
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-500 bg-red-500/5 hover:bg-red-500/10 transition text-left rounded-lg font-semibold"
                id="mobile-logout-btn"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href="#/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`text-center px-4 py-2 border rounded-lg text-sm font-semibold transition ${
                  darkMode ? 'border-slate-700 hover:bg-slate-800 text-gray-300' : 'border-slate-200 hover:bg-slate-100 text-gray-700'
                }`}
              >
                Sign In
              </a>
              <a
                href="#/register"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition"
              >
                Sign Up
              </a>
            </div>
          )}
        </div>
      )}

      {/* Admin Profile quick-edit modal */}
      {profileModalOpen && user && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
          onClick={() => setProfileModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-6 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-gray-100' : 'bg-white border-slate-200 text-gray-800'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-500" /> Admin Profile
              </h3>
              <button onClick={() => setProfileModalOpen(false)} className="text-gray-400 hover:text-red-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileError && (
              <p className="mb-3 text-[11px] font-bold text-red-500 bg-red-500/10 p-2 rounded-lg">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="mb-3 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 p-2 rounded-lg">{profileSuccess}</p>
            )}

            <form onSubmit={handleSaveAdminProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={`w-full py-2 px-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  disabled
                  className={`w-full py-2 px-3 border rounded-xl cursor-not-allowed ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-gray-500' : 'bg-slate-100 border-slate-200 text-gray-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">Mobile Number</label>
                <div className="relative">
                  <span className={`absolute left-3 top-2 text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    className={`w-full py-2 pl-9 pr-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider">New Password (Optional)</label>
                <div className="relative">
                  <input
                    type={showProfilePassword ? 'text' : 'password'}
                    value={profilePassword}
                    onChange={(e) => setProfilePassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    autoComplete="new-password"
                    className={`w-full py-2 px-3 pr-9 border rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowProfilePassword(!showProfilePassword)}
                    className="absolute right-2.5 top-2 text-gray-400 hover:text-indigo-500"
                  >
                    {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSaving}
                id="save-admin-profile-btn"
                className="w-full py-2.5 mt-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </nav>
  );
}
