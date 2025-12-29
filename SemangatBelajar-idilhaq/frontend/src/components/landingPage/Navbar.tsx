import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import logo from '../../assets/logo.svg';
import { ListIcon, XIcon } from '@phosphor-icons/react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (isMobile) {
      setIsMenuOpen(false);
    }
  };

  return (
    <nav id="landing-navbar" className="z-100 fixed top-0 lg:top-20 w-full">
      {/* Mobile/Tablet Header */}
      {isMobile && (
        <div className="flex justify-between items-center px-6 py-4 bg-black/90 backdrop-blur-md">
          <img className="w-20" src={logo} alt="logo" />
          <button id="landing-navbar-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white p-2">
            {isMenuOpen ? <XIcon size={24} weight="bold" /> : <ListIcon size={24} weight="bold" />}
          </button>
        </div>
      )}

      {/* Mobile Menu */}
      {isMobile && isMenuOpen && (
        <div className="bg-black/90 backdrop-blur-md w-full py-4 pb-10 px-6 flex flex-col">
          <ul className="flex flex-col space-y-4 mb-6">
            <li>
              <a id="landing-nav-home-mobile" onClick={() => scrollToSection('hero')} className="text-white font-medium hover:text-[#25E82F] transition-colors duration-150 block py-2">
                Home
              </a>
            </li>
            <li>
              <a id="landing-nav-perkenalan-mobile" onClick={() => scrollToSection('pengenalan')} className="text-white font-medium hover:text-[#25E82F] transition-colors duration-150 block py-2">
                Perkenalan
              </a>
            </li>
            <li>
              <a id="landing-nav-video-mobile" onClick={() => scrollToSection('video')} className="text-white font-medium hover:text-[#25E82F] transition-colors duration-150 block py-2">
                Video
              </a>
            </li>
            <li>
              <a id="landing-nav-fitur-mobile" onClick={() => scrollToSection('fitur')} className="text-white font-medium hover:text-[#25E82F] transition-colors duration-150 block py-2">
                Solusi
              </a>
            </li>
          </ul>
          <div className="flex flex-col space-y-3">
            <Link id="landing-nav-login-mobile" to="/Login" className="text-center hover:text-green-500 duration-200 transition-colors text-white border-2 py-2 rounded-full border-[#25E82F] font-medium">
              Masuk
            </Link>
            <Link id="landing-nav-register-mobile" to="/Register" className="text-center bg-[#25E82F] hover:bg-green-600 duration-200 transition-colors text-white py-2 rounded-full font-medium">
              Daftar
            </Link>
          </div>
        </div>
      )}

      {/* Desktop Navbar */}
      {!isMobile && (
        <div className="flex justify-center items-center w-full top-20">
          <div className="flex fixed w-auto justify-center items-center p-4 bg-black/20 rounded-full backdrop-blur-[30.6px] shadow-lg">
            <div className="flex justify-between items-center gap-20 pl-8">
              <div className="flex items-center gap-10">
                <img className="w-25" src={logo} alt="logo" />
                <ul>
                  <li className="group inline-flex items-center gap-2 mr-6 cursor-pointer">
                    <a id="landing-nav-home-desktop" onClick={() => scrollToSection('hero')} className="text-white font-medium transition-colors duration-150 group-hover:text-[#25E82F] cursor-pointer">
                      Home
                    </a>
                  </li>
                  <li className="inline-block mr-6">
                    <a id="landing-nav-perkenalan-desktop" onClick={() => scrollToSection('pengenalan')} className="text-white font-medium hover:text-[#25E82F] transition-colors duration-150 cursor-pointer">
                      Perkenalan
                    </a>
                  </li>
                  <li className="inline-block mr-6">
                    <a id="landing-nav-video-desktop" onClick={() => scrollToSection('video')} className="text-white font-medium hover:text-[#25E82F] transition-colors duration-150 cursor-pointer">
                      Video
                    </a>
                  </li>
                  <li className="inline-block mr-6">
                    <a id="landing-nav-fitur-desktop" onClick={() => scrollToSection('fitur')} className="text-white font-medium hover:text-[#25E82F] transition-colors duration-150 cursor-pointer">
                      Solusi
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <Link id="landing-nav-login-desktop" to="/Login" className="mr-4 hover:text-green-500 duration-200 transition-colors text-white border-2 px-6 py-2 rounded-full border-[#25E82F] font-medium">
                  Masuk
                </Link>
                <Link id="landing-nav-register-desktop" to="/Register" className="bg-[#25E82F] hover:bg-green-600 duration-200 transition-colors text-md text-white px-8 py-2 rounded-full font-medium">
                  Daftar
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
