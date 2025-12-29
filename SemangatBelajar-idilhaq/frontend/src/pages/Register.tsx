import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import ilustrasiRegister from '../assets/ilustrasilogin.svg';
import { ArrowLeftIcon, Eye, EyeSlash } from '@phosphor-icons/react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        // Try to parse JSON error response first, fallback to plain text.
        let errorMessage = 'Gagal daftar';
        try {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            // If backend returns { message: '...' }
            errorMessage = data?.message || (typeof data === 'string' ? data : JSON.stringify(data)) || errorMessage;
          } else {
            // Not JSON: read as text (e.g. "Password must be ...")
            const text = await res.text();
            errorMessage = text || errorMessage;
          }
        } catch {
          // If parsing as json failed unexpectedly, try text as a last resort
          try {
            const text = await res.text();
            errorMessage = text || errorMessage;
          } catch {
            // ignore - keep default
          }
        }
        setError(errorMessage);
        return;
      }

      // ✅ Setelah registrasi sukses, arahkan ke verifikasi email
      // Kirim email sebagai state ke halaman berikutnya
      navigate('/verify-email', { state: { email } });
    } catch (err) {
      console.error(err);
      setError('Gagal koneksi ke server');
    }
  }

  return (
    <div id="page-register" className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="flex justify-between items-center">
        <div className="flex flex-col px-32 md:px-20 lg:px-0">
          <div id="register-back-home" onClick={() => navigate('/')} className="bg-[#008207] w-fit p-3 rounded-full mb-10 cursor-pointer">
            <ArrowLeftIcon color="#ffffff" weight="bold" size={20} />
          </div>
          <h1 className="text-3xl font-bold mb-4 text-[#004203] max-w-[400px]">Daftarkan akunmu di ECOSTEPS</h1>
          <p className="text-[#878787] mb-12 text-sm max-w-[400px]">Masukkan username, email dan password untuk membuat akun-mu.</p>
          <form id="register-form" onSubmit={handleSubmit} className="w-80">
            {error && <div className="mb-4 text-red-600">{error}</div>}
            <div className="mb-4">
              <h3 className="font-medium">Username</h3>
              <input id="register-username" type="text" placeholder="usernameExample" className="focus:outline-none w-full py-2 border-b border-gray-300 placeholder:text-[#D0D0D0]" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="mb-4">
              <h3 className="font-medium">Email</h3>
              <input id="register-email" type="email" placeholder="name@example.com" className="focus:outline-none w-full py-2 border-b border-gray-300 placeholder:text-[#D0D0D0]" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-8">
              <h3 className="font-medium">Password</h3>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="passwordExample"
                  className="focus:outline-none w-full py-2 pr-10 border-b border-gray-300 placeholder:text-[#D0D0D0]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-label="Password"
                />
                <button
                  id="register-toggle-password"
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-gray-800"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <p className="text-sm text-[#454545] mb-8">
              Sudah punya akun?{' '}
              <span id="register-link-login" className="text-[#008207] hover:underline cursor-pointer" onClick={() => navigate('/Login')}>
                Masuk
              </span>
            </p>
            <button id="register-submit" type="submit" className="cursor-pointer hover:bg-green-700 duration-200 transition-colors w-fit bg-[#25E82F] text-white px-8 py-2 rounded-full font-semibold">
              Daftar
            </button>
          </form>
        </div>

        <img className="hidden lg:block relative -right-25" src={ilustrasiRegister} alt="ilustrasiRegister" />
      </div>
    </div>
  );
}
