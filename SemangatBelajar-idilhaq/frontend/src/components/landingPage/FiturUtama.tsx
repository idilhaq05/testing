import { CloverIcon } from '@phosphor-icons/react';
import bg1 from '../../assets/1.svg';
import bg2 from '../../assets/2.svg';
import bh3 from '../../assets/3.svg';
import bg4 from '../../assets/4.svg';
import bg5 from '../../assets/5.svg';

export default function FiturUtama() {
  return (
    <section id="fitur" className="mt-20 bg-white px-4 md:px-20 lg:px-32 py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Badge Solusi Kami */}
        <div className="relative left-5 lg:left-40 flex gap-2 items-center bg-black rounded-full px-6 py-1 mb-4 text-white w-fit">
          <CloverIcon className="overflow-clip rotate-12" size={30} weight="bold" />
          <h3 className="font-semibold">Solusi Kami</h3>
        </div>

        {/* Heading and Description */}
        <div className="flex flex-col md:flex-row justify-around mb-10 relative left-5 lg:left-30">
          <h1 className="text-3xl md:text-4xl max-w-3xl text-[#009B08] font-medium mb-4 md:mb-0">Mendorong Aksi Konservasi yang Efektif melalui Teknologi dan Analisis Data</h1>
          <p className="text-left text-sm text-[#8F8F8F] max-w-[250px] md:max-w-[350px]">
            Perubahan besar tidak bisa dilakukan sendiri. Ecosteps menjembatani laporan masyarakat dengan puluhan lembaga pemerintah dan organisasi masyarakat sipil di bidang lingkungan.
          </p>
        </div>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative left-5 lg:left-40">
          <div className="overflow-hidden rounded-2xl">
            <img src={bg1} alt="Pohon dari bawah" className="rounded-2xl w-72 md:w-full h-82 object-cover hover:scale-95 md:hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img src={bg2} alt="Daun hijau" className="rounded-2xl w-72 md:w-full h-82 object-cover hover:scale-95 md:hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img src={bh3} alt="Tanaman muda" className="rounded-2xl w-72 md:w-full h-82 object-cover hover:scale-95 md:hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img src={bg4} alt="Daun di tangan" className="rounded-2xl w-72 md:w-full h-82 object-cover hover:scale-95 md:hover:scale-110 transition-transform duration-300" />
          </div>
          <div className="overflow-hidden rounded-2xl">
            <img src={bg5} alt="Hutan pinus" className="rounded-2xl w-72 md:w-full h-82 object-cover hover:scale-95 md:hover:scale-110 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </section>
  );
}
