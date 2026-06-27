import { Link } from 'react-router-dom';
import { AuthShell, WelcomeAside, Stepper } from './AuthShell.jsx';
import { CHROME_URL } from 'src/marketing/components/Button.jsx';
import {
  ChromeIcon, TargetIcon, SendIcon, ChartIcon, ShieldIcon, ArrowRightIcon, CheckCircleIcon,
} from './icons.jsx';

const INSTALL_STEPS = [
  { n: 1, t: 'Add to Chrome', d: 'Click the button below to open the Chrome Web Store.' },
  { n: 2, t: 'Add Extension', d: 'Click “Add extension” in the confirmation popup.' },
  { n: 3, t: 'Pin to Chrome', d: 'Pin the Spurly icon to your toolbar for easy access.' },
];

const CAPABILITIES = [
  { Icon: TargetIcon, t: 'Capture Leads', d: 'Extract leads from LinkedIn profiles and Sales Navigator' },
  { Icon: SendIcon, t: 'Automate Outreach', d: 'Send personalized connection requests and follow-ups' },
  { Icon: ChartIcon, t: 'Track & Optimize', d: 'Monitor performance and optimize your campaigns' },
  { Icon: ShieldIcon, t: 'Safe & Compliant', d: 'Built with safety in mind. Your account is protected' },
];

/**
 * Step 3 — Install the Spurly Chrome extension. Protected route. Final
 * onboarding screen; the primary CTA opens the Chrome Web Store listing.
 */
export default function InstallExtensionPage() {
  return (
    <AuthShell aside={<WelcomeAside step={3} total={3} credits={100} allSet />} bodyTop>
      <div className="sp-card sp-card--wide">
        <Stepper current={3} />

        <div className="sp-card__head">
          <h2 className="sp-card__title">Install the <span className="acc">Spurly</span> Chrome Extension</h2>
          <p className="sp-card__sub">Install the extension to start capturing leads, automating outreach and growing your pipeline on LinkedIn.</p>
        </div>

        <div className="sp-store">
          <ChromeIcon s={40} />
          <div>
            <div className="sp-store__name">Works on Chrome Browser</div>
            <div className="sp-store__ver">Version 88 and above</div>
          </div>
          <div className="sp-store__rate">
            <div className="sp-store__stars">★★★★★</div>
            <div className="sp-store__count">4.9/5 from 500+ users</div>
          </div>
        </div>

        <div className="sp-howto">
          <div className="sp-howto__h">How to install</div>
          <div className="sp-installsteps">
            {INSTALL_STEPS.map((s) => (
              <div className="sp-istep" key={s.n}>
                <span className="sp-istep__num">{s.n}</span>
                <div>
                  <div className="sp-istep__t">{s.t}</div>
                  <div className="sp-istep__d">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <a className="sp-btn sp-btn--primary" href={CHROME_URL} target="_blank" rel="noopener noreferrer" style={{ marginTop: 20, textDecoration: 'none' }}>
          <ChromeIcon s={22} /> Add Spurly to Chrome <ArrowRightIcon s={18} />
        </a>

        <div className="sp-install-meta">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CheckCircleIcon s={15} /> 100% safe and secure</span>
          <span>·</span>
          <span>Trusted by 500+ professionals</span>
        </div>

        <div className="sp-howto" style={{ marginTop: 24, borderTop: '1px solid var(--sp-line)', paddingTop: 20 }}>
          <div className="sp-howto__h" style={{ textAlign: 'center', color: 'var(--sp-primary)' }}>What you can do with Spurly</div>
          <div className="sp-bonus__grid" style={{ marginTop: 6 }}>
            {CAPABILITIES.map(({ Icon, t, d }) => (
              <div className="sp-bonus__item" key={t}>
                <span className="sp-bonus__ic"><Icon s={16} /></span>
                <div>
                  <div className="sp-istep__t" style={{ fontSize: 13.5 }}>{t}</div>
                  <div className="sp-bonus__t">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="sp-foot-switch" style={{ marginTop: 22 }}>
          Already installed? <Link className="sp-link" to="/dashboard">Go to your dashboard</Link>
        </p>
      </div>
    </AuthShell>
  );
}
