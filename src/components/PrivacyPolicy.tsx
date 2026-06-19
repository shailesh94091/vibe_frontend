import React from 'react';
import { useNavigate } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-2xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-primary hover:opacity-80 mb-6 font-label-md text-sm cursor-pointer"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span> Back
      </button>

      <div className="bg-white/40 backdrop-blur-3xl border border-white/20 rounded-3xl p-8 shadow-xl">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Privacy Policy</h2>
        <p className="font-label-md text-xs text-outline mb-6">Last updated: June 19, 2026</p>

        <div className="space-y-6 font-body-md text-on-surface-variant text-sm leading-relaxed">
          <section>
            <h3 className="font-label-md text-on-surface mb-2 font-bold">1. Data Ingestion & Collection</h3>
            <p>
              Echo collects email addresses, usernames, and profile metadata during registration. To operate the "Bridge" social-intent mapping engine, we temporarily sync recent captions, post titles, and hashtags from your authorized third-party accounts (Instagram, TikTok, X).
            </p>
          </section>

          <section>
            <h3 className="font-label-md text-on-surface mb-2 font-bold">2. Use of Data & Cosine Matching</h3>
            <p>
              Your data is parsed to build your "Echo Cloud" interest taxonomy. Echo uses a vector-based cosine similarity engine to identify compatibility scores between active profiles. We do not sell, rent, or trade your social profile data or metadata with any advertising networks or third-party brokers.
            </p>
          </section>

          <section>
            <h3 className="font-label-md text-on-surface mb-2 font-bold">3. Access & Control</h3>
            <p>
              You can toggle your visibility to "FriendsOnly" in your Profile Sanctuary. Disconnecting a gate deletes stored tokens and synced metadata instantly from the `social_accounts` store.
            </p>
          </section>

          <section>
            <h3 className="font-label-md text-on-surface mb-2 font-bold">4. Security Measures</h3>
            <p>
              All authorization headers and cookies containing JWT identifiers use secure HttpOnly storage flags to prevent client-side script interception (XSS).
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
