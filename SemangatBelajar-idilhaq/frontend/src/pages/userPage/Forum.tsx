import { useEffect, useState } from 'react';
import ilustrasiEmpty from '../../assets/ilustrasiEmpty.svg';
import { useToast } from '../../toast/toast';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type ForumPost = {
  id: number;
  user: string;
  judul: string;
  isi: string;
  created_at: string;
  comments: ForumComment[];
};

type ForumComment = {
  id: number;
  user: string;
  isi: string;
  created_at: string;
};

export default function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [judul, setJudul] = useState('');
  const [isi, setIsi] = useState('');
  const [commentIsi, setCommentIsi] = useState<{ [key: number]: string }>({});
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const { showToast } = useToast(); // Gunakan toast

  useEffect(() => {
    fetchForum();
  }, []);

  function fetchForum() {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/forum`)
      .then((res) => res.json())
      .then((data) => {
        setPosts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setPosts([]);
        setLoading(false);
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!judul.trim() || !isi.trim()) {
      setError('Judul dan isi forum wajib diisi.');
      showToast('Judul dan isi forum wajib diisi.', 'error');
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/forum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ judul, isi }),
      });
      if (!res.ok) {
        setError('Gagal membuat forum.');
        showToast('Gagal membuat forum.', 'error');
        return;
      }
      setJudul('');
      setIsi('');
      setShowModal(false);
      showToast('Forum berhasil dibuat!', 'success'); // Tampilkan toast sukses
      fetchForum();
    } catch {
      setError('Gagal koneksi ke server.');
      showToast('Gagal koneksi ke server.', 'error');
    }
  }

  async function handleComment(postId: number) {
    if (!commentIsi[postId] || !commentIsi[postId].trim()) return;
    await fetch(`${API_BASE_URL}/api/forum/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isi: commentIsi[postId] }),
    });
    setCommentIsi((prev) => ({ ...prev, [postId]: '' }));
    fetchForum();
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return (
    <div id="page-forum" className="py-0 md:py-8 px-2 sm:px-6 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Forum</h1>
        <button id="btn-open-forum-modal" className="cursor-pointer bg-white text-black px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold shadow-md flex items-center w-full sm:w-auto justify-center" onClick={() => setShowModal(true)}>
          <span>+ Buat forum baru</span>
        </button>
      </div>

      {/* Tambah Forum */}
      {showModal && (
        <div id="forum-modal-overlay" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-2 sm:px-0">
          <div id="forum-modal" className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-xs sm:max-w-md">
            <h3 className="text-lg sm:text-xl font-bold mb-4">Buat Forum Baru</h3>
            {error && <div className="mb-2 text-red-600">{error}</div>}
            <form id="forum-form" onSubmit={handleSubmit}>
              <input id="forum-judul-input" type="text" placeholder="Judul forum" className="w-full mb-3 p-2 sm:p-3 border border-gray-200 rounded-lg text-sm" value={judul} onChange={(e) => setJudul(e.target.value)} required />
              <textarea id="forum-isi-input" placeholder="Isi forum" className="w-full mb-6 sm:mb-8 p-2 sm:p-3 border border-gray-200 rounded-lg min-h-[80px] sm:min-h-[120px] text-sm" value={isi} onChange={(e) => setIsi(e.target.value)} required />
              <div className="flex gap-3 justify-end mb-2">
                <button id="forum-modal-cancel" type="button" className="cursor-pointer px-4 sm:px-6 py-2 border border-gray-200 rounded-lg text-sm" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button id="forum-modal-submit" type="submit" className="bg-[#25E82F] cursor-pointer font-medium text-white px-4 py-2 rounded-lg text-sm">
                  Buat Forum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div id="forum-post-list" className="space-y-6">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Memuat data...</div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg py-12 sm:py-16">
            <img src={ilustrasiEmpty} alt="Forum kosong" className="w-60 sm:w-80 mb-6" />
            <div className="text-xl sm:text-2xl font-bold mb-2">Forum kosong</div>
            <div className="text-gray-500 text-base sm:text-lg text-center">Buat forum pertamamu terlebih dahulu!</div>
          </div>
        ) : (
          posts.map((post) => (
            <div id={`forum-card-${post.id}`} key={post.id} className="bg-white p-4 sm:p-8 rounded-2xl drop-shadow-lg">
              <h2 className="text-base sm:text-lg font-semibold mb-2">"{post.judul}"</h2>
              <p className="text-gray-700 mb-2 text-sm sm:text-base">{post.isi}</p>
              <p className="text-xs sm:text-sm text-gray-500 mb-4">
                oleh: <span className="font-medium">{post.user}</span> | {formatDate(post.created_at)}
              </p>

              <div className="mt-4">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Komentar terbaru:</h3>
                {(post.comments ?? []).length === 0 ? (
                  <p className="text-gray-400 text-xs sm:text-sm mb-3">Belum ada komentar.</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {(post.comments ?? []).map((comment) => (
                      <div key={comment.id} className="text-xs sm:text-sm">
                        <span className="font-medium">@{comment.user}:</span> {comment.isi}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex mt-2 gap-3 sm:gap-6 flex-col sm:flex-row">
                  <input
                    id={`forum-comment-input-${post.id}`}
                    type="text"
                    placeholder="Tulis komentar..."
                    className="flex-1 shadow-md rounded-lg p-2 text-xs sm:text-sm"
                    value={commentIsi[post.id] || ''}
                    onChange={(e) => setCommentIsi((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <button id={`forum-comment-submit-${post.id}`} className="bg-[#25E82F] cursor-pointer text-white px-4 sm:px-6 py-2 rounded-lg text-xs sm:text-sm" onClick={() => handleComment(post.id)} disabled={!commentIsi[post.id]}>
                    Kirim
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
