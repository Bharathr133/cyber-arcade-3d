import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { soundSynth } from '../utils/soundSynth.js';

export default function PrivacyTermsPage({ onBackToHome }) {
  const [activeTab, setActiveTab] = useState('PRIVACY'); // 'PRIVACY' | 'TERMS'

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pb-20 box-border animate-fade-in font-body text-zinc-800">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <button
          type="button"
          onClick={() => {
            soundSynth.playClick();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all cursor-pointer"
        >
          <ArrowLeft size={15} />
          <span>BACK TO ARENA</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              soundSynth.playClick();
              setActiveTab('PRIVACY');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'PRIVACY' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => {
              soundSynth.playClick();
              setActiveTab('TERMS');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'TERMS' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            Terms of Service
          </button>
        </div>
      </div>

      {/* Main Document Content */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 sm:p-10 shadow-sm leading-relaxed text-sm text-zinc-700 flex flex-col gap-6">
        
        {/* ========================================================================= */}
        {/* PRIVACY POLICY */}
        {/* ========================================================================= */}
        {activeTab === 'PRIVACY' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-black font-heading text-zinc-900 tracking-tight m-0">
                Privacy Policy — games4u
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-1 m-0">
                Last updated: August 2026 • Platform: games4u Strategy Arena (India)
              </p>
            </div>

            <p>
              Welcome to <strong>games4u</strong> (accessible from <a href="https://onlinefreegames.vercel.app" className="text-blue-600 font-semibold hover:underline">https://onlinefreegames.vercel.app</a>). We are committed to protecting your privacy and being completely transparent about how our platform operates.
            </p>

            <p>
              This Privacy Policy explains what information is collected when you play our 5 board games (Connect 4, Tic-Tac-Toe, Gomoku, Memory Match, and Ludo Championship), how we use it for gameplay, and how you can control your data.
            </p>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              1. What We Believe &amp; Stand For
            </h2>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li><strong>100% Free Game Arena:</strong> games4u is completely free to play. We do not ask for credit cards, payment details, or subscriptions.</li>
              <li><strong>No Mandatory Accounts:</strong> You can play as a Guest right away without providing an email address or personal details.</li>
              <li><strong>Zero Data Selling:</strong> We do not sell, rent, or monetize your personal information to any third parties or advertisers.</li>
              <li><strong>No Intrusive Ad Tracking:</strong> We do not track your activity across other websites.</li>
            </ul>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              2. What Information We Collect
            </h2>

            <h3 className="text-sm font-bold text-zinc-900 m-0">A. Information You Provide</h3>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li><strong>GamerTag / Nickname:</strong> The display name you choose for multiplayer matches and leaderboard rankings.</li>
              <li><strong>Avatar:</strong> The avatar icon/color you pick from our character selection.</li>
              <li><strong>Optional Account:</strong> If you voluntarily choose to sign in with Google or Email to save your progress across multiple devices.</li>
              <li><strong>Contact Feedback:</strong> Any message, bug report, or idea you send to us through the contact page.</li>
            </ul>

            <h3 className="text-sm font-bold text-zinc-900 m-0 mt-2">B. Game &amp; Match Data</h3>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li><strong>Match Records:</strong> Your game wins, losses, draws, and ELO skill rating.</li>
              <li><strong>Live Match Coordinates:</strong> Temporary board move coordinates sent during an active multiplayer game (e.g. dropping a disc or rolling a dice). These live coordinates are not stored after the match ends.</li>
            </ul>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              3. How Data is Stored on Your Device
            </h2>
            <p>
              To make the platform fast and work without forcing you to log in, games4u saves your guest stats in your browser’s private <code className="bg-zinc-100 px-1 py-0.5 rounded text-zinc-800 font-bold">localStorage</code>:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>Your chosen player nickname and avatar.</li>
              <li>Your sound effects mute/unmute preference.</li>
              <li>Your local match history and rating.</li>
            </ul>
            <p className="text-xs text-zinc-500">
              You can clear this anytime by clearing your browser cache or site data.
            </p>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              4. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>To let you create or join private multiplayer games using 6-character room codes.</li>
              <li>To calculate skill ratings and display the top players on global leaderboards.</li>
              <li>To prevent cheating and ensure fair matches for everyone.</li>
              <li>To fix bugs and respond to your messages when you reach out for help.</li>
            </ul>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              5. Your Rights &amp; Data Deletion
            </h2>
            <p>
              You have full control over your data:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li>You can change your GamerTag and avatar whenever you want in the profile settings.</li>
              <li>You can erase all your local guest data by clearing your browser storage.</li>
              <li>If you created a registered cloud account and want it completely deleted, you can send us a message via our <a href="/contact" className="text-blue-600 font-bold hover:underline">Contact Center</a> and we will delete your account records.</li>
            </ul>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              6. Governing Location
            </h2>
            <p>
              games4u is created and operated from <strong>India</strong> for players around the world.
            </p>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              7. Contact Us
            </h2>
            <p>
              If you have any questions or feedback about our privacy practices, please contact us directly:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li><strong>Contact Center:</strong> <a href="/contact" className="text-blue-600 font-bold hover:underline">https://onlinefreegames.vercel.app/contact</a></li>
              <li><strong>Website:</strong> <a href="https://onlinefreegames.vercel.app" className="text-blue-600 font-bold hover:underline">https://onlinefreegames.vercel.app</a></li>
            </ul>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TERMS OF SERVICE */}
        {/* ========================================================================= */}
        {activeTab === 'TERMS' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl font-black font-heading text-zinc-900 tracking-tight m-0">
                Terms of Service — games4u
              </h1>
              <p className="text-xs text-zinc-500 font-mono mt-1 m-0">
                Last updated: August 2026 • Platform: games4u Strategy Arena (India)
              </p>
            </div>

            <p>
              By accessing or playing on <strong>games4u</strong> (<a href="https://onlinefreegames.vercel.app" className="text-blue-600 font-semibold hover:underline">https://onlinefreegames.vercel.app</a>), you agree to these simple Terms of Service.
            </p>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              1. Platform Rules &amp; Permitted Use
            </h2>
            <p>
              games4u is a free online gaming platform offering 5 board games (Connect 4, Tic-Tac-Toe, Gomoku, Memory Match, and Ludo Championship). The games are provided for personal, non-commercial fun and entertainment.
            </p>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              2. Fair Play &amp; Player Conduct
            </h2>
            <p>To keep the arena fun and fair for everyone, all players agree to follow these rules:</p>
            <ul className="list-disc pl-5 flex flex-col gap-1.5">
              <li><strong>No Cheating or Bots:</strong> Using automated bot software, cheating tools, or hacking memory to manipulate game outcomes or ratings is strictly prohibited.</li>
              <li><strong>Respectful Usernames:</strong> Do not choose GamerTags that contain abusive language, hate speech, or harassment.</li>
              <li><strong>Good Sportsmanship:</strong> Do not intentionally stall turns or disrupt connections to force other players to quit.</li>
            </ul>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              3. Game Rooms &amp; Availability
            </h2>
            <p>
              Private 2-player rooms created with 6-character room codes are temporary and close automatically once the match is finished. We strive to keep the platform online and running smoothly, but the service is provided on an "as-is" basis without warranties of uninterrupted uptime.
            </p>

            <hr className="border-zinc-200 my-2" />

            <h2 className="text-lg font-bold font-heading text-zinc-900 m-0">
              4. Contact Us
            </h2>
            <p>
              If you have any questions or feedback about these terms, you can reach out via our contact page:
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-1">
              <li><strong>Contact Center:</strong> <a href="/contact" className="text-blue-600 font-bold hover:underline">https://onlinefreegames.vercel.app/contact</a></li>
              <li><strong>Website:</strong> <a href="https://onlinefreegames.vercel.app" className="text-blue-600 font-bold hover:underline">https://onlinefreegames.vercel.app</a></li>
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}
