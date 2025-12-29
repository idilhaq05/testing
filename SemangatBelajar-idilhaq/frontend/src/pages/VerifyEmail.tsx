import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import ilustrasiverify from '../assets/ilustrasilogin.svg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(40);
  const [canResend, setCanResend] = useState(false);

  // ✅ Perbaikan: Handle state dan redirect aman
  useEffect(() => {
    const stateEmail = location.state?.email;
    const storedEmail = localStorage.getItem('verifyEmail');

    if (stateEmail) {
      setEmail(stateEmail);
      localStorage.setItem('verifyEmail', stateEmail);
    } else if (storedEmail) {
      setEmail(storedEmail);
    } else {
      // Redirect aman setelah render selesai
      setTimeout(() => {
        navigate('/register', { replace: true });
      }, 0);
      return;
    }
  }, [location.state?.email, navigate]);

  // Timer countdown
  useEffect(() => {
    if (!email) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ✅ Gunakan API_BASE_URL yang sudah punya fallback
      const res = await fetch(`${API_BASE_URL}/api/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Kode OTP tidak valid');
        setLoading(false);
        return;
      }

      alert('✅ Email berhasil diverifikasi!');
      localStorage.removeItem('verifyEmail');
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('Gagal koneksi ke server');
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/send-email-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Gagal mengirim ulang OTP');
        setLoading(false);
        return;
      }

      setCountdown(40);
      setCanResend(false);
      setOtp('');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Gagal koneksi ke server');
      setLoading(false);
    }
  };

  // ✅ Jangan render UI sampai email siap
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Memuat...</p>
      </div>
    );
  }

  return (
    <div id="page-verify-email" className="min-h-screen w-full flex items-center justify-center bg-white">
      <div className="flex justify-between items-center">
        <div className="flex flex-col px-20 lg:px-0">
          <div id="verify-back-register" onClick={() => navigate('/register')} className="bg-[#008207] w-fit p-3 rounded-full mb-10 cursor-pointer">
            <ArrowLeftIcon color="#ffffff" weight="bold" size={20} />
          </div>

          <h1 className="text-3xl font-bold mb-4 text-[#004203] max-w-[400px]">Verifikasi Email</h1>

          <p className="text-[#878787] mb-6 text-sm max-w-[400px]">
            Kami telah mengirim kode verifikasi ke <strong>{email}</strong>. Masukkan kode tersebut di bawah ini.
          </p>

          {error && <div className="mb-4 text-red-600">{error}</div>}

          <form id="verify-email-form" onSubmit={handleVerify} className="w-80">
            <div className="mb-6">
              <h3 className="font-medium">Kode Verifikasi</h3>
              <input
                id="verify-otp-input"
                type="text"
                inputMode="numeric"
                placeholder="123456"
                className="focus:outline-none w-full py-2 border-b border-gray-300 placeholder:text-[#D0D0D0]"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                maxLength={6}
              />
              <p className="text-xs text-gray-500 mt-2">Kode berlaku {countdown} detik</p>
            </div>

            <button
              id="verify-email-submit"
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`w-full py-2 rounded-full font-semibold text-white ${loading || otp.length !== 6 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#25E82F] hover:bg-green-700'} transition-colors`}
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi Email'}
            </button>

            <p className="text-center text-sm text-[#454545] mt-4">
              {canResend ? (
                <button id="verify-resend-otp" type="button" onClick={handleResendOTP} disabled={loading} className="text-[#008207] hover:underline disabled:text-gray-400">
                  Kirim ulang kode
                </button>
              ) : (
                `Kirim ulang dalam ${countdown} detik`
              )}
            </p>
          </form>
        </div>
        <img className="hidden lg:block relative -right-25" src={ilustrasiverify} alt="Ilustrasi Verifikasi Email" />
      </div>
    </div>
  );
}
