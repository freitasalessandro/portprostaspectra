import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MarqueeBar from "@/components/MarqueeBar";
import TextRevealSection from "@/components/TextRevealSection";
import HorizontalScrollSection from "@/components/HorizontalScrollSection";
import DiagonalShowcase from "@/components/DiagonalShowcase";
import StatsSection from "@/components/StatsSection";
import CTASection from "@/components/CTASection";

const Index = () => {
  return (
    <main className="bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <MarqueeBar />
      <TextRevealSection />
      <HorizontalScrollSection />
      <DiagonalShowcase />
      <StatsSection />
      <CTASection />
    </main>
  );
};

export default Index;
