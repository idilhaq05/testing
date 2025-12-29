import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@phosphor-icons/react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import ilustrasiReset from '../assets/ilustrasilogin.svg';

export default function ResetPassword() {
  const navigate = useNavigate();

  // State untuk alur
  const [step, setStep] = useState<'email' | 'otp'>('email');

  // State input
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // State umum
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Kirim OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Respons server tidak valid');
      }

      if (!res.ok) {
        setError(data.message || 'Gagal mengirim OTP');
        return;
      }

      setStep('otp');
    } catch (err) {
      console.error(err);
      setError('Gagal koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  // Reset password (verifikasi OTP + update password)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validasi frontend
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi tidak cocok');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    if (otp.length !== 6) {
      setError('OTP harus 6 digit');
      return;
    }

    setLoading(true);
    try {
      // 1. Verifikasi OTP
      const verifyRes = await fetch(`${API_BASE_URL}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      let verifyData;
      try {
        verifyData = await verifyRes.json();
      } catch {
        throw new Error('Respons verifikasi OTP tidak valid');
      }

      if (!verifyRes.ok) {
        setError(verifyData.message || 'OTP tidak valid atau telah kadaluarsa');
        return;
      }

      // 2. Reset password
      const resetRes = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let resetData;
      try {
        resetData = await resetRes.json();
      } catch {
        throw new Error('Respons reset password tidak valid');
      }

      if (!resetRes.ok) {
        setError(resetData.message || 'Gagal mengubah password');
        return;
      }

      alert('Password berhasil diubah! Silakan login.');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="page-reset-password" className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="flex justify-between items-center">
        <div className="flex flex-col px-20 lg:px-0">
          <div id="reset-back-home" onClick={() => navigate('/')} className="bg-[#008207] w-fit p-3 rounded-full mb-10 cursor-pointer">
            <ArrowLeftIcon color="#ffffff" weight="bold" size={20} />
          </div>

          <h1 className="text-3xl font-bold mb-4 text-[#004203] max-w-[400px]">{step === 'email' ? 'Reset Password' : 'Atur Ulang Password'}</h1>

          <p className="text-[#878787] mb-6 text-sm max-w-[400px]">{step === 'email' ? 'Masukkan email Anda untuk menerima kode OTP.' : `Masukkan kode OTP yang dikirim ke ${email} dan password baru Anda.`}</p>

          {error && <div className="mb-4 text-red-600">{error}</div>}

          {step === 'email' ? (
            // Form: Masukkan Email
            <form id="reset-email-form" onSubmit={handleSendOTP} className="w-80">
              <div className="mb-6">
                <h3 className="font-medium">Email</h3>
                <input id="reset-email-input" type="email" placeholder="name@example.com" className="focus:outline-none w-full py-2 border-b border-gray-300 placeholder:text-[#D0D0D0]" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <p className="text-sm text-[#454545] mb-4">
                Sudah punya akun?{' '}
                <span className="text-[#008207] hover:underline cursor-pointer" onClick={() => navigate('/login')}>
                  Masuk
                </span>
              </p>

              <button id="reset-send-otp" type="submit" disabled={loading} className={`w-full py-2 rounded-full font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#25E82F] hover:bg-green-700'} transition-colors`}>
                {loading ? 'Mengirim...' : 'Kirim OTP'}
              </button>
            </form>
          ) : (
            // Form: OTP + Password Baru
            <form id="reset-otp-form" onSubmit={handleResetPassword} className="w-80">
              <div className="mb-4">
                <h3 className="font-medium">Kode OTP</h3>
                <input
                  id="reset-otp-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  className="focus:outline-none w-full py-2 border-b border-gray-300 placeholder:text-[#D0D0D0]"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  maxLength={6}
                />
              </div>
              <div className="mb-4">
                <h3 className="font-medium">Password Baru</h3>
                <input id="reset-password-input" type="password" placeholder="Password baru" className="focus:outline-none w-full py-2 border-b border-gray-300 placeholder:text-[#D0D0D0]" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <div className="mb-6">
                <h3 className="font-medium">Konfirmasi Password</h3>
                <input
                  id="reset-confirm-password-input"
                  type="password"
                  placeholder="Ulangi password"
                  className="focus:outline-none w-full py-2 border-b border-gray-300 placeholder:text-[#D0D0D0]"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button id="reset-back-to-email" type="button" onClick={() => setStep('email')} className="flex-1 py-2 rounded-full font-semibold text-[#008207] border border-[#008207] hover:bg-[#008207] hover:text-white transition-colors">
                  Kembali
                </button>
                <button id="reset-submit" type="submit" disabled={loading} className={`flex-1 py-2 rounded-full font-semibold text-white ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#25E82F] hover:bg-green-700'} transition-colors`}>
                  {loading ? 'Menyimpan...' : 'Reset Password'}
                </button>
              </div>
            </form>
          )}
        </div>
        <img className="hidden lg:block relative -right-25" src={ilustrasiReset} alt="Ilustrasi Reset Password" />
      </div>
    </div>
  );
}
