import React, { useState, useEffect, useRef } from 'react';
import {
  Users, DollarSign, Download, Settings, CheckSquare,
  Trash2, RefreshCw, BarChart, ShieldAlert, CheckCircle, BookOpen, Loader2, Star,
  QrCode, Upload, XCircle, Home, Plus, Pencil, X, Save, Mail, ImageOff, Eye, Clock
} from 'lucide-react';
import { User, Order, Testimonial, PaymentClaim, SiteContent, FaqItem, PersonaCard, ToolkitItemContent, ContactInfo } from '../types.js';

interface AdminViewProps {
  token: string;
  darkMode: boolean;
}

interface Analytics {
  totalUsers: number;
  totalSalesCount: number;
  totalRevenue: number;
  totalDownloadsCount: number;
  salesData: any[];
  downloadStats: any[];
}

interface VisitorAnalytics {
  totalVisits: number;
  uniqueVisitors: number;
  avgDurationSeconds: number;
  topPages: { path: string; visits: number; avgDurationSeconds: number }[];
  dailyVisits: { date: string; count: number }[];
  recentVisits: { id: number; path: string; duration_seconds: number; started_at: string; user: string }[];
}

type AdminTab = 'analytics' | 'visitors' | 'users' | 'orders' | 'testimonials' | 'home' | 'syllabus' | 'contact' | 'pricing' | 'upi';

function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0s';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export default function AdminView({ token, darkMode }: AdminViewProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [visitorAnalytics, setVisitorAnalytics] = useState<VisitorAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [paymentClaims, setPaymentClaims] = useState<PaymentClaim[]>([]);

  // Timer & pricing configurations inputs
  const [priceAmount, setPriceAmount] = useState('199');
  const [originalPriceAmount, setOriginalPriceAmount] = useState('1999');
  const [timerHours, setTimerHours] = useState('1');

  // UPI QR payment settings inputs
  const [upiId, setUpiId] = useState('');
  const [qrImage, setQrImage] = useState('');
  const [upiSaving, setUpiSaving] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // Editable website content (Home hero/FAQ/personas, Syllabus grid, Contact info)
  const [heroTag, setHeroTag] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [personas, setPersonas] = useState<PersonaCard[]>([]);
  const [toolkitItems, setToolkitItems] = useState<ToolkitItemContent[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({ support_email: '', phone: '', address: '', website: '' });
  const [homeSaving, setHomeSaving] = useState(false);
  const [toolkitSaving, setToolkitSaving] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);

  // Add/edit testimonial state
  const [testimonialForm, setTestimonialForm] = useState<{ id: number | null; user_name: string; role: string; comment: string; rating: number } | null>(null);
  const [testimonialSaving, setTestimonialSaving] = useState(false);

  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');

  const pendingClaimsCount = paymentClaims.filter(c => c.status === 'pending').length;

  // Trigger refreshing dataset from backend APIs
  const refreshAdminData = () => {
    setLoading(true);

    const fetchAnalytics = fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json());
    const fetchVisitorAnalytics = fetch('/api/admin/analytics/visitors', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json());
    const fetchUsers = fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json());
    const fetchOrders = fetch('/api/admin/orders', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json());
    const fetchTestimonials = fetch('/api/admin/testimonials', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json());
    const fetchClaims = fetch('/api/admin/payment-claims', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json());
    const fetchConfig = fetch('/api/config').then(res => res.json());
    const fetchUpiConfig = fetch('/api/payments/upi-config').then(res => res.json());
    const fetchSiteContent = fetch('/api/site-content').then(res => res.json());

    Promise.all([fetchAnalytics, fetchVisitorAnalytics, fetchUsers, fetchOrders, fetchTestimonials, fetchClaims, fetchConfig, fetchUpiConfig, fetchSiteContent])
      .then(([analyticsData, visitorAnalyticsData, usersData, ordersData, testimonialsData, claimsData, configData, upiData, siteContentData]: [any, any, any, any, any, any, any, any, SiteContent]) => {
        setAnalytics(analyticsData);
        setVisitorAnalytics(visitorAnalyticsData);
        setUsers(usersData);
        setOrders(ordersData);
        setTestimonials(testimonialsData);
        setPaymentClaims(Array.isArray(claimsData) ? claimsData : []);

        if (configData) {
          setPriceAmount(configData.amount?.toString() || '199');
          setOriginalPriceAmount(configData.original_amount?.toString() || '1999');
          setTimerHours(configData.timer_duration_hours?.toString() || '1');
        }

        if (upiData) {
          setUpiId(upiData.upi_id || '');
          setQrImage(upiData.qr_image || '');
        }

        if (siteContentData) {
          setHeroTag(siteContentData.home.hero_tag);
          setHeroTitle(siteContentData.home.hero_title);
          setHeroSubtitle(siteContentData.home.hero_subtitle);
          setFaqs(siteContentData.home.faqs);
          setPersonas(siteContentData.home.personas);
          setToolkitItems(siteContentData.toolkitItems);
          setContactInfo(siteContentData.contact);
        }
      })
      .catch((err) => {
        console.error("Error retrieving admin details:", err);
        setErrorMsg("Failed to authenticate administrators context. Session expired.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refreshAdminData();
  }, [token]);

  // Lightweight refresh for just the Visitor Insights tab — avoids re-fetching (and
  // potentially resetting mid-edit form state in) every other tab every 20s.
  const refreshVisitorAnalytics = () => {
    fetch('/api/admin/analytics/visitors', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setVisitorAnalytics(data))
      .catch(err => console.error('Error refreshing visitor analytics:', err));
  };

  useEffect(() => {
    if (activeTab !== 'visitors') return;
    const interval = setInterval(refreshVisitorAnalytics, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token]);

  const clearNotification = () => {
    setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 4000);
  };

  // Approve/Reject a submitted UPI payment screenshot (grants access on approve)
  const handleClaimDecision = (claimId: number, action: 'approve' | 'reject') => {
    let reason = '';
    if (action === 'reject') {
      const input = prompt(
        'Reject this payment proof — why? (this reason is emailed to the user, so make it clear)',
        'The screenshot could not be verified — the amount or transaction details did not match.'
      );
      if (input === null) return; // admin cancelled
      reason = input.trim() || 'The screenshot could not be verified.';
    }

    fetch(`/api/admin/payment-claims/${claimId}/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: action === 'reject' ? JSON.stringify({ reason }) : undefined
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not update payment claim.');
        setSuccessMsg(
          action === 'approve'
            ? 'Payment approved — user access unlocked!'
            : data.notified
              ? 'Payment claim rejected — the user has been emailed the reason.'
              : 'Payment claim rejected, but the notification email could not be sent (check SMTP settings).'
        );
        refreshAdminData();
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message));
  };

  // Permanently delete a user account (and everything tied to it — orders, downloads, etc.)
  const handleDeleteUser = (userId: number, userEmail: string) => {
    if (!confirm(`Permanently delete ${userEmail}? This removes their account, orders, downloads and payment history. This cannot be undone.`)) return;

    fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not delete user.');
        setSuccessMsg(data.message);
        refreshAdminData();
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message));
  };

  // Save the QR code image shown to buyers. Entirely optional — an admin can save with
  // no QR to hide the payment option, it's their choice whether to display one at all.
  const handleSaveUpiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setUpiSaving(true);
    fetch('/api/admin/upi-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ upi_id: upiId.trim(), qr_image: qrImage })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not save UPI settings.');
        setSuccessMsg(data.message || (qrImage ? 'QR code uploaded — now visible to buyers.' : 'Payment settings saved.'));
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setUpiSaving(false));
  };

  const handleQrImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('QR code must be an image file.');
      clearNotification();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setQrImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Removing a QR takes effect immediately — it's deleted from the live payment
  // config right away, not just cleared locally, so buyers stop seeing it instantly.
  const handleRemoveQrImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Remove the current QR code? Buyers will not see a payment QR until you upload a new one.')) return;

    setUpiSaving(true);
    fetch('/api/admin/upi-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ upi_id: upiId.trim(), qr_image: '' })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not remove the QR code.');
        setQrImage('');
        if (qrFileInputRef.current) qrFileInputRef.current.value = '';
        setSuccessMsg(data.message || 'QR code removed.');
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setUpiSaving(false));
  };

  // --- Website Content: Home (hero, FAQ, personas) ---
  const handleSaveHomeContent = () => {
    setHomeSaving(true);
    fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ home: { hero_tag: heroTag, hero_title: heroTitle, hero_subtitle: heroSubtitle, faqs, personas } })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not save Home content.');
        setSuccessMsg('Home page content updated live!');
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setHomeSaving(false));
  };

  const updateFaq = (idx: number, field: 'q' | 'a', value: string) => {
    setFaqs(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };
  const addFaq = () => setFaqs(prev => [...prev, { q: '', a: '' }]);
  const removeFaq = (idx: number) => setFaqs(prev => prev.filter((_, i) => i !== idx));

  const updatePersona = (idx: number, field: keyof PersonaCard, value: string) => {
    setPersonas(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };
  const addPersona = () => setPersonas(prev => [...prev, { title: '', level: '', pain_point: '', gain: '' }]);
  const removePersona = (idx: number) => setPersonas(prev => prev.filter((_, i) => i !== idx));

  // --- Website Content: Syllabus / Toolkit grid ---
  const updateToolkitItem = (idx: number, field: 'title' | 'category' | 'description', value: string) => {
    setToolkitItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSaveToolkitItems = () => {
    setToolkitSaving(true);
    fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ toolkitItems })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not save Syllabus content.');
        setSuccessMsg('Syllabus grid updated live!');
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setToolkitSaving(false));
  };

  // --- Website Content: Contact info ---
  const handleSaveContactInfo = () => {
    setContactSaving(true);
    fetch('/api/admin/site-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ contact: contactInfo })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not save Contact info.');
        setSuccessMsg('Contact info updated live!');
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setContactSaving(false));
  };

  // --- Testimonials: direct admin add/edit (separate from the approve/reject workflow) ---
  const openNewTestimonialForm = () => setTestimonialForm({ id: null, user_name: '', role: '', comment: '', rating: 5 });
  const openEditTestimonialForm = (t: Testimonial) => setTestimonialForm({ id: t.id, user_name: t.user_name, role: t.role, comment: t.comment, rating: t.rating });
  const closeTestimonialForm = () => setTestimonialForm(null);

  const handleSubmitTestimonialForm = () => {
    if (!testimonialForm) return;
    const { id, user_name, role, comment, rating } = testimonialForm;
    if (!user_name.trim() || !role.trim() || !comment.trim()) {
      setErrorMsg('Name, role and comment are all required.');
      clearNotification();
      return;
    }
    setTestimonialSaving(true);
    const isEdit = id !== null;
    const url = isEdit ? `/api/admin/testimonials/${id}` : '/api/admin/testimonials';
    fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ user_name, role, comment, rating })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not save testimonial.');
        setSuccessMsg(isEdit ? 'Testimonial updated!' : 'Testimonial added!');
        setTestimonialForm(null);
        refreshAdminData();
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setTestimonialSaving(false));
  };

  // Toggle a user's email-verified flag
  const handleToggleUserField = (userId: number, field: 'email_verified', currentValue: boolean) => {
    fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ [field]: !currentValue })
    })
      .then(res => {
        if (!res.ok) throw new Error("Could not modify permissions.");
        return res.json();
      })
      .then(() => {
        setSuccessMsg(`User profile updated!`);
        refreshAdminData();
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message));
  };

  // Directly grant or revoke kit access for a user, independent of the payment proof workflow
  const handleToggleUserAccess = (userId: number, grant: boolean) => {
    if (!grant && !confirm('Revoke this user\'s access to the kit?')) return;
    fetch(`/api/admin/users/${userId}/access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ grant })
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message || 'Could not update access.');
        setSuccessMsg(grant ? 'Access granted!' : 'Access revoked.');
        refreshAdminData();
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message));
  };

  // Toggle Testimonial approval state
  const handleToggleTestimonialApprove = (id: number, currentApproved: boolean) => {
    fetch(`/api/admin/testimonials/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ approved: !currentApproved })
    })
      .then(res => {
        if (!res.ok) throw new Error("Could not update approval state.");
        return res.json();
      })
      .then(() => {
        setSuccessMsg(`Testimonial approval updated!`);
        refreshAdminData();
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message));
  };

  // Delete single Testimonial
  const handleDeleteTestimonial = (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this user testimonial?")) return;
    fetch(`/api/admin/testimonials/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Delete action failed.");
        return res.json();
      })
      .then(() => {
        setSuccessMsg("Testimonial deleted successfully.");
        refreshAdminData();
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message));
  };

  // Submit global timer and pricing updates
  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    fetch('/api/admin/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: Number(priceAmount),
        original_amount: Number(originalPriceAmount),
        timer_duration_hours: Number(timerHours)
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error("Configuration save error.");
        return res.json();
      })
      .then(() => {
        setSuccessMsg('Global pricing and countdown timer configurations successfully applied!');
        refreshAdminData();
        clearNotification();
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  };

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition ${
    darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-gray-600' : 'bg-slate-50 border-slate-200 text-gray-800 placeholder-gray-400'
  }`;
  const cardClass = `rounded-2xl border ${darkMode ? 'bg-slate-850 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`;

  const navGroups: { label: string; items: { id: AdminTab; label: string; icon: any; badge?: number }[] }[] = [
    { label: 'Overview', items: [
      { id: 'analytics', label: 'Analytics', icon: BarChart },
      { id: 'visitors', label: 'Visitor Insights', icon: Eye }
    ]},
    { label: 'People', items: [
      { id: 'users', label: 'Manage Users', icon: Users, badge: pendingClaimsCount },
      { id: 'orders', label: 'Billing Orders', icon: DollarSign }
    ]},
    { label: 'Content', items: [
      { id: 'home', label: 'Home Page', icon: Home },
      { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
      { id: 'testimonials', label: 'Testimonials', icon: CheckSquare },
      { id: 'contact', label: 'Contact Info', icon: Mail }
    ]},
    { label: 'Settings', items: [
      { id: 'pricing', label: 'Pricing & Timer', icon: Settings },
      { id: 'upi', label: 'Payment Method', icon: QrCode }
    ]}
  ];

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-gray-100' : 'bg-slate-50 text-gray-800'
    }`}>
      {/* Floating toast — fixed so it's always visible, even scrolled deep into a tab */}
      {(successMsg || errorMsg) && (
        <div className="fixed top-6 right-6 z-[200] max-w-sm animate-fadeInUp">
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{successMsg}</span>
              <button onClick={() => setSuccessMsg('')} className="ml-auto p-1 hover:bg-emerald-600 rounded">×</button>
            </div>
          )}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-500 text-white shadow-2xl shadow-red-500/20 text-xs font-bold flex items-center gap-2 mt-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')} className="ml-auto p-1 hover:bg-red-600 rounded">×</button>
            </div>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">

        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 sm:p-6 rounded-3xl border ${
          darkMode ? 'bg-gradient-to-r from-indigo-950/60 to-slate-900 border-slate-800' : 'bg-gradient-to-r from-indigo-50 to-white border-slate-200'
        }`}>
          <div>
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded bg-indigo-500 text-white uppercase inline-block mb-1.5">
              Secure Staff Board
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight leading-none">
              Kit Administrator Control Panel
            </h1>
          </div>

          <div className="flex gap-2">
            <button
              onClick={refreshAdminData}
              className={`p-2.5 rounded-xl border transition-colors ${
                darkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-100'
              }`}
              title="Refresh database records"
              id="admin-refresh-btn"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>
            <a
              href="#/dashboard"
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <span>Buyer Dashboard View</span>
            </a>
          </div>
        </div>

        {loading && !analytics ? (
          <div className={`flex flex-col items-center justify-center py-24 rounded-3xl border ${cardClass}`}>
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-sm font-semibold">Stitching secure analytics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Sidebar navigation */}
            <div className={`lg:col-span-3 lg:sticky lg:top-6 p-3 space-y-5 rounded-3xl border animate-fadeInUp ${cardClass}`}>
              {navGroups.map((group) => (
                <div key={group.label}>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 px-3 mb-1.5">{group.label}</h3>
                  <div className="space-y-1">
                    {group.items.map((tab) => {
                      const TabIcon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold rounded-xl text-left transition-all duration-200 ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                              : darkMode ? 'hover:bg-slate-800 hover:translate-x-0.5 text-gray-300' : 'hover:bg-slate-100 hover:translate-x-0.5 text-gray-700'
                          }`}
                        >
                          <span className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/15' : darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <TabIcon className="w-3.5 h-3.5" />
                          </span>
                          <span className="flex-grow">{tab.label}</span>
                          {!!tab.badge && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Core Panels viewport */}
            <div key={activeTab} className="lg:col-span-9 animate-fadeInUp">

              {/* --- ANALYTICS --- */}
              {activeTab === 'analytics' && analytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`p-5 rounded-2xl border card-modern hover:shadow-lg animate-fadeInUp stagger-1 ${cardClass}`}>
                      <Users className="w-8 h-8 text-indigo-500 mb-3" />
                      <h4 className="text-2xl font-black">{analytics.totalUsers}</h4>
                      <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1">Total Users</p>
                    </div>
                    <div className={`p-5 rounded-2xl border card-modern hover:shadow-lg animate-fadeInUp stagger-2 ${cardClass}`}>
                      <DollarSign className="w-8 h-8 text-emerald-500 mb-3" />
                      <h4 className="text-2xl font-black">{analytics.totalSalesCount}</h4>
                      <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1">Premium Orders</p>
                    </div>
                    <div className={`p-5 rounded-2xl border card-modern hover:shadow-lg animate-fadeInUp stagger-3 ${cardClass}`}>
                      <DollarSign className="w-8 h-8 text-teal-400 mb-3" />
                      <h4 className="text-2xl font-black">₹{analytics.totalRevenue}.00</h4>
                      <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1">Total Revenue</p>
                    </div>
                    <div className={`p-5 rounded-2xl border card-modern hover:shadow-lg animate-fadeInUp stagger-4 ${cardClass}`}>
                      <Download className="w-8 h-8 text-amber-500 mb-3" />
                      <h4 className="text-2xl font-black">{analytics.totalDownloadsCount}</h4>
                      <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1">Notes Pulled</p>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl border ${cardClass}`}>
                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-1.5 text-indigo-500">
                      <Download className="w-5 h-5" />
                      <span>Live Downloads Audit Trail</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead>
                          <tr className="border-b border-dashed border-slate-800 text-gray-400 pb-2">
                            <th className="py-2.5">Purchasing User</th>
                            <th className="py-2.5">Downloaded Asset</th>
                            <th className="py-2.5">Date Stamp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dashed divide-slate-800/50">
                          {analytics.downloadStats.length > 0 ? (
                            analytics.downloadStats.map((stat, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/10 transition">
                                <td className="py-2.5 text-gray-440 font-mono select-all truncate max-w-[200px]">{stat.user}</td>
                                <td className="py-2.5 font-bold">{stat.file_name}</td>
                                <td className="py-2.5 font-mono text-[10px] text-gray-500">{new Date(stat.date).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-4 text-center text-gray-400 italic">No assets pulled yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* --- VISITOR INSIGHTS (traffic + time spent) --- */}
              {activeTab === 'visitors' && visitorAnalytics && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between -mb-2">
                    <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live — auto-refreshes every 20s
                    </span>
                    <button
                      onClick={refreshVisitorAnalytics}
                      className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh now
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`p-5 rounded-2xl border card-modern hover:shadow-lg animate-fadeInUp stagger-1 ${cardClass}`}>
                      <Eye className="w-8 h-8 text-indigo-500 mb-3" />
                      <h4 className="text-2xl font-black">{visitorAnalytics.totalVisits}</h4>
                      <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1">Total Page Visits</p>
                    </div>
                    <div className={`p-5 rounded-2xl border card-modern hover:shadow-lg animate-fadeInUp stagger-2 ${cardClass}`}>
                      <Users className="w-8 h-8 text-emerald-500 mb-3" />
                      <h4 className="text-2xl font-black">{visitorAnalytics.uniqueVisitors}</h4>
                      <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1">Unique Visitors</p>
                    </div>
                    <div className={`p-5 rounded-2xl border card-modern hover:shadow-lg animate-fadeInUp stagger-3 ${cardClass}`}>
                      <Clock className="w-8 h-8 text-amber-500 mb-3" />
                      <h4 className="text-2xl font-black">{formatDuration(visitorAnalytics.avgDurationSeconds)}</h4>
                      <p className="text-[11px] font-mono text-gray-400 uppercase tracking-widest mt-1">Avg. Time Spent</p>
                    </div>
                  </div>

                  {/* Last 7 days traffic */}
                  <div className={`p-6 rounded-2xl border ${cardClass}`}>
                    <h3 className="font-display font-bold text-lg mb-5 flex items-center gap-1.5 text-indigo-500">
                      <BarChart className="w-5 h-5" />
                      <span>Visits — Last 7 Days</span>
                    </h3>
                    {(() => {
                      const maxCount = Math.max(1, ...visitorAnalytics.dailyVisits.map(d => d.count));
                      return (
                        <div className="flex items-end gap-3 h-36">
                          {visitorAnalytics.dailyVisits.map((d) => (
                            <div key={d.date} className="flex-1 flex flex-col items-center gap-1.5">
                              <span className="text-[10px] font-bold text-gray-400">{d.count}</span>
                              <div className="w-full flex items-end h-24 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900">
                                <div
                                  className="w-full rounded-t-lg transition-all duration-700"
                                  style={{
                                    height: `${Math.max(4, (d.count / maxCount) * 100)}%`,
                                    background: 'linear-gradient(180deg, #10b981, #6366f1)'
                                  }}
                                />
                              </div>
                              <span className="text-[9px] font-mono text-gray-400">
                                {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Top pages breakdown */}
                  <div className={`p-6 rounded-2xl border ${cardClass}`}>
                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-1.5 text-indigo-500">
                      <Home className="w-5 h-5" />
                      <span>Most Visited Pages</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead>
                          <tr className="border-b border-dashed border-slate-800 text-gray-400 pb-2">
                            <th className="py-2.5">Page</th>
                            <th className="py-2.5">Visits</th>
                            <th className="py-2.5">Avg. Time Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dashed divide-slate-800/50">
                          {visitorAnalytics.topPages.length > 0 ? (
                            visitorAnalytics.topPages.map((p) => (
                              <tr key={p.path} className="hover:bg-slate-800/10 transition">
                                <td className="py-2.5 font-mono">{p.path}</td>
                                <td className="py-2.5 font-bold text-emerald-500">{p.visits}</td>
                                <td className="py-2.5 font-mono text-[10px] text-gray-500">{formatDuration(p.avgDurationSeconds)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="py-4 text-center text-gray-400 italic">No visits recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Recent visits log */}
                  <div className={`p-6 rounded-2xl border ${cardClass}`}>
                    <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-1.5 text-indigo-500">
                      <Clock className="w-5 h-5" />
                      <span>Recent Visits</span>
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead>
                          <tr className="border-b border-dashed border-slate-800 text-gray-400 pb-2">
                            <th className="py-2.5">Visitor</th>
                            <th className="py-2.5">Page</th>
                            <th className="py-2.5">Time Spent</th>
                            <th className="py-2.5">When</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dashed divide-slate-800/50">
                          {visitorAnalytics.recentVisits.length > 0 ? (
                            visitorAnalytics.recentVisits.map((v) => (
                              <tr key={v.id} className="hover:bg-slate-800/10 transition">
                                <td className="py-2.5 text-gray-440 font-mono select-all truncate max-w-[200px]">{v.user}</td>
                                <td className="py-2.5 font-mono">{v.path}</td>
                                <td className="py-2.5 font-bold text-emerald-500">{formatDuration(v.duration_seconds)}</td>
                                <td className="py-2.5 font-mono text-[10px] text-gray-500">{new Date(v.started_at).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-gray-400 italic">No visits recorded yet.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* --- MANAGE USERS (+ merged payment proof review + access control) --- */}
              {activeTab === 'users' && (
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-display font-bold text-lg mb-1 text-indigo-500">Registered Users ({users.length})</h3>
                  <p className="text-xs text-gray-400 mb-5">Admin rights are locked to a single configured email. Review a submitted payment screenshot right here, or grant/revoke kit access manually for anyone.</p>

                  <div className="space-y-3">
                    {users.map((u) => {
                      const hasAccess = orders.some(o => o.user_id === u.id && o.status === 'completed');
                      const claim = paymentClaims.find(c => c.user_id === u.id);
                      return (
                        <div key={u.id} className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center gap-4 transition-all duration-200 hover:shadow-md ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'}`}>

                          {/* Identity */}
                          <div className="lg:w-56 flex-shrink-0">
                            <p className="font-bold text-sm">{u.name}</p>
                            <p className="text-[11px] text-gray-400 font-mono select-all truncate">{u.email}</p>
                            {u.phone && <p className="text-[11px] text-gray-400 font-mono select-all">+91 {u.phone}</p>}
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.is_admin ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-800 dark:bg-slate-800 dark:text-gray-300'}`}>
                                {u.is_admin ? 'ADMIN' : 'USER'}
                              </span>
                              <button
                                onClick={() => handleToggleUserField(u.id, 'email_verified', u.email_verified)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.email_verified ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-500/10 hover:text-emerald-400'}`}
                              >
                                {u.email_verified ? 'Verified' : 'Unverified'}
                              </button>
                            </div>
                            <p className="text-[10px] text-gray-500 font-mono mt-1">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                          </div>

                          {/* Payment proof */}
                          <div className="flex-grow flex items-center gap-3 text-xs">
                            {claim ? (
                              <>
                                {claim.screenshot ? (
                                  <img
                                    src={claim.screenshot}
                                    alt="Payment screenshot"
                                    onClick={() => setExpandedScreenshot(claim.screenshot!)}
                                    className="w-14 h-14 object-cover rounded-lg border border-slate-700 cursor-pointer flex-shrink-0"
                                  />
                                ) : (
                                  <span className="w-14 h-14 rounded-lg border border-dashed border-slate-700 flex items-center justify-center flex-shrink-0 text-gray-500">
                                    <ImageOff className="w-5 h-5" />
                                  </span>
                                )}
                                <div className="min-w-0">
                                  <p className="font-semibold">₹{claim.amount} {claim.utr && <span className="text-gray-400 font-mono text-[10px]">· UTR {claim.utr}</span>}</p>
                                  <p className="text-[10px] text-gray-500">Submitted {new Date(claim.submitted_at).toLocaleDateString()}</p>
                                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                                    claim.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                                    claim.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                  }`}>
                                    {claim.status.toUpperCase()}
                                  </span>
                                </div>
                                {claim.status === 'pending' && (
                                  <div className="flex flex-col gap-1.5 ml-auto flex-shrink-0">
                                    <button
                                      onClick={() => handleClaimDecision(claim.id, 'approve')}
                                      id={`approve-claim-${claim.id}`}
                                      className="flex items-center justify-center gap-1 py-1.5 px-3 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg font-bold transition"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                                    </button>
                                    <button
                                      onClick={() => handleClaimDecision(claim.id, 'reject')}
                                      id={`reject-claim-${claim.id}`}
                                      className="flex items-center justify-center gap-1 py-1.5 px-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-bold transition"
                                    >
                                      <XCircle className="w-3.5 h-3.5" /> Reject
                                    </button>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 italic">No payment proof submitted</span>
                            )}
                          </div>

                          {/* Manual access override + delete */}
                          <div className="flex-shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => handleToggleUserAccess(u.id, !hasAccess)}
                              id={`toggle-access-user-${u.id}`}
                              className={`px-3 py-2 rounded-xl text-[11px] font-bold transition whitespace-nowrap ${
                                hasAccess
                                  ? 'bg-emerald-500/10 text-emerald-500 hover:bg-red-500/10 hover:text-red-500'
                                  : 'bg-slate-300 text-slate-800 hover:bg-emerald-500 hover:text-white dark:bg-slate-800 dark:text-gray-300'
                              }`}
                              title={hasAccess ? 'Click to revoke access' : 'Click to grant access'}
                            >
                              {hasAccess ? '✓ Access Granted' : 'Grant Access'}
                            </button>
                            {!u.is_admin && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                id={`delete-user-${u.id}`}
                                title="Permanently delete this user"
                                className="p-2 rounded-xl text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* --- BILLING ORDERS --- */}
              {activeTab === 'orders' && (
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-display font-bold text-lg mb-4 text-emerald-500">Premium Order History Transactions</h3>
                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left font-semibold">
                      <thead>
                        <tr className="border-b border-dashed border-slate-800 text-gray-400">
                          <th className="py-2">Shopper Details</th>
                          <th className="py-2">Reference</th>
                          <th className="py-2 text-center font-mono">Paid Amount</th>
                          <th className="py-2 text-center">Status</th>
                          <th className="py-2 text-right">Purchase Stamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dashed divide-slate-850">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-slate-800/10 transition">
                            <td className="py-3">
                              <p className="font-bold">{o.user_name}</p>
                              <span className="block text-[10px] text-gray-400 font-mono">{o.user_email}</span>
                              {o.user_phone && <span className="block text-[10px] text-gray-400 font-mono">+91 {o.user_phone}</span>}
                            </td>
                            <td className="py-3 font-mono text-[10px] select-all">
                              <p className="font-bold text-gray-200">{o.payment_id}</p>
                              <span className="text-gray-500">Ref: {o.razorpay_order_id}</span>
                            </td>
                            <td className="py-3 text-center text-emerald-500 font-bold text-sm">₹{o.amount}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                o.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                              }`}>
                                {o.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 text-right font-mono text-[10px] text-gray-500">{new Date(o.purchase_date).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* --- TESTIMONIALS --- */}
              {activeTab === 'testimonials' && (
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-lg text-indigo-500">Submitted Feedbacks ({testimonials.length})</h3>
                    <button
                      onClick={openNewTestimonialForm}
                      id="add-new-testimonial-btn"
                      className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition"
                    >
                      <Plus className="w-4 h-4" /> Add Testimonial
                    </button>
                  </div>

                  {testimonialForm && (
                    <div className={`p-4 rounded-xl border mb-6 space-y-3 text-xs font-semibold ${darkMode ? 'bg-slate-900 border-indigo-500/40' : 'bg-indigo-50/40 border-indigo-200'}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-indigo-500">{testimonialForm.id !== null ? 'Edit Testimonial' : 'New Testimonial'}</h4>
                        <button onClick={closeTestimonialForm} className="text-gray-400 hover:text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={testimonialForm.user_name}
                          onChange={(e) => setTestimonialForm({ ...testimonialForm, user_name: e.target.value })}
                          placeholder="Name"
                          className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                        />
                        <input
                          type="text"
                          value={testimonialForm.role}
                          onChange={(e) => setTestimonialForm({ ...testimonialForm, role: e.target.value })}
                          placeholder="Role, e.g. QA Engineer at Amazon"
                          className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                        />
                      </div>
                      <textarea
                        value={testimonialForm.comment}
                        onChange={(e) => setTestimonialForm({ ...testimonialForm, comment: e.target.value })}
                        placeholder="Testimonial text"
                        rows={2}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                      />
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} type="button" onClick={() => setTestimonialForm({ ...testimonialForm, rating: star })}>
                            <Star className={`w-5 h-5 ${star <= testimonialForm.rating ? 'text-amber-500 fill-current' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleSubmitTestimonialForm}
                        disabled={testimonialSaving}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5"
                      >
                        {testimonialSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-4">
                    {testimonials.map((t) => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs font-semibold ${
                          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="space-y-1 max-w-lg">
                          <div className="flex gap-1 text-amber-500">
                            {[...Array(t.rating)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
                          </div>
                          <p className="italic text-gray-300">"{t.comment}"</p>
                          <p className="text-[10px] text-gray-400">{t.user_name} • <span className="underline">{t.role}</span></p>
                        </div>

                        <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleToggleTestimonialApprove(t.id, t.approved)}
                            id={`approve-tst-${t.id}`}
                            className={`w-full text-center py-1.5 px-3 rounded font-bold cursor-pointer transition ${
                              t.approved
                                ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                : 'bg-slate-850 text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                          >
                            {t.approved ? 'Approved' : 'Pending Approve'}
                          </button>
                          <button
                            onClick={() => openEditTestimonialForm(t)}
                            id={`edit-tst-${t.id}`}
                            className="w-full flex items-center justify-center gap-1 py-1.5 px-3 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 text-center rounded transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTestimonial(t.id)}
                            id={`del-tst-${t.id}`}
                            className="w-full flex items-center justify-center gap-1 py-1.5 px-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-center rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* --- HOME PAGE CONTENT --- */}
              {activeTab === 'home' && (
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-display font-bold text-lg mb-1 text-indigo-500 flex items-center gap-2"><Home className="w-5 h-5" /> Home Page Content</h3>
                  <p className="text-xs text-gray-400 mb-6">Edit the hero, FAQ and "who is this for" cards. Saved changes go live immediately.</p>

                  <div className="space-y-6 text-xs font-semibold">
                    <div>
                      <label className="block text-gray-400 mb-1.5 uppercase tracking-wider font-bold">Hero Tag (small pill above headline)</label>
                      <input type="text" value={heroTag} onChange={(e) => setHeroTag(e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1.5 uppercase tracking-wider font-bold">Hero Headline</label>
                      <input type="text" value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} className={`${inputClass} text-sm font-bold`} />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1.5 uppercase tracking-wider font-bold">Hero Subtitle</label>
                      <textarea value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} rows={3} className={inputClass} />
                    </div>

                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-indigo-500 font-bold uppercase tracking-wider">FAQ ({faqs.length})</h4>
                        <button onClick={addFaq} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-[11px]"><Plus className="w-3.5 h-3.5" /> Add</button>
                      </div>
                      <div className="space-y-3">
                        {faqs.map((faq, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border space-y-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={faq.q}
                                onChange={(e) => updateFaq(idx, 'q', e.target.value)}
                                placeholder="Question"
                                className={`flex-grow px-3 py-2 rounded-lg border font-bold ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                              />
                              <button onClick={() => removeFaq(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <textarea
                              value={faq.a}
                              onChange={(e) => updateFaq(idx, 'a', e.target.value)}
                              placeholder="Answer"
                              rows={2}
                              className={`w-full px-3 py-2 rounded-lg border font-normal ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-indigo-500 font-bold uppercase tracking-wider">"Who is this for" Cards ({personas.length})</h4>
                        <button onClick={addPersona} className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-500/10 text-indigo-500 rounded-lg text-[11px]"><Plus className="w-3.5 h-3.5" /> Add</button>
                      </div>
                      <div className="space-y-3">
                        {personas.map((persona, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border space-y-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={persona.title}
                                onChange={(e) => updatePersona(idx, 'title', e.target.value)}
                                placeholder="Persona title"
                                className={`flex-grow px-3 py-2 rounded-lg border font-bold ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                              />
                              <button onClick={() => removePersona(idx)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <input
                              type="text"
                              value={persona.level}
                              onChange={(e) => updatePersona(idx, 'level', e.target.value)}
                              placeholder="Level, e.g. Entry to Mid Level"
                              className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                            />
                            <textarea
                              value={persona.pain_point}
                              onChange={(e) => updatePersona(idx, 'pain_point', e.target.value)}
                              placeholder="Pain point"
                              rows={2}
                              className={`w-full px-3 py-2 rounded-lg border font-normal ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                            />
                            <textarea
                              value={persona.gain}
                              onChange={(e) => updatePersona(idx, 'gain', e.target.value)}
                              placeholder="What they gain"
                              rows={2}
                              className={`w-full px-3 py-2 rounded-lg border font-normal ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleSaveHomeContent}
                      disabled={homeSaving}
                      id="save-home-content-btn"
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-white rounded-xl transition cursor-pointer shadow-lg inline-flex items-center gap-1.5"
                    >
                      {homeSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
                      <span>Save Home Content</span>
                    </button>
                  </div>
                </div>
              )}

              {/* --- SYLLABUS CONTENT --- */}
              {activeTab === 'syllabus' && (
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-display font-bold text-lg mb-1 text-indigo-500 flex items-center gap-2"><BookOpen className="w-5 h-5" /> Syllabus Grid</h3>
                  <p className="text-xs text-gray-400 mb-6">The 13 toolkit cards shown on the homepage and syllabus section.</p>

                  <div className="space-y-4 text-xs font-semibold">
                    {toolkitItems.map((item, idx) => (
                      <div key={item.id} className={`p-4 rounded-xl border space-y-2 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => updateToolkitItem(idx, 'title', e.target.value)}
                            placeholder="Title"
                            className={`flex-grow px-3 py-2 rounded-lg border font-bold ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                          />
                          <select
                            value={item.category}
                            onChange={(e) => updateToolkitItem(idx, 'category', e.target.value)}
                            className={`px-3 py-2 rounded-lg border sm:w-40 ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                          >
                            <option value="Manual">Manual</option>
                            <option value="Automation">Automation</option>
                            <option value="Templates">Templates</option>
                            <option value="Career">Career</option>
                          </select>
                        </div>
                        <textarea
                          value={item.description}
                          onChange={(e) => updateToolkitItem(idx, 'description', e.target.value)}
                          rows={2}
                          className={`w-full px-3 py-2 rounded-lg border font-normal ${darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleSaveToolkitItems}
                      disabled={toolkitSaving}
                      id="save-syllabus-content-btn"
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-white rounded-xl transition cursor-pointer shadow-lg inline-flex items-center gap-1.5"
                    >
                      {toolkitSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
                      <span>Save Syllabus Grid</span>
                    </button>
                  </div>
                </div>
              )}

              {/* --- CONTACT INFO --- */}
              {activeTab === 'contact' && (
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-display font-bold text-lg mb-1 text-indigo-500 flex items-center gap-2"><Mail className="w-5 h-5" /> Contact Info</h3>
                  <p className="text-xs text-gray-400 mb-6">Shown on the Contact page and the Footer across the whole site.</p>

                  <div className="space-y-5 text-xs font-semibold max-w-lg">
                    <div>
                      <label className="block text-gray-400 mb-1.5 uppercase tracking-wider font-bold">Support Email</label>
                      <input type="email" value={contactInfo.support_email} onChange={(e) => setContactInfo({ ...contactInfo, support_email: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1.5 uppercase tracking-wider font-bold">Phone (optional)</label>
                      <input type="text" value={contactInfo.phone} onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1.5 uppercase tracking-wider font-bold">Address (optional)</label>
                      <input type="text" value={contactInfo.address} onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1.5 uppercase tracking-wider font-bold">Website URL</label>
                      <input type="text" value={contactInfo.website} onChange={(e) => setContactInfo({ ...contactInfo, website: e.target.value })} className={inputClass} />
                    </div>

                    <button
                      onClick={handleSaveContactInfo}
                      disabled={contactSaving}
                      id="save-contact-content-btn"
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-white rounded-xl transition cursor-pointer shadow-lg inline-flex items-center gap-1.5"
                    >
                      {contactSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4.5 h-4.5" />}
                      <span>Save Contact Info</span>
                    </button>
                  </div>
                </div>
              )}

              {/* --- PRICING & TIMER --- */}
              {activeTab === 'pricing' && (
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-display font-bold text-lg mb-1 text-indigo-500">Pricing & Countdown Timer</h3>
                  <p className="text-xs text-gray-400 mb-6">Instantly set real-time pricing figures and coupon timer durations enforced on landing screens.</p>

                  <form onSubmit={handleSaveConfigs} className="space-y-6 text-xs font-bold uppercase tracking-wider">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-400 mb-2">Discount Price (₹)</label>
                        <input
                          type="number"
                          value={priceAmount}
                          onChange={(e) => setPriceAmount(e.target.value)}
                          className={`${inputClass} font-mono normal-case`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 mb-2">Original Price (Strike-through) (₹)</label>
                        <input
                          type="number"
                          value={originalPriceAmount}
                          onChange={(e) => setOriginalPriceAmount(e.target.value)}
                          className={`${inputClass} font-mono normal-case`}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 mb-2">Countdown Timer Duration (Hours)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={timerHours}
                        onChange={(e) => setTimerHours(e.target.value)}
                        className={`${inputClass} font-mono normal-case`}
                        required
                      />
                      <span className="text-[10px] text-gray-500 font-normal italic lowercase mt-1.5 block">
                        Changing this resets the timer starting milestone back to zero on the homepage.
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      id="save-config-submit-btn"
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 font-extrabold text-white rounded-xl transition cursor-pointer shadow-lg inline-flex items-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-5.5 h-5.5 animate-spin" /> : (
                        <>
                          <Settings className="w-4.5 h-4.5" />
                          <span>Apply Pricing Configurations</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* --- PAYMENT METHOD (UPI QR + ID) --- */}
              {activeTab === 'upi' && (
                <div className={`p-6 rounded-2xl border ${cardClass}`}>
                  <h3 className="font-display font-bold text-lg mb-1 text-indigo-500 flex items-center gap-2">
                    <QrCode className="w-5 h-5" /> Payment Method
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">This QR code is shown to buyers on the "Buy Now" screen. They pay you directly; review each screenshot in Manage Users.</p>

                  <form onSubmit={handleSaveUpiConfig} className="space-y-6 text-xs font-bold uppercase tracking-wider">
                    <div>
                      <label className="block text-gray-400 mb-2">QR Code Image</label>
                      <label
                        htmlFor="upi-qr-upload"
                        className={`flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition ${
                          darkMode ? 'border-slate-800 hover:border-indigo-500' : 'border-slate-300 hover:border-indigo-500'
                        }`}
                      >
                        {qrImage ? (
                          <div className="relative">
                            <img src={qrImage} alt="UPI QR preview" className="w-32 h-32 object-contain rounded-lg bg-white p-1" />
                            <button
                              type="button"
                              onClick={handleRemoveQrImage}
                              title="Remove this QR code"
                              className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <span className="block mt-2 text-[10px] font-semibold text-gray-400 normal-case text-center">Click image to replace, or ✕ to remove</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-indigo-500" />
                            <span className="text-[11px] font-semibold text-gray-400 normal-case">Upload your UPI QR code image</span>
                          </>
                        )}
                        <input ref={qrFileInputRef} id="upi-qr-upload" type="file" accept="image/*" className="hidden" onChange={handleQrImageChange} />
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={upiSaving}
                      id="save-upi-config-btn"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 font-extrabold text-white rounded-xl transition cursor-pointer shadow-lg inline-flex items-center gap-1.5"
                    >
                      {upiSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                          <QrCode className="w-4.5 h-4.5" />
                          <span>Save Payment Method</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Screenshot lightbox */}
        {expandedScreenshot && (
          <div
            className="fixed inset-0 z-[200] bg-slate-950/90 flex items-center justify-center p-6 cursor-zoom-out"
            onClick={() => setExpandedScreenshot(null)}
          >
            <img src={expandedScreenshot} alt="Payment screenshot full view" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
          </div>
        )}

      </div>
    </div>
  );
}
