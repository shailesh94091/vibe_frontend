import React from 'react';
import { useNavigate } from 'react-router-dom';

export const TermsOfService: React.FC = () => {
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
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">Terms of Service</h2>
        <p className="font-label-md text-xs text-outline mb-6">Last updated: June 19, 2026</p>

        <div className="space-y-6 font-body-md text-on-surface-variant text-sm leading-relaxed">
          <section>
            <h3 className="font-label-md text-on-surface mb-2 font-bold">1. Acceptable Behavior</h3>
            <p>
              Echo is a sanctuary for high-frequency interest matching. Users are expected to interact respectfully. Harassment, hate speech, spamming, or impersonation of others will result in immediate suspension.
            </p>
          </section>

          <section>
            <h3 className="font-label-md text-on-surface mb-2 font-bold">2. Crawling & Scraping Prohibition</h3>
            <p>
              You agree not to crawl, scrape, extract, or mine profile details or interest vectors from the Echo Arena. Automated query bursts to our matching endpoints are monitored and rate-limited.
            </p>
          </section>

          <section>
            <h3 className="font-label-md text-on-surface mb-2 font-bold">3. Account Integrity</h3>
            <p>
              Users are responsible for securing their password and authentication session cookies. All actions conducted under your registered account are your responsibility.
            </p>
          </section>

          <section>
            <h3 className="font-label-md text-on-surface mb-2 font-bold">4. Limitation of Liability</h3>
            <p>
              Echo facilitates pairing calculations based on shared interest profiles. We are not liable for offline interactions, communications, or transactions initiated through our platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
