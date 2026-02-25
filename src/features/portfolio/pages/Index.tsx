import Navbar from "@/features/portfolio/components/Navbar";
import HeroSection from "@/features/portfolio/components/HeroSection";
import MarqueeBar from "@/features/portfolio/components/MarqueeBar";
import ManifestoSection from "@/features/portfolio/components/ManifestoSection";
import ArsenalSection from "@/features/portfolio/components/ArsenalSection";
import CasesSection from "@/features/portfolio/components/CasesSection";
import TrustedBrandsSection from "@/features/portfolio/components/TrustedBrandsSection";
import CTASection from "@/features/portfolio/components/CTASection";
import WhatsAppButton from "@/features/portfolio/components/WhatsAppButton";
const Index = () => {
  return (
    <main className="bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <MarqueeBar />
      <ManifestoSection />
      <ArsenalSection />
      <CasesSection />
      <TrustedBrandsSection />
      <CTASection />
      <WhatsAppButton />
    </main>
  );
};

export default Index;
