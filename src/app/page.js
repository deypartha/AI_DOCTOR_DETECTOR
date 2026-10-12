import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import AISymptomSection from "../components/AISymptomSection";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import FeaturedHospitals from "../components/FeaturedHospitals";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <AISymptomSection />
      <Features />
      <HowItWorks />
      <FeaturedHospitals />
      <CTA />
      <Footer />
    </>
  );
}
