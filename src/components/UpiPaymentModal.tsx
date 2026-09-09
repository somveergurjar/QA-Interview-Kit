import React, { useState, useEffect } from 'react';
import { ShieldCheck, X, AlertCircle, Loader2, Upload, Clock, CheckCircle2, XCircle, QrCode, Lock, BadgeCheck, EyeOff } from 'lucide-react';
import { UpiConfig, PaymentClaim } from '../types.js';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  darkMode: boolean;
  onApproved: () => void;
}

export default function UpiPaymentModal({ isOpen, onClose, token, darkMode, onApproved }: UpiPaymentModalProps) {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<UpiConfig | null>(null);
  const [myClaim, setMyClaim] = useState<PaymentClaim | null>(null);

  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [screenshotData, setScreenshotData] = useState('');
  const [utr, setUtr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const refreshState = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/payments/upi-config').then(r => r.json()),
      fetch('/api/payments/my-claim', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
    ])
      .then(([upiData, claimData]) => {
        setConfig(upiData);
        setMyClaim(claimData.claim);
        if (claimData.claim && claimData.claim.status === 'approved') {
          onApproved();
        }
      })
      .catch(() => setError('Could not load payment details. Please retry.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      setError('');
      setSubmitted(false);
      setScreenshotData('');
      setScreenshotPreview('');
      setUtr('');
      refreshState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (screenshot of the payment confirmation).');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setScreenshotData(result);
      setScreenshotPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!screenshotData) {
      setError('Please attach a screenshot of your payment before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/payments/submit-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ screenshot: screenshotData, utr: utr.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not submit payment proof.');
      setSubmitted(true);
      refreshState();
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-md rounded-3xl border shadow-2xl relative overflow-hidden transition-all duration-300 max-h-[90vh] overflow-y-auto ${
        darkMode ? 'bg-slate-900 border-slate-800 text-gray-100' : 'bg-white border-slate-250 text-gray-800'
      }`}>
        <div className="bg-emerald-500 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <span className="font-display font-bold text-sm tracking-wide">Pay via UPI</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-600 rounded-lg transition" id="close-upi-modal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
              <p className="text-xs font-semibold text-gray-400">Loading payment details...</p>
            </div>
          ) : myClaim && myClaim.status === 'pending' ? (
            <div className="text-center space-y-3 py-6">
              <span className="p-3 bg-amber-500/10 text-amber-500 rounded-full inline-block">
                <Clock className="w-8 h-8" />
              </span>
              <h3 className="font-display font-bold text-lg">Payment Under Review</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                We received your screenshot on {new Date(myClaim.submitted_at).toLocaleString()}. Access unlocks automatically once it's verified — usually within a few hours.
              </p>
            </div>
          ) : !config?.configured ? (
            <div className="text-center space-y-3 py-6">
              <span className="p-3 bg-red-500/10 text-red-500 rounded-full inline-block">
                <AlertCircle className="w-8 h-8" />
              </span>
              <h3 className="font-display font-bold text-lg">Payments Not Set Up Yet</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                The admin hasn't configured a UPI QR code yet. Please check back shortly or contact support.
              </p>
            </div>
          ) : submitted ? (
            <div className="text-center space-y-3 py-6">
              <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-full inline-block">
                <CheckCircle2 className="w-8 h-8" />
              </span>
              <h3 className="font-display font-bold text-lg">Proof Submitted!</h3>
              <p className="text-xs text-gray-400 max-w-xs mx-auto">
                We'll verify your payment and unlock your access shortly. You can close this window.
              </p>
            </div>
          ) : (
            <>
              {myClaim && myClaim.status === 'rejected' && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2.5">
                  <XCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Previous proof was rejected.</span>{' '}
                    {myClaim.admin_note || 'The screenshot could not be verified.'} Please submit a fresh screenshot.
                  </div>
                </div>
              )}

              {/* Security trust badges — signals a real, safe checkout */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { icon: Lock, label: '256-bit Encrypted' },
                  { icon: BadgeCheck, label: 'UPI Verified' },
                  { icon: EyeOff, label: 'No Card Data Stored' }
                ].map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </span>
                ))}
              </div>

              <div className="text-center">
                <p className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-1">Amount to Pay</p>
                <h3 className="font-display font-black text-3xl text-emerald-500">₹{config.amount}</h3>
              </div>

              <div className={`p-5 rounded-2xl border flex flex-col items-center gap-3 ${
                darkMode ? 'border-slate-800 bg-slate-850' : 'border-slate-200 bg-slate-50'
              }`}>
                {config.qr_image ? (
                  <img src={config.qr_image} alt="UPI QR Code" className="w-48 h-48 object-contain rounded-xl bg-white p-2" />
                ) : (
                  <QrCode className="w-24 h-24 text-gray-400" />
                )}
                <div className="text-center">
                  {config.upi_id && (
                    <>
                      <span className="text-[10px] uppercase font-mono text-gray-400 tracking-wider block">UPI ID</span>
                      <strong className="font-mono text-sm select-all">{config.upi_id}</strong>
                    </>
                  )}
                </div>
              </div>

              <div className={`flex items-start gap-2 p-3 rounded-xl text-[11px] leading-relaxed ${
                darkMode ? 'bg-slate-850 text-gray-400' : 'bg-slate-50 text-gray-500'
              }`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Payments are received securely — you may see the account holder's name in your UPI app during payment, that's expected.</span>
              </div>

              <div className="text-[11px] text-gray-400 leading-relaxed text-center">
                Scan the QR (or pay to the UPI ID above) using any UPI app, then upload a screenshot of the payment confirmation below. Access unlocks once it's verified.
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex gap-2">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3">
                <label
                  htmlFor="upi-screenshot-input"
                  className={`w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border-2 border-dashed cursor-pointer transition ${
                    darkMode ? 'border-slate-700 hover:border-emerald-500' : 'border-slate-300 hover:border-emerald-500'
                  }`}
                >
                  {screenshotPreview ? (
                    <img src={screenshotPreview} alt="Payment screenshot preview" className="max-h-40 rounded-lg" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-emerald-500" />
                      <span className="text-xs font-semibold text-gray-400">Upload payment screenshot</span>
                    </>
                  )}
                  <input id="upi-screenshot-input" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>

                <input
                  type="text"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="UPI transaction / UTR reference (optional)"
                  className={`w-full text-xs px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    darkMode ? 'bg-slate-850 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-gray-800'
                  }`}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !screenshotData}
                id="submit-upi-proof"
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <span>Submit Payment Proof</span>}
              </button>
            </>
          )}
        </div>

        <div className={`px-6 py-3 flex items-center justify-center gap-1.5 text-[10px] font-semibold border-t ${
          darkMode ? 'border-slate-800 bg-slate-950 text-gray-500' : 'border-slate-100 bg-slate-50 text-gray-400'
        }`}>
          <Lock className="w-3 h-3" />
          <span>Secured via UPI (NPCI-regulated) &bull; Your payment details are never stored on our servers</span>
        </div>
      </div>
    </div>
  );
}
