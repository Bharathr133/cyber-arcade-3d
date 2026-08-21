import React, { useState } from 'react';
import { 
  ArrowLeft, MessageSquare, Send, CheckCircle2, AlertCircle, 
  HelpCircle, Bug, Sparkles, Mail, Clock, ShieldCheck 
} from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';
import { feedbackNotifier } from '../services/feedbackNotifier.js';

export default function ContactPage({ onBackToHome, currentUserProfile }) {
  const [feedbackType, setFeedbackType] = useState('FEEDBACK');
  const [email, setEmail] = useState(() => currentUserProfile?.email || '');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanMsg = message.trim();
    if (!cleanMsg || cleanMsg.length < 5) {
      setError('Please enter a message with at least 5 characters.');
      return;
    }

    try {
      soundSynth.playVictory();
      const submission = {
        id: Date.now(),
        type: feedbackType,
        category: feedbackType,
        email: email.trim(),
        message: cleanMsg,
        playerName: currentUserProfile?.name || 'Guest',
        rating: currentUserProfile?.rating || 1200,
        timestamp: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('arcade_feedback_submissions') || '[]');
      existing.unshift(submission);
      localStorage.setItem('arcade_feedback_submissions', JSON.stringify(existing));

      // Dispatch through secure serverless backend proxy (handles Discord webhook + Supabase server-side)
      await feedbackNotifier.sendTicket(submission);
    } catch (err) {}

    setSubmitted(true);
  };




  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-12 box-border animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <button
          type="button"
          onClick={() => {
            soundSynth.playClick();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>BACK TO ARENA</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <MessageSquare size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black font-heading tracking-tight text-slate-900 m-0">
              Contact Us & Player Feedback
            </h1>
            <p className="text-[11px] text-slate-500 font-medium m-0">
              Report bugs, propose features, or get support from the dev team
            </p>
          </div>
        </div>

        <div className="w-10" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Side: Contact Information & FAQ */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-base font-black font-heading text-slate-900 m-0">We Listen to Every Match</h2>
            <p className="text-xs text-slate-600 leading-relaxed m-0 font-medium">
              Have an idea for a new game, found a gameplay glitch, or want to give feedback on matchmaking? Submit a message and our team will review it.
            </p>

            <div className="flex flex-col gap-3 pt-2 border-t border-slate-200 text-xs text-slate-700">
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="text-blue-600 flex-shrink-0" />
                <span>Typical review response: <strong>Under 24 hours</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
                <span>Verified Anti-Cheat investigations</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3">
            <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
              COMMUNITY FAQ
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <strong className="text-slate-900 block mb-0.5">How are Elo ratings adjusted?</strong>
                <span className="text-slate-600 leading-relaxed">Ratings update automatically via chess-standard Elo formulas upon verified match finish.</span>
              </div>

              <div>
                <strong className="text-slate-900 block mb-0.5">Can I play locally on 1 screen?</strong>
                <span className="text-slate-600 leading-relaxed">Yes! Choose "2P Pass & Play" on any game to duel a friend on the same device.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Form */}
        <div className="md:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
            {submitted ? (
              <div className="py-12 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-black font-heading text-slate-900 m-0">Thank You for Your Feedback!</h3>
                <p className="text-xs text-slate-600 max-w-md leading-relaxed m-0 font-medium">
                  Your message has been received and logged into our product dispatch queue. We appreciate your help making <strong>games4u</strong> the best board game arena on the web!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setMessage('');
                  }}
                  className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-black mt-2 cursor-pointer"
                >
                  SEND ANOTHER MESSAGE
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-2">
                    SELECT CATEGORY
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'FEEDBACK', label: 'Feedback' },
                      { id: 'BUG', label: 'Bug Report' },
                      { id: 'FEATURE', label: 'New Feature' },
                      { id: 'QUESTION', label: 'Question' }
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFeedbackType(cat.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          feedbackType === cat.id 
                            ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    YOUR EMAIL (OPTIONAL)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm text-slate-900 outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    YOUR MESSAGE OR BUG DESCRIPTION
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you experienced, game rules feedback, or suggestions..."
                    className={`w-full p-3 rounded-xl border text-sm text-slate-900 outline-none focus:border-blue-500 bg-white ${
                      error ? 'border-red-400' : 'border-slate-300'
                    }`}
                  />
                  {error && <div className="text-xs text-red-600 font-bold mt-1">{error}</div>}
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3.5 rounded-xl text-sm font-heading font-black flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Send size={16} />
                  <span>SUBMIT MESSAGE</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
