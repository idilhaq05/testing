import { useEffect, useState } from 'react';

type Tantangan = {
  id: number;
  judul: string;
  deskripsi: string;
  poin: number;
  tingkat_kesulitan: string;
};

export default function TantanganAktif() {
  const [tasks, setTasks] = useState<Tantangan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8081/api/tantangan/hari-ini')
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div id="widget-tantangan-aktif" className="my-4">
      <div className="bg-white px-10 py-6 rounded-[15px] shadow-md">
        <h3 className="font-bold mb-2">🔥 Tantangan Aktif Hari Ini</h3>
        <ul className="max-h-41 overflow-y-auto text-sm">
          {loading ? (
            <li className="text-center text-gray-500 py-4">Memuat tantangan...</li>
          ) : tasks.length === 0 ? (
            <li className="text-center text-gray-500 py-4">Tidak ada tantangan aktif hari ini.</li>
          ) : (
            tasks.map((t, idx) => (
              <li key={t.id} className="py-4 px-2">
                <div className="font-semibold">
                  {idx + 1}. {t.judul}
                </div>
                <div className="text-sm text-[#818181]">{t.deskripsi}</div>
                <div className="text-md text-[#25E82F]">
                  Poin: {t.poin} ({t.tingkat_kesulitan})
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
