import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

type Article = {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source?: { name: string };
};

type ArtikelGridProps = {
  limit?: number;
  isDashboard?: boolean;
};

const ENV_KEYWORDS = [
  'lingkungan',
  'environment',
  'hijau',
  'polusi',
  'sampah',
  'udara',
  'air',
  'tanah',
  'energi',
  'iklim',
  'pemanasan global',
  'konservasi',
  'alam',
  'hutan',
  'bencana',
  'limbah',
  'plastik',
  'daur ulang',
  'emisi',
  'ekosistem',
  'flora',
  'fauna',
  'biodiversitas',
];

function isLingkungan(article: Article) {
  const text = (article.title + ' ' + (article.description || '')).toLowerCase();
  return ENV_KEYWORDS.some((k) => text.includes(k));
}

export default function ArtikelGrid({ limit = 8, isDashboard = false }: ArtikelGridProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isArtikelPage = location.pathname === '/Artikel';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/artikel`)
      .then((res) => res.json())
      .then((data) => {
        const all = Array.isArray(data.articles) ? data.articles : [];
        const filtered = all.filter(isLingkungan).slice(0, limit);
        setArticles(filtered);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [limit]);

  if (loading) return <div>Memuat artikel...</div>;
  if (articles.length === 0) return <div className="text-gray-500">Tidak ada artikel lingkungan ditemukan.</div>;

  const containerClasses = isDashboard ? '' : 'py-0 md:py-10 px-4';

  return (
    <div id={isDashboard ? 'artikel-grid-dashboard' : 'page-artikel'} className={containerClasses}>
      {!isDashboard && isArtikelPage && <h1 className="text-2xl font-bold mb-4 md:mb-8">Artikel</h1>}

      <div id={isDashboard ? 'artikel-grid-dashboard-list' : 'artikel-grid-list'} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {articles.map((a, idx) => (
          <a id={`${isDashboard ? 'artikel-card-dashboard-' : 'artikel-card-'}${idx}`} href={a.url} target="_blank" rel="noopener noreferrer" key={idx} className="block bg-white rounded-xl shadow hover:shadow-lg transition p-0 mb-4">
            {a.urlToImage && <img src={a.urlToImage} alt={a.title} className="w-full h-32 object-cover rounded-t-xl" />}
            <div className="p-4">
              <div className="font-bold text-base mb-1 line-clamp-2">{a.title}</div>
              <div className="text-sm text-gray-700 mb-1 line-clamp-2">{a.description}</div>
              <div className="text-xs text-gray-500">{a.source?.name}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
