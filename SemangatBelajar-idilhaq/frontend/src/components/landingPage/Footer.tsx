import logo from '../../assets/logo.svg';
import bg from '../../assets/bg.svg';

export default function Footer() {
  return (
    <footer id="landing-footer" className="relative w-full h-[200px] overflow-hidden mt-40">
      {/* Background image */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white to-transparent z-10"></div>
        <img src={bg} alt="Forest background" className="w-full h-full object-cover" />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col justify-center items-center h-full">
        <img src={logo} alt="ECOSTEPS logo" className="w-40 mb-2" />
        <p className="text-white text-sm">© 2025 ECOSTEPS.Team.io</p>
      </div>
    </footer>
  );
}
