import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Profile from '../../assets/profile.svg';
import logoNavbar from '../../assets/navbarLogo.svg';
import * as Phospor from '@phosphor-icons/react';
import NotePencil from '../../assets/NotePencil.svg';
import ConfirmOverlay from '../../toast/ConfirmOverlay';

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:8081/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.username || '');
        setEmail(data.email || '');
      })
      .catch(() => {
        setUsername('');
        setEmail('');
      });
  }, []);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
  }

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      {/* Overlay konfirmasi logout */}
      {showConfirm && (
        <ConfirmOverlay
          message="Yakin ingin logout?"
          onConfirm={() => {
            setShowConfirm(false);
            handleLogout();
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Sidebar Desktop & Tablet */}
      <div id="dashboard-navbar-desktop" className="hidden md:flex flex-col h-full">
        {/* Logo & Profil */}
        <div className="flex-shrink-0">
          <img src={logoNavbar} alt="logoNavbar" className="mb-6" />
          <div className="flex gap-6 items-center justify-start pl-7 mb-6">
            <img src={Profile} alt="Profile" className="w-12 rounded-full" />
            <div className="flex flex-col justify-center">
              <div className="font-bold">{username || '...'}</div>
              <div className="text-xs text-[#9D9D9D]">{(email?.length > 10 ? email.slice(0, 15) + '...' : email) || '...'}</div>
            </div>
          </div>
        </div>
        {/* Menu */}
        <nav className="flex-1 flex flex-col gap-5 px-6 mb-4">
          <Link id="dashboard-nav-dashboard" to="/Dashboard" className={`flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${isActive('/Dashboard') ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.HouseSimpleIcon size={20} weight="bold" /> Dashboard
          </Link>
          <Link id="dashboard-nav-laporan" to="/Laporan" className={`flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${isActive('/Laporan') ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.NotePencilIcon size={20} weight="bold" /> Laporan
          </Link>
          <Link id="dashboard-nav-tantangan" to="/Tantangan" className={`flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${isActive('/Tantangan') ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.CheckCircleIcon size={20} weight="bold" /> Tantangan
          </Link>
          <Link id="dashboard-nav-forum" to="/Forum" className={`flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${isActive('/Forum') ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.HandWavingIcon size={20} weight="bold" /> Forum
          </Link>
          <Link id="dashboard-nav-artikel" to="/Artikel" className={`flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${isActive('/Artikel') ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.ArticleIcon size={20} weight="bold" /> Artikel
          </Link>
        </nav>
        {/* Report Box & Logout */}
        <div className="flex-shrink-0 px-6 mb-4">
          <div className="bg-[#008207] text-white h-[100px] rounded-[15px] mb-12">
            <div className="flex gap-2 pl-6 items-center h-full">
              <div>
                <h3 className="max-w-[150px] font-medium text-xs mb-2">Buat laporanmu sekarang !</h3>
                <Link to="/Laporan">
                  <button id="dashboard-sidebar-lapor" className="cursor-pointer text-xs text-[#009B08] bg-white rounded-md px-5 py-1 font-medium">lapor</button>
                </Link>
              </div>
              <img className="ml-auto bottom-26 absolute left-35" src={NotePencil} alt="NotePencil" />
            </div>
          </div>
          <button id="dashboard-logout" onClick={() => setShowConfirm(true)} className="cursor-pointer w-full bg-[#EE0000] text-white py-2 rounded-xl font-semibold hover:bg-red-700">
            LogOut
          </button>
        </div>
      </div>

      {/* Mobile Navbar (Top) */}
      <div id="dashboard-navbar-mobile" className="fixed md:hidden top-0 left-0 right-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-b-gray-200">
          <div className="flex items-center gap-3">
            <img src={Profile} alt="Profile" className="w-8 h-8 rounded-full" />
            <div className="flex flex-col ml-2">
              <span className="font-bold text-xs">{username || '...'}</span>
              <span className="text-[10px] text-[#9D9D9D]">{(email?.length > 20 ? email.slice(0, 10) + '...' : email) || '...'}</span>
            </div>
          </div>
          {/* Hamburger icon */}
          <button id="dashboard-navbar-mobile-toggle" className="p-2" onClick={() => setShowMobileNav((v) => !v)} aria-label="Menu">
            <Phospor.List size={28} weight="bold" />
          </button>
        </div>
        {/* Overlay redup saat navigasi mobile muncul */}
        {showMobileNav && (
          <>
            {/* Overlay: mulai dari bawah navbar */}
            <div className="fixed left-0 right-0 bottom-0 top-[62px] z-40 bg-black/40" onClick={() => setShowMobileNav(false)} />
            <div className="flex flex-col bg-white border-b border-b-gray-200 shadow-md px-4 py-2 animate-fadeIn z-50 relative">
              <Link id="dashboard-nav-dashboard-mobile" to="/Dashboard" className={`flex items-center gap-2 py-2 ${isActive('/Dashboard') ? 'text-green-700 font-bold' : 'text-gray-700'}`} onClick={() => setShowMobileNav(false)}>
                <Phospor.HouseSimpleIcon size={20} weight="bold" /> Dashboard
              </Link>
              <Link id="dashboard-nav-laporan-mobile" to="/Laporan" className={`flex items-center gap-2 py-2 ${isActive('/Laporan') ? 'text-green-700 font-bold' : 'text-gray-700'}`} onClick={() => setShowMobileNav(false)}>
                <Phospor.NotePencilIcon size={20} weight="bold" /> Laporan
              </Link>
              <Link id="dashboard-nav-tantangan-mobile" to="/Tantangan" className={`flex items-center gap-2 py-2 ${isActive('/Tantangan') ? 'text-green-700 font-bold' : 'text-gray-700'}`} onClick={() => setShowMobileNav(false)}>
                <Phospor.CheckCircleIcon size={20} weight="bold" /> Tantangan
              </Link>
              <Link id="dashboard-nav-forum-mobile" to="/Forum" className={`flex items-center gap-2 py-2 ${isActive('/Forum') ? 'text-green-700 font-bold' : 'text-gray-700'}`} onClick={() => setShowMobileNav(false)}>
                <Phospor.HandWavingIcon size={20} weight="bold" /> Forum
              </Link>
              <Link id="dashboard-nav-artikel-mobile" to="/Artikel" className={`flex items-center gap-2 py-2 ${isActive('/Artikel') ? 'text-green-700 font-bold' : 'text-gray-700'}`} onClick={() => setShowMobileNav(false)}>
                <Phospor.ArticleIcon size={20} weight="bold" /> Artikel
              </Link>
              <button
                id="dashboard-logout-mobile"
                onClick={() => {
                  setShowMobileNav(false);
                  setShowConfirm(true);
                }}
                className="flex items-center gap-2 mt-6 mb-4 p-2 bg-red-600 text-white rounded-lg font-semibold"
              >
                <Phospor.SignOut size={20} weight="bold" /> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
