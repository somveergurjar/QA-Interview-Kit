import React, { useState, useEffect } from 'react';
import { PageRoute, User, ConfigData, SiteContent } from './types.js';
import Navbar from './components/Navbar.js';
import Footer from './components/Footer.js';
import HomeView from './components/HomeView.js';
import AuthPages from './components/AuthPages.js';
import SampleNotesView from './components/SampleNotesView.js';
import DashboardView from './components/DashboardView.js';
import AdminView from './components/AdminView.js';
import UpiPaymentModal from './components/UpiPaymentModal.js';
import CustomCursor from './components/CustomCursor.js';
import FloatingAccessButton from './components/FloatingAccessButton.js';
import { useVisitTracking } from './hooks/useVisitTracking.js';
import { ShieldCheck, Info, Check, Sparkles, Star, Phone, Mail } from 'lucide-react';

const ROUTE_TITLES: Record<PageRoute, string> = {
  home: 'QA Interview Kit',
  login: 'Login | QA Interview Kit',
  register: 'Create Account | QA Interview Kit',
  forgot: 'Reset Password | QA Interview Kit',
  dashboard: 'My Dashboard | QA Interview Kit',
  samples: 'Sample Notes | QA Interview Kit',
  pricing: 'Pricing | QA Interview Kit',
  testimonials: 'Testimonials | QA Interview Kit',
  contact: 'Contact Us | QA Interview Kit',
  privacy: 'Privacy Policy | QA Interview Kit',
  terms: 'Terms & Conditions | QA Interview Kit',
  refund: 'Refund Policy | QA Interview Kit',
  admin: 'Admin Panel | QA Interview Kit'
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('qa_kit_token'));

  // Same race-condition-safe admin check used elsewhere: right after login `user` can
  // still be null for a moment, so fall back to the localStorage flag set at login time.
  const isAdminUser = user ? user.is_admin : localStorage.getItem('qa_kit_is_admin') === 'true';
  useVisitTracking(currentRoute, token, isAdminUser);

  // Keep the browser tab label in sync with the current page — admin sees
  // "Admin Panel | QA Interview Kit", every public page gets its own clear label.
  useEffect(() => {
    document.title = ROUTE_TITLES[currentRoute] || 'QA Interview Kit';
  }, [currentRoute]);

  const [darkMode, setDarkMode] = useState<boolean>(localStorage.getItem('qa_kit_theme') === 'dark');
  const [config, setConfig] = useState<ConfigData | null>(null);
  const [purchased, setPurchased] = useState<boolean>(false);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);

  // Manual UPI payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Feedback notifications
  const [alertMsg, setAlertMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // 1. Fetch system configs and timer levels on startup
  const fetchConfigs = () => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch((err) => console.error("Error fetching system configuration constants", err));
  };

  // Fetch admin-editable page content (hero, FAQ, toolkit grid, contact info)
  const fetchSiteContent = () => {
    fetch('/api/site-content')
      .then((res) => res.json())
      .then((data) => setSiteContent(data))
      .catch((err) => console.error("Error fetching editable site content", err));
  };

  useEffect(() => {
    fetchConfigs();
    fetchSiteContent();

    // Periodically fetch config configurations to synchronize countdown values
    const configInterval = setInterval(fetchConfigs, 30000);
    return () => clearInterval(configInterval);
  }, []);

  // 2. Validate session and purchase history when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('qa_kit_token', token);

      // Fetch user profile info
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then((res) => {
          if (!res.ok) throw new Error("Session expired.");
          return res.json();
        })
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('qa_kit_is_admin', userData.is_admin ? 'true' : 'false');

          // Check payment access status
          fetch('/api/payments/status', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
            .then((res) => res.json())
            .then((paymentData) => {
              setPurchased(paymentData.purchased);
            });
        })
        .catch(() => {
          handleLogout();
        });
    } else {
      localStorage.removeItem('qa_kit_token');
      setUser(null);
      setPurchased(false);
    }
  }, [token]);

  // Handle dark mode viewport class lists
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('qa_kit_theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('qa_kit_theme', 'light');
    }
  }, [darkMode]);

  // 3. Simple State-based Hash change listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      const parsedRoute = hash.replace('#/', '') || 'home';

      const activeToken = token || localStorage.getItem('qa_kit_token');

      // Route Guards: Redirect unverified/guests
      if (parsedRoute === 'dashboard' && !activeToken) {
        setAlertMsg("Please log in or register first. Your premium materials purchase will be linked to your email address!");
        window.location.hash = '#/register';
        return;
      }

      // Read admin status from localStorage rather than the `user` closure alone —
      // right after login the hashchange listener can fire before this effect's
      // dependency array picks up the freshly-set `user` state.
      const activeIsAdmin = user ? user.is_admin : localStorage.getItem('qa_kit_is_admin') === 'true';
      if (parsedRoute === 'admin' && !activeIsAdmin) {
        setAlertMsg("Access denied. Restricted to administrator staff members.");
        window.location.hash = '#/';
        return;
      }

      setCurrentRoute(parsedRoute as PageRoute);
      window.scrollTo({ top: 0 });
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Mount check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [token, user]);

  const handleAuthSuccess = (userData: User, userToken: string) => {
    localStorage.setItem('qa_kit_token', userToken);
    localStorage.setItem('qa_kit_is_admin', userData.is_admin ? 'true' : 'false');
    setToken(userToken);
    setUser(userData);
    setAlertMsg('');

    if (userData.is_admin) {
      setSuccessToast(`Welcome back, ${userData.name}! Opening the admin panel.`);
      window.location.hash = '#/admin';
    } else {
      setSuccessToast(`Welcome back, ${userData.name}! Enjoy full study catalog downloads.`);
      window.location.hash = '#/dashboard';
    }

    setTimeout(() => {
      setSuccessToast('');
    }, 4500);
  };

  const handleLogout = () => {
    localStorage.removeItem('qa_kit_is_admin');
    setToken(null);
    setUser(null);
    setPurchased(false);
    window.location.hash = '#/';
  };

  // 4. Manual UPI Purchase Flow
  const handleInitiatePurchase = () => {
    if (!token || !user) {
      setAlertMsg("You must create or log into your account first, so your files and receipt can be registered to you!");
      window.location.hash = '#/register';
      return;
    }

    if (purchased) {
      setSuccessToast("You have already purchased this kit! Redirecting to materials.");
      window.location.hash = '#/dashboard';
      return;
    }

    setPaymentModalOpen(true);
  };

  // Called by the UPI modal once the admin has approved a submitted payment proof
  const handlePaymentApproved = () => {
    setPurchased(true);
    setPaymentModalOpen(false);
    setSuccessToast("Payment verified! Your toolkit download modules are fully unlocked.");
    setTimeout(() => {
      setSuccessToast('');
    }, 5000);
    window.location.hash = '#/dashboard';
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      darkMode ? 'bg-slate-900 text-gray-100' : 'bg-slate-50 text-gray-800'
    }`}>

      <CustomCursor />

      {!user?.is_admin && !purchased && (
        <FloatingAccessButton onClick={handleInitiatePurchase} />
      )}

      {/* Toast Alert Banner notifications */}
      {alertMsg && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 flex items-center justify-between text-xs font-semibold shadow-md animate-fadeIn">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>{alertMsg}</span>
          </div>
          <button onClick={() => setAlertMsg('')} className="p-1 hover:bg-amber-600 rounded">×</button>
        </div>
      )}

      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 text-xs font-bold flex items-center gap-3 animate-fadeIn">
          <ShieldCheck className="w-6 h-6 animate-pulse" />
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast('')} className="text-emerald-250 hover:text-white ml-2">×</button>
        </div>
      )}

      {/* Persistent Navigation bar */}
      <Navbar
        currentRoute={currentRoute}
        user={user}
        token={token}
        onLogout={handleLogout}
        onProfileUpdated={setUser}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Routing Render Core */}
      <main className="flex-grow">

        {currentRoute === 'home' && (
          <HomeView
            onLearnMoreNote={(id) => {
              window.location.hash = `#/samples`;
            }}
            onInitiatePurchase={handleInitiatePurchase}
            config={config}
            purchased={purchased}
            darkMode={darkMode}
            siteContent={siteContent}
          />
        )}

        {currentRoute === 'login' && (
          <AuthPages view="login" onAuthSuccess={handleAuthSuccess} darkMode={darkMode} />
        )}

        {currentRoute === 'register' && (
          <AuthPages view="register" onAuthSuccess={handleAuthSuccess} darkMode={darkMode} />
        )}

        {currentRoute === 'forgot' && (
          <AuthPages view="forgot" onAuthSuccess={handleAuthSuccess} darkMode={darkMode} />
        )}

        {currentRoute === 'samples' && (
          <SampleNotesView
            darkMode={darkMode}
            onInitiatePurchase={handleInitiatePurchase}
            purchased={purchased}
          />
        )}

        {currentRoute === 'dashboard' && user && token && (
          <DashboardView
            user={user}
            token={token}
            darkMode={darkMode}
            onRefreshUser={() => {
              // Refresh details
              setToken(localStorage.getItem('qa_kit_token'));
            }}
            onInitiatePurchase={handleInitiatePurchase}
          />
        )}

        {currentRoute === 'admin' && token && (
          <AdminView token={token} darkMode={darkMode} />
        )}

        {/* --- DEDICATED EXTRA GRAPHIC SCREENS DECLARED --- */}

        {/* 1. Pricing Page */}
        {currentRoute === 'pricing' && (
          <section className="py-16 px-4 max-w-5xl mx-auto space-y-12 animate-fadeIn text-center">
            <div className="space-y-3">
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-500 rounded-full text-xs font-bold font-mono">Special Promotion Dropped</span>
              <h1 className="font-display font-black text-4xl">Honest, Straightforward Pricing</h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Invest once in your career assets. Reclaim hundreds of study prep hours.</p>
            </div>

            <div className={`p-8 rounded-3xl border max-w-sm mx-auto flex flex-col items-center relative ${
              darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-205 shadow-lg'
            }`}>
              <div className="absolute top-0 right-0 bg-red-500 text-white font-black text-[10px] tracking-widest px-4 py-1 rounded-bl-3xl">75% OFF TODAY</div>
              <h3 className="font-display font-bold text-xl uppercase mb-1">Corporate-ready Kit</h3>
              <p className="text-xs text-gray-550 mb-6">Master study packages with code scopes</p>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-extrabold text-emerald-500">₹{config ? config.amount : '199'}</span>
                <span className="text-sm line-through text-gray-400">₹{config ? config.original_amount : '1999'}</span>
              </div>

              <ul className="text-xs font-semibold text-left space-y-4 mb-8 w-full border-t border-b border-dashed dark:border-slate-850 py-6">
                {["Manual & REST API deep guides", "Selenium + Playwright automated files", "Jenkins declarative scripting code", "100+ study technical questions", "High ATS resume files & layouts", "Continuous future revisions (Free)"].map((x) => (
                  <li key={x} className="flex gap-2.5 items-center">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>

              {purchased ? (
                <a href="#/dashboard" className="w-full text-center py-3 bg-slate-200 text-slate-800 rounded-2xl font-bold transition">Manage Purchases</a>
              ) : (
                <button onClick={handleInitiatePurchase} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold cursor-pointer transition">Buy Now & Get Access</button>
              )}
            </div>
          </section>
        )}

        {/* 2. Testimonials View page */}
        {currentRoute === 'testimonials' && (
          <section className="py-16 px-4 max-w-5xl mx-auto space-y-12 animate-fadeIn">
            <div className="text-center space-y-3">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold font-mono">True Feedbacks Certified</span>
              <h1 className="font-display font-black text-4xl">Certified QA Analyst Transitions</h1>
              <p className="text-xs text-gray-400">Read what candidate test specialists have written after buying our compiled manuals and outline files.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: "Pawan Kumar", role: "Software Tester at Infosys", text: "Manual notes are extremely clear. Before this I was lost trying to write bug reports properly for complex payment timeouts, this gave me standard spreadsheets templates right on my dashboard!", stars: 5 },
                { name: "Jessica Alba", role: "SDET-I at Capgemini", text: "Finding comprehensive Jenkins files and Playwright fixtures was incredibly helpful. Worth every rupee!", stars: 5 },
                { name: "Vikram Sethi", role: "Automation Architect Lead", text: "The 100+ questions are compiled with great care. It cover edge case scenarios like currency coupons stacking which are very common in high-paying SDET recruitment rounds.", stars: 4 }
              ].map((item, id) => (
                <div key={id} className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex gap-1 mb-3 text-amber-500">
                    {[...Array(item.stars)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-sm italic text-gray-300 leading-relaxed mb-4">"{item.text}"</p>
                  <h4 className="font-bold text-sm">{item.name}</h4>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">{item.role}</span>
                </div>
              ))}
            </div>

            <div className="text-center p-8 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
              <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-2 animate-bounce" />
              <h4 className="font-bold text-sm mb-1">Purchased members can submit custom testimonials anytime</h4>
              <p className="text-gray-400 mb-4 font-normal">Testimonials are reviewed by core staff within 2 hours of submitting them.</p>
              <a href="#/dashboard" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition">Open Customer Dashboard</a>
            </div>
          </section>
        )}

        {/* 3. Contact Us Page */}
        {currentRoute === 'contact' && (
          <section className="py-20 px-4 max-w-3xl mx-auto space-y-12 text-center animate-fadeIn">
            <h1 className="font-display font-black text-4xl">Reach Out to Support</h1>
            <p className="text-sm text-gray-400">Our customer support lines operate around the clock. Fill out the contact form, or direct match our mail coordinates below.</p>

            {siteContent?.contact && (
              <div className="flex flex-col sm:flex-row justify-center gap-6 text-xs font-semibold text-gray-400">
                <span className="flex items-center justify-center gap-1.5"><Mail className="w-4 h-4 text-emerald-500" /> {siteContent.contact.support_email}</span>
                {siteContent.contact.phone && (
                  <span className="flex items-center justify-center gap-1.5"><Phone className="w-4 h-4 text-emerald-500" /> {siteContent.contact.phone}</span>
                )}
                {siteContent.contact.address && (
                  <span className="flex items-center justify-center gap-1.5">{siteContent.contact.address}</span>
                )}
              </div>
            )}

            <div className={`p-8 rounded-3xl border text-left ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-205'}`}>
              <form onSubmit={(e) => { e.preventDefault(); alert("Inquiry delivered. A core SDET technician will respond in 2 hours."); window.location.hash = '#/'; }} className="space-y-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1.5">First Name</label>
                    <input type="text" className={`w-full p-2.5 rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                  </div>
                  <div>
                    <label className="block mb-1.5">E-mail address</label>
                    <input type="email" className={`w-full p-2.5 rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                  </div>
                </div>
                <div>
                  <label className="block mb-1.5">Your Questions / Notes Details</label>
                  <textarea rows={4} className={`w-full p-3 rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`} required />
                </div>
                <button type="submit" className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold cursor-pointer rounded-xl transition uppercase">Submit Core Question</button>
              </form>
            </div>
          </section>
        )}

        {/* 4. Privacy Policy page */}
        {currentRoute === 'privacy' && (
          <section className="py-16 px-4 max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <h1 className="font-display font-black text-3xl">Privacy & Protection Regulations</h1>
            <span className="text-xs font-mono text-gray-500">Effective Date: June 19, 2026</span>
            <hr className="border-slate-800" />

            <div className="text-sm leading-relaxed text-gray-300 space-y-4">
              <p>At **QA Interview Kit**, accessible from https://qakit.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by QA Interview Kit and how we use it.</p>
              <h2 className="font-display font-bold text-lg text-emerald-500 mt-6">1. Information We Collect</h2>
              <p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information. Namely email address for registration authentication and transaction confirmation keys.</p>
              <h2 className="font-display font-bold text-lg text-emerald-500 mt-6">2. Payment Data</h2>
              <p>We do not store any banking, card, or UPI PIN details. Payments are made directly to our UPI ID via your own UPI app; we only retain the payment confirmation screenshot you upload for manual verification purposes.</p>
            </div>
          </section>
        )}

        {/* 5. Terms Page */}
        {currentRoute === 'terms' && (
          <section className="py-16 px-4 max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <h1 className="font-display font-black text-3xl">Terms & Conditions of Service</h1>
            <span className="text-xs font-mono text-gray-500">Last updated: June 19, 2026</span>
            <hr className="border-slate-800" />

            <div className="text-sm leading-relaxed text-gray-300 space-y-4">
              <p>These terms and conditions outline the rules and regulations for the use of QA Interview Kit's Website, located at https://qakit.com.</p>
              <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use QA Interview Kit if you do not agree to take all of the terms and conditions stated on this page.</p>
              <h2 className="font-display font-bold text-lg text-emerald-500 mt-6">1. Material Intellectual Property</h2>
              <p>Unless otherwise stated, QA Interview Kit and/or its licensors own the intellectual property rights for all material on QA Interview Kit. All intellectual property rights are reserved. You are granted restricted licenses to study sheets, but strictly prohibited from republishing files or selling templates across torrent sites.</p>
            </div>
          </section>
        )}

        {/* 6. Refund Policy Page */}
        {currentRoute === 'refund' && (
          <section className="py-16 px-4 max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <h1 className="font-display font-black text-3xl">Refund & Cancellation Specifications</h1>
            <span className="text-xs font-mono text-gray-500">Policy scope: 7-Day Refund Warranty</span>
            <hr className="border-slate-800" />

            <div className="text-sm leading-relaxed text-gray-300 space-y-4">
              <p>We pride ourselves on the material depth of our study notes, automation scripts, and interview templates. If you feel the QA Interview Kit does not live up to your educational expectations, we are fully committed to resolving your concerns.</p>
              <h2 className="font-display font-bold text-lg text-emerald-500 mt-6">7-Day Money-Back Guarantee</h2>
              <p>Candidates can petition support requests within 7 calendar days of purchase by dropping a single email outlining feedback to **support@qakit.com** or filling our contacts form. Our technical team will inspect indices and verify payments, processing a 100% bank-credited refund within 12 transactional hours.</p>
            </div>
          </section>
        )}

      </main>

      {/* Persistent footer policies links */}
      <Footer darkMode={darkMode} contact={siteContent?.contact || null} />

      {/* Manual UPI payment modal */}
      {token && (
        <UpiPaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          token={token}
          darkMode={darkMode}
          onApproved={handlePaymentApproved}
        />
      )}

    </div>
  );
}
