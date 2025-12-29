import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeftIcon, Eye, EyeSlash } from '@phosphor-icons/react';
import ilustrasiLogin from '../assets/ilustrasilogin.svg';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login gagal');
        return;
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      if (data.role === 'admin') {
        navigate('/AdminDashboard');
      } else {
        navigate('/Dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Gagal koneksi ke server');
    }
  }

  return (
    <div id="page-login" className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col px-20 lg:px-0">
        <div id="login-back-home" onClick={() => navigate('/')} className="bg-[#008207] w-fit p-3 rounded-full mb-10 cursor-pointer">
          <ArrowLeftIcon color="#ffffff" weight="bold" size={20} />
        </div>
        <h1 className="text-3xl font-bold mb-4 text-[#004203] max-w-[400px]">Login ke dashboard ECOSTEPS</h1>
        <p className="text-[#878787] mb-10 text-sm max-w-[400px]">Masukkan email dan password untuk mengakses layanan kami.</p>
        <form id="login-form" onSubmit={handleSubmit} className="w-80">
          {error && <div className="mb-4 text-red-600">{error}</div>}
          <div className="mb-4">
            <h3 className="font-medium">Email</h3>
            <input id="login-email" type="email" placeholder="name@example.com" className="focus:outline-none w-full mb-4 py-2 border-b-1 placeholder:text-[#D0D0D0]" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <h3 className="font-medium">Password</h3>
            <div className="relative mb-4">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="passwordExample"
                className="focus:outline-none w-full py-2 pr-10 border-b-1 placeholder:text-[#D0D0D0]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-label="Password"
              />
              <button
                id="login-toggle-password"
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-gray-800"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p className="text-sm text-[#454545] mb-4">
            Belum punya akun?{' '}
            <span id="login-link-register" className="text-[#008207] hover:underline cursor-pointer" onClick={() => navigate('/Register')}>
              Daftar
            </span>
          </p>
          <p className="text-sm text-[#454545] mb-4">
            Lupa password?{' '}
            <span id="login-link-reset" className="text-[#008207] hover:underline cursor-pointer" onClick={() => navigate('/reset-password')}>
              {' '}
              Reset password
            </span>
          </p>
          <button id="login-submit" type="submit" className="cursor-pointer hover:bg-green-700 duration-200 transition-colors w-fit bg-[#25E82F] text-white px-8 py-2 rounded-full font-semibold mt-4">
            Masuk
          </button>
        </form>
      </div>
      <img className="hidden lg:block relative -right-25" src={ilustrasiLogin} alt="ilustrasiLogin" />
    </div>
  );
}
