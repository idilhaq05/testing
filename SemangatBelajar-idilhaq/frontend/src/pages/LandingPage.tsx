import Navbar from '../components/landingPage/Navbar';
import HeroSection from '../components/landingPage/HeroSection';
import PengenalanWeb from '../components/landingPage/PengenalanWeb';
import VideoSection from '../components/landingPage/VideoSection';
import FiturUtama from '../components/landingPage/FiturUtama';
import Footer from '../components/landingPage/Footer';

export default function LandingPage() {
  return (
    <div id="page-landing">
      <Navbar />
      <HeroSection />
      <PengenalanWeb />
      <VideoSection />
      <FiturUtama />
      <Footer />
    </div>
  );
}
