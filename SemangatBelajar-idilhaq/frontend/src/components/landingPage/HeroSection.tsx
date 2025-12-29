import bgImg from '../../assets/herosectionImg.svg';
import logo from '../../assets/logo.svg';

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="-z-1 relative flex flex-col items-center justify-center min-h-screen w-full"
      style={{
        background: `url(${bgImg}) center center/cover no-repeat, #14532d`,
      }}
    >
      <div className="relative z-10 flex flex-col items-center">
        <img className="w-[250px] md:w-[450px] lg:w-[800px]" src={logo} alt="logo" />
        <p className="text-center text-white max-w-[250px] md:max-w-[600px] text-sm md:text-xl lg:text-lg font-medium">Laporkan pencemeran di lingkunganmu secara mudah</p>
      </div>
    </section>
  );
}
