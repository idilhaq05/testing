import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Profile from '../../assets/profile.svg';
import logoNavbar from '../../assets/navbarLogo.svg';
import * as Phospor from '@phosphor-icons/react';
import ConfirmOverlay from '../../toast/ConfirmOverlay'; // import overlay

type AdminNavbarProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
};

export default function AdminNavbar({ activeTab, setActiveTab }: AdminNavbarProps) {
  const navigate = useNavigate();
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
    navigate('/login');
  }

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

      {/* Desktop & Tablet Sidebar */}
      <div id="admin-navbar-desktop" className="hidden md:flex flex-col h-full">
        {/* Logo & Profil */}
        <div className="flex-shrink-0">
          <img src={logoNavbar} alt="logoNavbar" className="mb-6" />
          <div className="flex gap-6 items-center justify-start pl-7 mb-6">
            <img src={Profile} alt="Profile" className="w-12 rounded-full" />
            <div className="flex flex-col justify-center">
              <div className="font-bold">{username || '...'}</div>
              <div className="text-xs text-[#9D9D9D]">{(email?.length > 10 ? email.slice(0, 15) + '...' : email) || '...'}</div>
              <div className="text-xs font-medium text-green-600">Administrator</div>
            </div>
          </div>
        </div>
        {/* Menu */}
        <nav className="flex-1 overflow-y-auto flex flex-col gap-6 px-6 mb-4">
          <button id="admin-nav-laporan" onClick={() => setActiveTab('laporan')} className={`cursor-pointer flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${activeTab === 'laporan' ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.NotePencilIcon size={20} weight="bold" /> Data Laporan
          </button>
          <button id="admin-nav-users" onClick={() => setActiveTab('users')} className={`cursor-pointer flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${activeTab === 'users' ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.UsersIcon size={20} weight="bold" /> Data User
          </button>
          <button id="admin-nav-forums" onClick={() => setActiveTab('forums')} className={`cursor-pointer flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${activeTab === 'forums' ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.ChatCircleTextIcon size={20} weight="bold" /> Data Forum
          </button>
          <button id="admin-nav-tantangan" onClick={() => setActiveTab('tantangan')} className={`cursor-pointer flex items-center gap-4 py-3 px-4 rounded-lg font-semibold text-green-700 ${activeTab === 'tantangan' ? 'bg-green-100' : 'hover:bg-green-100'}`}>
            <Phospor.ImageIcon size={20} weight="bold" /> Data Tantangan
          </button>
        </nav>
        {/* Logout Button */}
        <div className="flex-shrink-0 px-6 mb-4">
          <button id="admin-logout" onClick={() => setShowConfirm(true)} className="cursor-pointer w-full bg-[#EE0000] text-white py-2 rounded-xl font-semibold hover:bg-red-700">
            LogOut
          </button>
        </div>
      </div>

      {/* Mobile Navbar (Top) */}
      <div id="admin-navbar-mobile" className="fixed md:hidden top-0 left-0 right-0 z-50 bg-white flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b border-b-gray-200">
          <div className="flex items-center gap-3">
            {/* Logo disembunyikan di mobile */}
            <img src={Profile} alt="Profile" className="w-8 h-8 rounded-full" />
            <div className="flex flex-col ml-2">
              <span className="font-bold text-xs">{username || '...'}</span>
              <span className="text-[10px] text-[#9D9D9D]">{(email?.length > 20 ? email.slice(0, 10) + '...' : email) || '...'}</span>
            </div>
          </div>
          {/* Hamburger icon */}
          <button id="admin-navbar-mobile-toggle" className="p-2" onClick={() => setShowMobileNav((v) => !v)} aria-label="Menu">
            <Phospor.List size={28} weight="bold" />
          </button>
        </div>
        {/* Overlay redup saat navigasi mobile muncul */}
        {showMobileNav && (
          <>
            {/* Overlay: mulai dari bawah navbar */}
            <div className="fixed left-0 right-0 bottom-0 top-[62px] z-40 bg-black/40" onClick={() => setShowMobileNav(false)} />
            <div className="flex flex-col bg-white border-b border-b-gray-200 shadow-md px-4 py-2 animate-fadeIn z-50 relative">
              <button
                id="admin-nav-laporan-mobile"
                onClick={() => {
                  setActiveTab('laporan');
                  setShowMobileNav(false);
                }}
                className={`flex items-center gap-2 py-2 ${activeTab === 'laporan' ? 'text-green-700 font-bold' : 'text-gray-700'}`}
              >
                <Phospor.NotePencilIcon size={20} weight="bold" /> Data Laporan
              </button>
              <button
                id="admin-nav-users-mobile"
                onClick={() => {
                  setActiveTab('users');
                  setShowMobileNav(false);
                }}
                className={`flex items-center gap-2 py-2 ${activeTab === 'users' ? 'text-green-700 font-bold' : 'text-gray-700'}`}
              >
                <Phospor.UsersIcon size={20} weight="bold" /> Data User
              </button>
              <button
                id="admin-nav-forums-mobile"
                onClick={() => {
                  setActiveTab('forums');
                  setShowMobileNav(false);
                }}
                className={`flex items-center gap-2 py-2 ${activeTab === 'forums' ? 'text-green-700 font-bold' : 'text-gray-700'}`}
              >
                <Phospor.ChatCircleTextIcon size={20} weight="bold" /> Data Forum
              </button>
              <button
                id="admin-nav-tantangan-mobile"
                onClick={() => {
                  setActiveTab('tantangan');
                  setShowMobileNav(false);
                }}
                className={`flex items-center gap-2 py-2 ${activeTab === 'tantangan' ? 'text-green-700 font-bold' : 'text-gray-700'}`}
              >
                <Phospor.ImageIcon size={20} weight="bold" /> Data Tantangan
              </button>
              <button id="admin-logout-mobile" onClick={() => setShowConfirm(true)} className="flex items-center gap-2 mt-6 mb-4 p-2 bg-red-600 text-white rounded-lg font-semibold">
                <Phospor.SignOut size={20} weight="bold" /> Logout
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
