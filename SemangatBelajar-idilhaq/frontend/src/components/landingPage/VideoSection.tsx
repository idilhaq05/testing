import { useState } from 'react';
import * as Phospor from '@phosphor-icons/react';

const VIDEO_THUMB = 'https://images.unsplash.com/photo-1520716497194-0bde97ce9abe?q=80&w=1965&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
const YOUTUBE_ID = 'UV0mhY2Dxr0';

const FEATURES = [
  {
    icon: (
      <span className="inline-block">
        <Phospor.GlobeHemisphereEastIcon size={20} weight="bold" />
      </span>
    ),
    label: 'Data Laporan',
  },
  {
    icon: (
      <span className="inline-block">
        <Phospor.LeafIcon size={20} weight="bold" />
      </span>
    ),
    label: 'Peduli lingkungan',
  },
  {
    icon: (
      <span className="inline-block">
        <Phospor.ChartBarIcon size={20} weight="bold" />
      </span>
    ),
    label: 'Analisis & Verifikasi',
  },
  {
    icon: (
      <span className="inline-block">
        <Phospor.PersonIcon size={20} weight="bold" />
      </span>
    ),
    label: 'Informasi Pelapor',
  },
  {
    icon: (
      <span className="inline-block">
        <Phospor.CameraIcon size={20} weight="bold" />
      </span>
    ),
    label: 'Bukti Pendukung',
  },
  {
    icon: (
      <span className="inline-block">
        <Phospor.PresentationChartIcon size={20} weight="bold" />
      </span>
    ),
    label: 'Pelacakan Status',
  },
  {
    icon: (
      <span className="inline-block">
        <Phospor.BuildingOfficeIcon size={20} weight="bold" />
      </span>
    ),
    label: 'Tindak Lanjut Instansi',
  },
];

export default function VideoSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section id="video" className="bg-[#0F1F12] w-full mt-20 pb-16">
      <div className="h-[900px] flex flex-col items-center ">
        {/* Video */}
        <div className="w-full relative aspect-video rounded-lg overflow-hidden mb-20">
          {!playing ? (
            <div className="w-full h-full relative group">
              <img src={VIDEO_THUMB} alt="Video thumbnail" className="w-full h-full object-cover" draggable={false} />
              <div className="absolute inset-0 bg-black/30 transition"></div>
              <button
                id="landing-video-play"
                onClick={() => setPlaying(true)}
                className="cursor-pointer absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/5 backdrop-blur-[5px] hover:scale-105 transition-transform rounded-full p-6 flex items-center justify-center"
                aria-label="Play Video"
              >
                <Phospor.PlayIcon size={48} color="#fff" weight="bold" />
              </button>
            </div>
          ) : (
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1`} allow="autoplay; encrypted-media" allowFullScreen />
          )}
        </div>
        {/* Judul & deskripsi */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center justify-center px-10">
          <h1 className="font-medium text-2xl md:text-4xl text-white mb-6">Bagaimana ECOSTEPS Bekerja?</h1>
          <p className="text-[#A1A1A1] mb-15 text-base md:text-lg">Setiap laporan yang masuk akan melalui proses terstruktur untuk memastikan validitas dan penanganan yang efektif oleh pihak yang berwenang.</p>
        </div>
        {/* Fitur-fitur */}
        <div className="flex flex-wrap max-w-sm md:max-w-2xl lg:max-w-4xl gap-4 justify-center px-[5px] md:px-6 lg:px-0">
          {FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-[#ffffff]/11 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-[17px]">
              {f.icon}
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
