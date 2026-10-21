import { useEffect } from 'react';
import { AiShowcase } from '../components/landing/AiShowcase';
import { DashboardShowcase } from '../components/landing/DashboardShowcase';
import { ExtensionShowcase } from '../components/landing/ExtensionShowcase';
import { FaqSection } from '../components/landing/FaqSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { HeroSection } from '../components/landing/HeroSection';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { FinalCta, LandingFooter } from '../components/landing/LandingFooter';
import { LandingNav } from '../components/landing/LandingNav';
import { PrivacySection } from '../components/landing/PrivacySection';
import { ProblemSection } from '../components/landing/ProblemSection';
import { UserGuideSection } from '../components/landing/UserGuideSection';
import '../landing.css';

export function LandingPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'WhereMyApplication — Job Application Tracker';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="landing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <LandingNav />
      <main id="main">
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <HowItWorksSection />
        <DashboardShowcase />
        <AiShowcase />
        <ExtensionShowcase />
        <UserGuideSection />
        <PrivacySection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
