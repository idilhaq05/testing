import { useEffect, useState } from 'react';
import { Camera, Trophy, Target } from 'lucide-react';
import { useToast } from '../../toast/toast';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function buildFileUrl(path: string) {
  if (!path) return '';
  const base = API_BASE_URL.replace(/\/api$/, '');
  return `${base}/tmp/${path.replace(/^\/+/, '')}`;
}

type Submission = {
  tantangan_id: number;
  status: string;
  foto_path?: string;
};

type Tantangan = {
  id: number;
  judul: string;
  deskripsi: string;
  poin: number;
  tingkat_kesulitan: string;
};

type Leader = {
  email: string;
  poin: number;
  username?: string;
};

export default function Tantangan() {
  const [tasks, setTasks] = useState<Tantangan[]>([]);
  const [completed, setCompleted] = useState<number[]>([]);
  const [totalPoin, setTotalPoin] = useState(0);
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);
  const [files, setFiles] = useState<Record<number, File | null>>({});
  const [previews, setPreviews] = useState<Record<number, string>>({});
  const [uploadedPaths, setUploadedPaths] = useState<Record<number, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<Record<number, string>>({});
  const [isAdmin] = useState(false);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const extractUsername = (email: string): string => {
    const username = email.split('@')[0];
    return username.replace(/[^a-zA-Z0-9]/g, '');
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/tantangan/hari-ini`)
      .then((res) => res.json())
      .then((data) => setTasks(Array.isArray(data) ? data : []))
      .catch((err) => console.error('load tasks failed', err));

    const token = localStorage.getItem('token');

    if (token) {
      fetch(`${API_BASE_URL}/api/user/poin`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setTotalPoin(data.poin || 0))
        .catch((err) => console.error('load poin failed', err));

      fetch(`${API_BASE_URL}/api/tantangan/selesai-hari-ini`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setCompleted(Array.isArray(data) ? data : []))
        .catch((err) => console.error('load selesai-hari-ini failed', err));

      fetch(`${API_BASE_URL}/api/tantangan/user-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((subs) => {
          if (Array.isArray(subs)) {
            // Ambil submission terakhir untuk setiap tantangan_id
            const latestMap: Record<number, Submission> = {};
            subs.forEach((s: Submission) => {
              // selalu timpa, sehingga yang terakhir di array adalah yang terbaru
              latestMap[s.tantangan_id] = s;
            });

            const upMap: Record<number, string> = {};
            const doneIds: number[] = [];
            const statusMap: Record<number, string> = {};
            Object.values(latestMap).forEach((s) => {
              if (s?.foto_path) {
                upMap[s.tantangan_id] = s.foto_path;
              }
              if (s?.status) {
                statusMap[s.tantangan_id] = s.status;
              }
              if (s?.status === 'selesai') {
                doneIds.push(s.tantangan_id);
              }
            });
            setUploadedPaths((prev) => ({ ...prev, ...upMap }));
            setSubmissionStatus((prev) => ({ ...prev, ...statusMap }));
            setCompleted((prev) => Array.from(new Set([...prev, ...doneIds])));
          }
        })
        .catch((err) => console.error('load submissions failed', err));
    }

    fetch(`${API_BASE_URL}/api/leaderboard`)
      .then((res) => res.json())
      .then((data) => {
        const processedData = Array.isArray(data)
          ? data.map((user) => ({
              ...user,
              username: user.username || extractUsername(user.email),
            }))
          : [];
        setLeaderboard(processedData);
      })
      .catch((err) => console.error('load leaderboard failed', err));
  }, []);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) {
          try {
            URL.revokeObjectURL(url);
          } catch (err) {
            console.warn('revokeObjectURL failed', err);
          }
        }
      });
    };
  }, [previews]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>, id: number) {
    const file = e.target.files?.[0] ?? null;

    setFiles((prev) => ({ ...prev, [id]: file }));

    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan!');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB!');
        return;
      }

      const url = URL.createObjectURL(file);

      if (previews[id]) {
        try {
          URL.revokeObjectURL(previews[id]);
        } catch (err) {
          console.warn('revokeObjectURL failed', err);
        }
      }

      setPreviews((p) => ({ ...p, [id]: url }));
    } else {
      if (previews[id]) {
        try {
          URL.revokeObjectURL(previews[id]);
        } catch (err) {
          console.warn('revokeObjectURL failed', err);
        }
      }
      setPreviews((p) => ({ ...p, [id]: '' }));
    }
  }

  async function handleUpload(tantangan: Tantangan) {
    if (completed.includes(tantangan.id)) {
      return;
    }

    const file = files[tantangan.id];
    if (!file) {
      showToast('Silakan pilih foto terlebih dahulu!', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Anda harus login terlebih dahulu!', 'error');
      return;
    }

    setUploadingId(tantangan.id);

    const formData = new FormData();
    formData.append('tantangan_id', tantangan.id.toString());
    formData.append('foto', file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tantangan/selesai`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        showToast(errorText || 'Upload gagal', 'error');
        throw new Error(errorText || 'Upload gagal');
      }

      const data = await res.json();
      // jika backend mengembalikan foto_path, simpan db-path (bukan absolute URL)
      if (data?.foto_path) {
        setUploadedPaths((prev) => ({ ...prev, [tantangan.id]: data.foto_path }));
        // segera tandai sebagai pending sehingga UI menunjukkan indicator
        setSubmissionStatus((prev) => ({ ...prev, [tantangan.id]: 'pending' }));
      }

      showToast('Foto berhasil diupload! Menunggu persetujuan admin.', 'success');

      setFiles((prev) => ({ ...prev, [tantangan.id]: null }));
      setPreviews((p) => ({ ...p, [tantangan.id]: '' }));

      if (token) {
        fetch(`${API_BASE_URL}/api/tantangan/user-submissions`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((subs) => {
            if (Array.isArray(subs)) {
              const latestMap: Record<number, Submission> = {};
              subs.forEach((s: Submission) => {
                latestMap[s.tantangan_id] = s;
              });

              const upMap: Record<number, string> = {};
              const doneIds: number[] = [];
              const statusMap: Record<number, string> = {};
              Object.values(latestMap).forEach((s) => {
                if (s?.foto_path) {
                  upMap[s.tantangan_id] = s.foto_path;
                }
                if (s?.status) {
                  statusMap[s.tantangan_id] = s.status;
                }
                if (s?.status === 'selesai') {
                  doneIds.push(s.tantangan_id);
                }
              });
              setUploadedPaths((prev) => ({ ...prev, ...upMap }));
              setSubmissionStatus((prev) => ({ ...prev, ...statusMap }));
              setCompleted((prev) => Array.from(new Set([...prev, ...doneIds])));
            }
          })
          .catch((err) => console.error('reload submissions failed', err));
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal mengupload foto. Silakan coba lagi.', 'error');
    } finally {
      setUploadingId(null);
    }
  }

  // helper: buka gambar server di tab baru
  function openUploadedImage(url: string) {
    if (!url) return;
    window.open(url, '_blank');
  }

  return (
    <div id="page-tantangan" className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div id="tantangan-header" className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-pink-500" />
            <h1 className="text-3xl font-bold text-gray-800">Tantangan Mingguan</h1>
          </div>
          <div className="text-2xl font-semibold text-green-600">Total Poin Anda: {totalPoin}</div>
          {!isAdmin && <div className="mt-3 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">ℹ️ Hanya admin yang dapat menandai tantangan selesai.</div>}
        </div>

        <div id="tantangan-sections" className="grid md:grid-cols-3 gap-6">
          {/* Leaderboard Section */}
          <div className="md:col-span-1">
            <div id="tantangan-leaderboard" className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold text-gray-800">Leaderboard Top 5</h2>
              </div>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((user, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-300'}`}>{idx + 1}</div>
                      <span className="font-medium text-gray-700">{user.username}</span>
                    </div>
                    <span className="font-bold text-green-600">{user.poin}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tantangan Section */}
          <div id="tantangan-list" className="md:col-span-2 space-y-4">
            {tasks.map((t, idx) => (
              <div id={`tantangan-card-${t.id}`} key={t.id} className={`bg-white rounded-lg shadow-md p-6 transition ${completed.includes(t.id) ? 'opacity-60 bg-green-50' : ''}`}>
                <div className="flex items-start gap-4">
                  <input type="checkbox" checked={completed.includes(t.id)} readOnly className="w-5 h-5 mt-1 accent-green-600 rounded cursor-pointer" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {idx + 1}. {t.judul}
                    </h3>
                    <p className="text-gray-600 mb-3">{t.deskripsi}</p>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Poin: {t.poin}</span>
                      <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">{t.tingkat_kesulitan}</span>
                    </div>

                    {/* upload area */}
                    {!completed.includes(t.id) && (
                      <div className="border-t pt-4">
                        <label className="block mb-2 font-medium text-gray-700">
                          <Camera className="w-4 h-4 inline mr-1" />
                          Upload Foto:
                        </label>

                        {/* file input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, t.id)}
                          disabled={submissionStatus[t.id] === 'pending'}
                          className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        />

                        {/* tampilkan gambar hasil upload jika ada */}
                        {uploadedPaths[t.id] && (
                          <div className="mt-3 flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openUploadedImage(buildFileUrl(uploadedPaths[t.id]))}
                              className="w-14 h-14 rounded-md overflow-hidden border border-gray-200 flex-shrink-0"
                              title="Buka gambar yang telah diunggah"
                            >
                              <img src={buildFileUrl(uploadedPaths[t.id])} alt="Uploaded thumb" className="w-full h-full object-cover" />
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-800">Gambar sudah diunggah</div>
                            </div>
                          </div>
                        )}

                        {/* indikator status selalu tampil jika ada status */}
                        {(submissionStatus[t.id] === 'pending' || submissionStatus[t.id] === 'rejected') && (
                          <div className="mt-2">
                            {submissionStatus[t.id] === 'pending' && <div className="text-xs text-yellow-700 bg-yellow-50 inline-block px-2 py-1 rounded">Sedang ditinjau admin</div>}
                            {submissionStatus[t.id] === 'rejected' && <div className="text-xs text-red-700 bg-red-50 inline-block px-2 py-1 rounded">Ditolak — silakan unggah ulang</div>}
                          </div>
                        )}

                        {/* local preview (sebelum upload baru) */}
                        {previews[t.id] && (
                          <div className="mt-3">
                            <img src={previews[t.id]} alt="Preview" className="max-w-xs rounded-lg shadow-md" />
                          </div>
                        )}

                        {/* tombol upload hanya muncul jika status bukan pending */}
                        {files[t.id] && submissionStatus[t.id] !== 'pending' && (
                          <button
                            onClick={() => handleUpload(t)}
                            disabled={uploadingId === t.id}
                            className="mt-3 bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                          >
                            {uploadingId === t.id ? 'Mengupload...' : 'Upload & Selesai'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* completed view */}
                    {completed.includes(t.id) && (
                      <div className="border-t pt-4">
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Tantangan Selesai
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {tasks.length === 0 && <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-500">Tidak ada tantangan hari ini</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
