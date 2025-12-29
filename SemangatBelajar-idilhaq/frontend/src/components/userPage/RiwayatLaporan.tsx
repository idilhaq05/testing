import { useEffect, useState } from 'react';

type Laporan = {
  id: number;
  judul: string;
  deskripsi: string;
  foto_url: string;
  video_url: string;
  lokasi: string;
  status: string;
  created_at: string;
};

export default function RiwayatLaporan() {
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    fetch('http://localhost:8081/api/laporan/user', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.status === 401 ? [] : res.json()))
      .then((data) => {
        setLaporan(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  console.log('API BASE URL:', import.meta.env.VITE_API_BASE_URL);

  return (
    <div id="widget-riwayat-laporan" className="my-4">
      <div className="bg-white px-10 py-6 rounded-[15px] shadow-md">
        <h3 className="font-bold ">📌 Riwayat Laporan</h3>
        <ul id="riwayat-laporan-list" className="max-h-45 overflow-y-auto text-sm">
          {loading ? (
            <li className="text-center text-gray-500 py-4">Memuat data...</li>
          ) : laporan.length === 0 ? (
            <li className="text-center text-gray-500 py-4">Belum ada laporan.</li>
          ) : (
            laporan.map((l) => (
              <li key={l.id} className="py-6">
                <div className="font-semibold">{l.judul}</div>
                <div className="text-sm text-[#818181] mb-2">{l.deskripsi}</div>
                <div className="flex gap-4 mb-2 font-medium">
                  {l.foto_url && (
                    <a href={l.foto_url.startsWith('/') ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}${l.foto_url}` : l.foto_url} target="_blank" rel="noopener noreferrer" className="block text-[#005EFF] text-sm">
                      Lihat Foto
                    </a>
                  )}
                  {l.video_url && (
                    <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="block text-[#005EFF] text-sm">
                      Lihat Video
                    </a>
                  )}
                </div>

                <div className="flex text-sm text-gray-500 mb-2">
                  <span className="font-medium text-black">Lokasi:</span>
                  {l.lokasi ? (
                    <button
                      type="button"
                      className="ml-1 underline text-blue-600"
                      style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                      onClick={() => {
                        // Pastikan format koordinat benar (lat,long)
                        const [lat, lng] = l.lokasi.split(',');
                        if (lat && lng) {
                          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                        }
                      }}
                    >
                      {l.lokasi}
                    </button>
                  ) : (
                    <span className="ml-1">-</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <div className="flex text-sm font-medium">Status: {l.status}</div>
                  <div className="text-sm text-gray-500">{new Date(l.created_at).toLocaleString()}</div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
