import { QuestionMarkIcon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import ilustrasi1 from '../../assets/ilustrasi1.svg';

export default function PengenalanWeb() {
  const navigate = useNavigate();
  const handleButtonClick = () => {
    navigate('/login');
  };
  return (
    <section id="pengenalan" className="mt-20 mx-auto w-full flex flex-col items-center justify-center px-10 md:px-12 lg:px-0">
      <div className="flex w-full justify-between max-w-[1200px] items-center flex-col lg:flex-row gap-20 md:gap-10">
        <div className="max-w-xl">
          <div className="flex gap-2 items-center bg-black rounded-full px-6 py-1 mb-6 text-white w-fit">
            <QuestionMarkIcon className="overflow-clip rotate-30" size={30} weight="bold" />
            <h3 className="font-semibold">Perkenalan</h3>
          </div>

          <h1 className="text-4xl font-bold mb-4 text-[#009B08]">Apa itu Ecosteps Report?</h1>
          <p className="text-[#4F4F4F] mb-6 font-medium">
            Ecosteps Report adalah wadah untuk melaporkan berbagai hal yang dapat merusak lingkungan, seperti polusi, deforestasi, pembuangan sampah sembarangan, atau aktivitas ilegal yang membahayakan ekosistem dan lingkungan.{' '}
          </p>
          <button id="landing-cta-login" className="bg-[#009B08] cursor-pointer hover:bg-green-700 duration-200 transition-colors rounded-full px-6 py-2.5 text-white font-medium" onClick={handleButtonClick}>
            Coba sekarang
          </button>
        </div>
        <img className="w-[400px]" src={ilustrasi1} alt="ilustrasi1" />
      </div>
    </section>
  );
}
