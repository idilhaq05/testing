import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../../components/adminPage/AdminNavbar';
import { useToast } from '../../toast/toast'; // <-- Tambahkan ini
import ConfirmOverlay from '../../toast/ConfirmOverlay';
import { XIcon } from '@phosphor-icons/react';

type Laporan = {
  id: number;
  user_id: number;
  judul: string;
  deskripsi: string;
  foto_url: string;
  video_url: string;
  lokasi: string;
  status: string;
  created_at: string;
};

type User = {
  id: number;
  email: string;
  username: string;
  role: string;
  poin: number;
};

type Forum = {
  id: number;
  judul: string;
  user: string;
  created_at: string;
};

// Tipe untuk pesan/komentar forum
 type ForumMessage = {
  id: number;
  user: string;
  isi: string;
  created_at: string;
};

type TantanganUser = {
  id: number;
  user_id: number;
  tantangan_id: number;
  status: string;
  foto_path: string;
  waktu_selesai: string | null;
  username?: string;
  judul?: string;
};

export default function AdminDashboard() {
  // ...existing state...
  const { showToast } = useToast(); // <-- Tambahkan ini

  // Tambahkan state untuk overlay konfirmasi
  const [confirmAction, setConfirmAction] = useState<null | {
    message: string;
    onConfirm: () => void;
  }>(null);

  // Fungsi hapus user
  async function handleDeleteUser(id: number) {
    setPesan('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/user/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      const msg = typeof data === 'object' && data !== null && typeof (data as { message?: unknown }).message === 'string' ? (data as { message: string }).message : typeof data === 'string' ? data : 'Gagal hapus user';
      setPesan(msg);
      showToast(msg, 'error'); // <-- Tambahkan ini
      return;
    }
    setPesan('User berhasil dihapus');
    showToast('User berhasil dihapus', 'success'); // <-- Tambahkan ini
    fetchAllData();
  }

  // Fungsi hapus forum
  async function deleteForum(id: number) {
    setPesan('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/forum/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      const msg = typeof data === 'object' && data !== null && typeof (data as { message?: unknown }).message === 'string' ? (data as { message: string }).message : typeof data === 'string' ? data : 'Gagal hapus forum';
      setPesan(msg);
      showToast(msg, 'error'); // <-- Tambahkan ini
      return;
    }
    setPesan('Forum berhasil dihapus');
    showToast('Forum berhasil dihapus', 'success'); // <-- Tambahkan ini
    fetchAllData();
  }

  // Fungsi hapus laporan
  async function deleteLaporan(id: number) {
    setPesan('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/laporan/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      const msg = typeof data === 'object' && data !== null && typeof (data as { message?: unknown }).message === 'string' ? (data as { message: string }).message : typeof data === 'string' ? data : 'Gagal hapus laporan';
      setPesan(msg);
      showToast(msg, 'error'); // <-- Tambahkan ini
      return;
    }
    setPesan('Laporan berhasil dihapus');
    showToast('Laporan berhasil dihapus', 'success'); // <-- Tambahkan ini
    fetchAllData();
  }
  const [laporan, setLaporan] = useState<Laporan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [forums, setForums] = useState<Forum[]>([]);
  const [tantanganUser, setTantanganUser] = useState<TantanganUser[]>([]);
  const [pesan, setPesan] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('laporan');
  const [role, setRole] = useState<string>('');
  const [detail, setDetail] = useState(false);
  const [selectedLaporan, setSelectedLaporan] = useState<Laporan | null>(null);

  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [showMiniTab, setShowMiniTab] = useState<number | null>(null);
  const [openedForum, setOpenedForum] = useState<Forum | null>(null);
  const [forumMessages, setForumMessages] = useState<ForumMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [showDeleteUserOverlay, setShowDeleteUserOverlay] = useState<{ id: number; username: string } | null>(null);
  const [showDeleteForumOverlay, setShowDeleteForumOverlay] = useState<{ id: number; judul: string } | null>(null);
  const [showDeleteLaporanOverlay, setShowDeleteLaporanOverlay] = useState<{ id: number; judul: string } | null>(null);
  // Robust response parser: try res.json(), fallback to text when JSON parsing fails
  async function parseResponse(res: Response): Promise<unknown> {
    try {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          return await res.json();
        } catch {
          // If res.json() fails (malformed JSON), try reading text and parsing manually
          const txt = await res.text();
          try {
            return JSON.parse(txt);
          } catch {
            return txt;
          }
        }
      }
      // Not JSON according to header -> try text, and attempt JSON.parse anyway
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      try {
        return await res.text();
      } catch {
        return null;
      }
    }
  }

  useEffect(() => {
    fetchAllData();
    fetchTantanganUser();
    const storedRole = localStorage.getItem('role');
    setRole(storedRole || '');
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (activeTab !== 'forums') {
      setOpenedForum(null);
      setForumMessages([]);
      setNewMessage('');
    }
  }, [activeTab]);

  async function fetchAllData() {
    setLoading(true);
    setPesan('');
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      const resLaporan = await fetch(`${API_BASE_URL}/api/laporan/all`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (resLaporan.status === 401) {
        navigate('/login');
        return;
      }
      const dataLaporan = await parseResponse(resLaporan);
      setLaporan(Array.isArray(dataLaporan) ? dataLaporan : []);

      const resUser = await fetch(`${API_BASE_URL}/api/user/all?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const dataUser = await parseResponse(resUser);
      setUsers(Array.isArray(dataUser) ? dataUser : []);

      const resForum = await fetch(`${API_BASE_URL}/api/forum?t=${Date.now()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const dataForum = await parseResponse(resForum);
      setForums(Array.isArray(dataForum) ? dataForum : []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setPesan('Gagal mengambil data dari server');
    }
    setLoading(false);
  }

  async function fetchTantanganUser() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/tantangan/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await parseResponse(res);
    setTantanganUser(Array.isArray(data) ? data : []);
  }

  async function updateStatus(id: number, status: string) {
    setPesan('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/laporan/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, status }),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      const msg = typeof data === 'object' && data !== null && typeof (data as { message?: unknown }).message === 'string' ? (data as { message: string }).message : typeof data === 'string' ? data : 'Gagal update status';
      setPesan(msg);
      showToast(msg, 'error'); // <-- Tambahkan ini
      return;
    }
    setPesan('Status berhasil diupdate');
    showToast('Status berhasil diupdate', 'success'); // <-- Tambahkan ini
    fetchAllData();
  }

  async function handleSaveEditUser(id: number) {
    setPesan('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/user/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, username: editUsername, role: editRole }),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      const msg = typeof data === 'object' && data !== null && typeof (data as { message?: unknown }).message === 'string' ? (data as { message: string }).message : typeof data === 'string' ? data : 'Gagal update user';
      setPesan(msg);
      showToast(msg, 'error'); // <-- Tambahkan ini
      return;
    }
    setPesan('User berhasil diupdate');
    showToast('User berhasil diupdate', 'success'); // <-- Tambahkan ini
    fetchAllData();
  }

  // Fungsi untuk menampilkan overlay
  function handleShowOverlay(userId: number) {
    const user = users.find((u) => u.id === userId) || null;
    setEditUsername(user ? user.username : '');
    setEditRole(user ? user.role : 'user');
    setShowMiniTab(userId);
  }

  // Fungsi untuk menyembunyikan overlay
  function handleHideOverlay() {
    setShowMiniTab(null);
    setEditUsername('');
    setEditRole('user');
  }

  // Tambahkan fungsi untuk membuka forum
  async function handleOpenForum(forumId: number) {
    const token = localStorage.getItem('token');
    try {
      const forum = forums.find((f) => f.id === forumId) || null;
      setOpenedForum(forum);

      // Ubah endpoint di sini
      const res = await fetch(`${API_BASE_URL}/api/forum/${forumId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseResponse(res);
      const forumData = data as { comments?: ForumMessage[] };
      setForumMessages(Array.isArray(forumData.comments) ? forumData.comments : []);
    } catch {
      setPesan('Gagal memuat forum');
    }
  }

  async function handleSendMessage() {
    if (!openedForum || !newMessage.trim()) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/forum/${openedForum.id}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isi: newMessage }),
    });
    if (res.ok) {
      setNewMessage('');
      // Tambahkan ini agar komentar langsung ter-refresh
      await handleOpenForum(openedForum.id);
    } else {
      setPesan('Gagal mengirim pesan');
    }
  }

  async function handleApproveTantangan(id: number) {
    setPesan('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/tantangan/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tantangan_user_id: id }),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      setPesan(typeof data === 'string' ? data : 'Gagal approve tantangan');
      showToast(typeof data === 'string' ? data : 'Gagal approve tantangan', 'error'); // <-- Tambahkan ini
      return;
    }
    setPesan('Tantangan berhasil diapprove');
    showToast('Tantangan berhasil diapprove', 'success'); // <-- Tambahkan ini
    fetchTantanganUser();
  }

  async function handleRejectTantangan(id: number) {
    setPesan('');
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE_URL}/api/tantangan/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tantangan_user_id: id }),
    });
    const data = await parseResponse(res);
    if (!res.ok) {
      setPesan(typeof data === 'string' ? data : 'Gagal reject tantangan');
      showToast(typeof data === 'string' ? data : 'Gagal reject tantangan', 'error');
    }
    setPesan('Tantangan berhasil direject');
    showToast('Tantangan berhasil direject', 'success');
    fetchTantanganUser();
  }

  return (
    <div id="page-admin-dashboard" className="bg-white h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Navbar: tampil di semua device, atur tampilannya di dalam AdminNavbar */}
      <AdminNavbar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Sidebar: hanya tampil di desktop/tablet */}
      <aside className="hidden md:block bg-white h-screen flex-shrink-0 shadow-lg">
        <div className="h-full flex flex-col overflow-hidden">{/* AdminNavbar sudah dipanggil di luar, tidak perlu di sini */}</div>
      </aside>
      {/* Main Content */}
      <main id="admin-main" className="flex-1 overflow-y-auto px-4 md:px-10 py-5 pt-14 md:pt-10">
        <div className="py-4 sm:py-8">
          <h2 className="text-lg sm:text-2xl font-bold mb-2 md:mb-4">Dashboard Admin</h2>
          {pesan && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{pesan}</div>}

          {/* Overlay konfirmasi universal */}
          {confirmAction && (
            <ConfirmOverlay
              message={confirmAction.message}
              onConfirm={() => {
                confirmAction.onConfirm();
                setConfirmAction(null);
              }}
              onCancel={() => setConfirmAction(null)}
            />
          )}

          {/* Contoh penggunaan pada hapus user */}
          {showDeleteUserOverlay && (
            <ConfirmOverlay
              message={`Yakin ingin menghapus user ${showDeleteUserOverlay.username}? Tindakan ini tidak dapat dibatalkan.`}
              onConfirm={async () => {
                await handleDeleteUser(showDeleteUserOverlay.id);
                setShowDeleteUserOverlay(null);
              }}
              onCancel={() => setShowDeleteUserOverlay(null)}
            />
          )}

          {/* Contoh penggunaan pada hapus forum */}
          {showDeleteForumOverlay && (
            <ConfirmOverlay
              message={`Yakin ingin menghapus forum ${showDeleteForumOverlay.judul}? Tindakan ini tidak dapat dibatalkan.`}
              onConfirm={async () => {
                await deleteForum(showDeleteForumOverlay.id);
                setShowDeleteForumOverlay(null);
              }}
              onCancel={() => setShowDeleteForumOverlay(null)}
            />
          )}

          {/* Contoh penggunaan pada hapus laporan */}
          {showDeleteLaporanOverlay && (
            <ConfirmOverlay
              message={`Yakin ingin menghapus laporan ${showDeleteLaporanOverlay.judul}? Tindakan ini tidak dapat dibatalkan.`}
              onConfirm={async () => {
                await deleteLaporan(showDeleteLaporanOverlay.id);
                setShowDeleteLaporanOverlay(null);
              }}
              onCancel={() => setShowDeleteLaporanOverlay(null)}
            />
          )}

          {loading ? (
            <div className="text-center text-gray-500 py-8">Memuat data...</div>
          ) : (
            <>
              {/* Laporan Tab */}
              {activeTab === 'laporan' && (
                <div id="admin-tab-laporan">
                  <h3 className="text-2 font-semibold mb-4">Daftar Laporan</h3>
                  <div className="overflow-x-auto rounded-lg shadow scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <table className="min-w-full bg-white rounded-lg text-xs sm:text-sm">
                      <thead>
                        <tr>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left rounded-tl-lg">ID</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">User ID</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Judul</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Status</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left rounded-tr-lg">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                          {laporan.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center text-gray-500 py-4">
                              Belum ada laporan.
                            </td>
                          </tr>
                        ) : (
                          laporan.map((l) => (
                            <tr key={l.id} onClick={() => { setSelectedLaporan(l); setDetail(true); }} className="border-t hover:bg-gray-50 cursor-pointer">
                              <td className="px-4 py-3">{l.id}</td>
                              <td className="px-4 py-3">{l.user_id}</td>
                              <td className="px-4 py-3">
                                <div className="font-semibold">{l.judul}</div>
                                <div className="text-xs text-gray-600">{l.deskripsi.substring(0, 50)}...</div>
                                <div className="flex gap-2 mt-1">
                                  {l.foto_url && (
                                    <a href={l.foto_url.startsWith('/') ? `${API_BASE_URL}${l.foto_url}` : l.foto_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">
                                      Lihat Foto
                                    </a>
                                  )}
                                  {l.video_url && (
                                    <a href={l.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600">
                                      Lihat Video
                                    </a>
                                  )}
                                </div>
                                {l.lokasi && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    <button
                                      type="button"
                                      className="text-blue-600 underline"
                                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                      onClick={() => {
                                        const [lat, lng] = l.lokasi.split(',');
                                        if (lat && lng) {
                                          window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
                                        }
                                      }}
                                    >
                                      {l.lokasi}
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${l.status === 'Selesai' ? 'bg-green-100 text-green-800' : l.status === 'Diproses' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                                >
                                  {l.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    className={`bg-yellow-500 text-white px-2 py-1 rounded text-xs ${l.status === 'Diproses' || l.status === 'Selesai' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-yellow-600'}`}
                                    onClick={(e) => { e.stopPropagation(); updateStatus(l.id, 'Diproses'); }}
                                    disabled={l.status === 'Diproses' || l.status === 'Selesai'}
                                  >
                                    Proses
                                  </button>
                                  <button
                                    className={`bg-green-600 text-white px-2 py-1 rounded text-xs ${l.status === 'Selesai' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-green-700'}`}
                                    onClick={(e) => { e.stopPropagation(); updateStatus(l.id, 'Selesai'); }}
                                    disabled={l.status === 'Selesai'}
                                  >
                                    Selesai
                                  </button>
                                  <button className="bg-red-600 text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-red-700" onClick={(e) => { e.stopPropagation(); setShowDeleteLaporanOverlay({ id: l.id, judul: l.judul }); }}>
                                    Hapus
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      
                    </table>
                    
                  </div>
                  
                </div>
                
              )}

              {detail && selectedLaporan && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onClick={() => { setDetail(false); setSelectedLaporan(null); }}>
                  <div className="bg-white p-6 rounded-2xl shadow-lg max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold">{selectedLaporan.judul}</h3>
                      <button className="text-gray-500" onClick={() => { setDetail(false); setSelectedLaporan(null); }} aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                    <p className="mt-2 text-gray-700 whitespace-pre-wrap">{selectedLaporan.deskripsi}</p>
                    {selectedLaporan.foto_url && <img src={selectedLaporan.foto_url} alt="foto" className="mt-4 max-h-80 w-full object-contain rounded" />}
                    {selectedLaporan.video_url && (
                      <a href={selectedLaporan.video_url} target="_blank" rel="noreferrer" className="block text-blue-600 mt-2">
                        Lihat Video
                      </a>
                    )}
                    <div className="mt-4 text-sm text-gray-500">Lokasi: {selectedLaporan.lokasi}</div>
                    <div className="mt-1 text-sm text-gray-500">Dibuat: {new Date(selectedLaporan.created_at).toLocaleString()}</div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => { setDetail(false); setSelectedLaporan(null); }}>
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div id="admin-tab-users">
                  <h3 className="text-xl font-semibold mb-4">Daftar User</h3>
                  <div className="overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full bg-white rounded-lg text-xs sm:text-sm">
                      <thead>
                        <tr>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left rounded-tl-lg">ID</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Email</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Username</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Role</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Poin</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left rounded-tr-lg">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-gray-500 py-4">
                              Belum ada user.
                            </td>
                          </tr>
                        ) : (
                          users.map((u) => (
                            <tr key={u.id} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3">{u.id}</td>
                              <td className="px-4 py-3">{u.email}</td>
                              <td className="px-4 py-3">{u.username}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{u.role}</span>
                              </td>
                              <td className="px-4 py-3">{u.poin}</td>
                              <td className="px-4 py-3">
                                {showMiniTab === u.id ? (
                                  <div className="fixed inset-0 flex px-6 md:px-0 items-center justify-center bg-black/50">
                                    <div className="bg-white p-6 rounded-2xl shadow-lg max-w-sm w-full">
                                      <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold">Edit User</h3>
                                        <button className="text-black" onClick={handleHideOverlay}>
                                          <XIcon size={16} weight="bold" />
                                        </button>
                                      </div>

                                      <input type="text" className="border rounded px-2 py-1 text-sm mb-4 w-full" placeholder="Ganti Username" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                                      <select className="border rounded px-2 py-1 text-sm mb-4 w-full" value={editRole} onChange={(e) => setEditRole(e.target.value)}>
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                      </select>
                                      <div className="flex justify-center gap-2">
                                        <button className="w-full text-red-600 border-2 font-medium border-red-600 px-4 py-2 rounded-xl text-sm " onClick={() => setShowDeleteUserOverlay({ id: u.id, username: u.username })}>
                                          Hapus User
                                        </button>
                                        <button className="w-full bg-[#32C439] text-white px-4 py-2 rounded-xl font-medium text-sm hover:bg-green-700 " onClick={() => handleSaveEditUser(u.id)}>
                                          Konfirmasi
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <button className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600" onClick={() => handleShowOverlay(u.id)}>
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Forums Tab */}
              {activeTab === 'forums' && (
                <div id="admin-tab-forums">
                  <h3 className="text-2 font-semibold mb-4">Daftar Forum</h3>
                  <div className="overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full bg-white rounded-lg text-xs sm:text-sm">
                      <thead>
                        <tr>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left rounded-tl-lg">ID</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Judul</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Author</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Tanggal</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left rounded-tr-lg">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forums.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center text-gray-500 py-4">
                              Belum ada forum.
                            </td>
                          </tr>
                        ) : (
                          forums.map((f) => (
                            <tr key={f.id} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3">{f.id}</td>
                              <td className="px-4 py-3 font-medium">{f.judul}</td>
                              <td className="px-4 py-3">{f.user}</td>
                              <td className="px-4 py-3">{new Date(f.created_at).toLocaleDateString()}</td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700" onClick={() => handleOpenForum(f.id)}>
                                    Open
                                  </button>
                                  {role === 'admin' && (
                                    <button className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700" onClick={() => setShowDeleteForumOverlay({ id: f.id, judul: f.judul })}>
                                      Hapus
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'forums' && openedForum && (
                <div id="admin-opened-forum" className="mt-8 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-start justify-between p-4 bg-gradient-to-r from-[#F6FFF5] to-white border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#E6F9E9] text-[#2E7D32] rounded-full flex items-center justify-center font-semibold text-lg">{openedForum.user?.charAt(0)?.toUpperCase() || 'U'}</div>
                      <div>
                        <h4 className="text-lg font-semibold leading-5">{openedForum.judul}</h4>
                        <div className="text-sm text-gray-500">
                          oleh <span className="font-medium text-gray-700">{openedForum.user}</span> • <span className="text-gray-400">{new Date(openedForum.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setOpenedForum(null)} aria-label="Close forum" className="text-gray-500 hover:text-gray-700 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M6.293 6.293a1 1 0 011.414 0L10 8.586l2.293-2.293a1 1 0 111.414 1.414L11.414 10l2.293 2.293a1 1 0 01-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 10 6.293 7.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Body: messages */}
                  <div className="p-4">
                    <div className="mb-3 text-sm text-gray-600 font-semibold">Pesan</div>
                    <div className="max-h-72 overflow-y-auto space-y-3 pb-2">
                      {forumMessages.length === 0 ? (
                        <div className="text-gray-500">Belum ada pesan.</div>
                      ) : (
                        forumMessages.map((msg, idx) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">{msg.user?.charAt(0)?.toUpperCase() || 'U'}</div>
                            <div className="flex-1">
                              <div className="bg-gray-50 border border-gray-100 p-3 rounded-lg shadow-sm">
                                <div className="text-sm font-medium text-gray-800">{msg.user}</div>
                                <div className="mt-1 text-gray-700 whitespace-pre-wrap">{msg.isi}</div>
                              </div>
                              <div className="text-xs text-gray-400 mt-1">{msg.created_at ? new Date(msg.created_at).toLocaleString() : ''}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Input area */}
                  <div className="p-4 border-t border-gray-100 bg-white flex gap-2 items-center">
                    <input
                      type="text"
                      className="border border-gray-300 rounded-lg px-3 py-2 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-200"
                      placeholder="Tulis pesan..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                      }}
                      aria-label="Tulis pesan"
                    />
                    <button className="bg-[#2E7D32] hover:bg-[#27692b] text-white px-4 py-2 rounded-lg text-sm" onClick={handleSendMessage} aria-label="Kirim pesan">
                      Kirim
                    </button>
                  </div>
                </div>
              )}

              {/* Tantangan Tab */}
              {activeTab === 'tantangan' && (
                <div id="admin-tab-tantangan">
                  <h3 className="text-xl font-semibold mb-4">Approval Tantangan User</h3>
                  <div className="overflow-x-auto rounded-lg shadow">
                    <table className="min-w-full bg-white rounded-lg text-xs sm:text-sm">
                      <thead>
                        <tr>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left rounded-tl-lg">ID</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">User</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Judul Tantangan</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Foto</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left">Status</th>
                          <th className="bg-[#25E82F] text-white px-4 py-2 text-left rounded-tr-lg">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tantanganUser.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-gray-500 py-4">
                              Tidak ada tantangan pending.
                            </td>
                          </tr>
                        ) : (
                          tantanganUser.map((t) => (
                            <tr key={t.id} className="border-t hover:bg-gray-50">
                              <td className="px-4 py-3">{t.id}</td>
                              <td className="px-4 py-3">{t.username || t.user_id}</td>
                              <td className="px-4 py-3">{t.judul || t.tantangan_id}</td>
                              <td className="px-4 py-3">
                                {t.foto_path ? (
                                  <a href={`http://localhost:8081/tmp/${t.foto_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                    Lihat Foto
                                  </a>
                                ) : (
                                  'Tidak ada foto'
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{t.status}</span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700" onClick={() => handleApproveTantangan(t.id)}>
                                    Approve
                                  </button>
                                  <button className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700" onClick={() => handleRejectTantangan(t.id)}>
                                    Reject
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
