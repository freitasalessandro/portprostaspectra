import HeroSection from "@/components/HeroSection";
import MarqueeBar from "@/components/MarqueeBar";
import ServicesSection from "@/components/ServicesSection";
import StatsSection from "@/components/StatsSection";
import PortfolioSection from "@/components/PortfolioSection";
import CTASection from "@/components/CTASection";

const Index = () => {
  return (
    <main className="bg-background text-foreground overflow-x-hidden">
      <HeroSection />
      <MarqueeBar />
      <ServicesSection />
      <StatsSection />
      <PortfolioSection />
      <CTASection />
    </main>
  );
};

export default Index;
