import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeBar from "@/components/MarqueeBar";
import ManifestoSection from "@/components/ManifestoSection";
import ArsenalSection from "@/components/ArsenalSection";
import CasesSection from "@/components/CasesSection";
import TrustedBrandsSection from "@/components/TrustedBrandsSection";
import CTASection from "@/components/CTASection";
import WhatsAppButton from "@/components/WhatsAppButton";
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
