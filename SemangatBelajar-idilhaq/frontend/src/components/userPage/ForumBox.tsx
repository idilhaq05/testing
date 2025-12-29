import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type Forum = {
  id: number;
  judul: string;
  author: string;
  created_at: string;
};

export default function ForumBox() {
  const [forums, setForums] = useState<Forum[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:8081/api/forum')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setForums(data);
      });
  }, []);

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <div className="font-bold text-lg mb-2 flex items-center gap-2">
        <span>Forum Diskusi</span>
      </div>
      {forums.length === 0 ? (
        <div className="text-gray-500">Belum ada forum.</div>
      ) : (
        <ul className="divide-y">
          {forums.slice(0, 5).map((forum) => (
            <li key={forum.id} className="py-2 flex justify-between items-center">
              <div>
                <div className="font-semibold">{forum.judul}</div>
                <div className="text-xs text-gray-500">
                  oleh {forum.author} • {new Date(forum.created_at).toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-right">
        <button
          className="text-green-700 hover:underline text-sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate('/Forum');
          }}
        >
          Lihat Semua Forum &rarr;
        </button>
      </div>
    </div>
  );
}
