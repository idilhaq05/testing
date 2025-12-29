import { Link } from 'react-router-dom';

export default function QuickActions() {
  return (
    <div id="quick-actions" className="flex gap-4 md:gap-8 mb-8">
      <Link to="/Laporan" className="font-medium">
        <button id="quick-action-laporan" className="cursor-pointer bg-white text-black px-6 py-4 rounded-xl shadow-md flex items-center">➕ Buat Laporan Baru</button>
      </Link>

      <Link to="/Tantangan" className="font-medium">
        <button id="quick-action-tantangan" className="bg-white cursor-pointer text-black px-6 py-4 rounded-xl shadow-md flex items-center">🎯 Ikuti Tantangan Hari Ini</button>
      </Link>
    </div>
  );
}
