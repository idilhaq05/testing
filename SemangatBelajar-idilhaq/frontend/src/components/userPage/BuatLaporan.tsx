import { useState } from 'react';
import { useToast } from '../../toast/toast';

export default function BuatLaporan({ onClose }: { onClose?: () => void }) {
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [pesan, setPesan] = useState('');
  const { showToast } = useToast(); // Tambahkan ini

  function getLocation() {
    if (!navigator.geolocation) {
      setPesan('Geolocation tidak didukung browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLokasi(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => setPesan('Gagal mengambil lokasi.')
    );
  }

  function handleCancel() {
    if (onClose) {
      onClose();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPesan('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:8081/api/laporan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          judul,
          deskripsi,
          foto_url: fotoUrl,
          video_url: videoUrl,
          lokasi,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPesan(data.message || 'Gagal mengirim laporan');
        showToast(data.message || 'Gagal mengirim laporan', 'error');
        return;
      }
      setPesan('Laporan berhasil dikirim!');
      showToast('Laporan berhasil dikirim!', 'success');
      setJudul('');
      setDeskripsi('');
      setFotoUrl('');
      setVideoUrl('');
      setLokasi('');
      if (onClose) onClose();
    } catch {
      setPesan('Gagal koneksi ke server');
      showToast('Gagal koneksi ke server', 'error');
    }
  }

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    fetch('http://localhost:8081/api/upload', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {
        setFotoUrl(data.url);
      })
      .catch(() => setPesan('Gagal upload gambar'));
  }

  return (
    <div id="buat-laporan-overlay" className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-2 sm:px-6">
      <div id="buat-laporan-card" className="bg-white rounded-xl p-4 sm:p-8 w-full max-w-xs sm:max-w-md">
        <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Tambah laporan</h2>

        {pesan && <div className="mb-4 text-red-600 text-sm">{pesan}</div>}

        <form id="buat-laporan-form" onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <input id="buat-laporan-judul" className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg bg-white text-sm" value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Judul" required />
          </div>

          <div>
            <textarea id="buat-laporan-deskripsi" className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg bg-white min-h-[80px] sm:min-h-[120px] text-sm" value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} placeholder="Deskripsi" required />
          </div>

          <div>
            <input id="buat-laporan-foto-input" type="file" accept="image/*" className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg bg-white text-sm" onChange={handleFotoChange} />
            {fotoUrl && fotoUrl !== '' && <img src={fotoUrl} alt="Preview" className="mt-2 max-h-32 sm:max-h-40 rounded" />}
          </div>

          <div>
            <input id="buat-laporan-video-input" className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg bg-white text-sm" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Url video" />
          </div>

          <div className="flex gap-2 mb-8 sm:mb-12 flex-col sm:flex-row">
            <input id="buat-laporan-lokasi" className="flex-1 p-2 sm:p-3 border border-gray-200 rounded-lg bg-white text-sm" value={lokasi} readOnly placeholder="Koordinat" />
            <button id="buat-laporan-lokasi-btn" type="button" onClick={getLocation} className="px-4 py-2 bg-[#25E82F] text-white rounded-lg font-medium text-sm">
              Ambil lokasi
            </button>
          </div>

          <div className="flex gap-3 justify-end mb-0">
            <button id="buat-laporan-cancel" type="button" onClick={handleCancel} className="cursor-pointer px-4 sm:px-6 py-2 border border-gray-200 rounded-lg text-sm">
              Batal
            </button>
            <button id="buat-laporan-submit" type="submit" className="cursor-pointer bg-[#25E82F] text-white px-4 py-2 rounded-lg font-medium text-sm">
              Tambah laporan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
