import { Search, Bell, Globe, Moon, Menu, Zap } from 'lucide-react';

const TopNav = ({ onMenuClick }) => {
  return (
    <header className="w-full bg-dark flex border-white/5 border-b-1 items-center justify-between">
      <div className="flex items-center p-5">
        <div className="flex p-4 text-white block lg:hidden">
          <button
            onClick={onMenuClick}
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center gap-2 ml-4">
            <Zap className="text-primary" size={20} fill="currentColor" color="currentColor"  />
            <span className="font-extrabold" >ALMA</span>
          </div>

        </div>
        <div className="flex items-center gap-2 bg-white/4 rounded-md py-2 px-4 text-gray-300 border-white/8 focus-within:border-primary transition-[border] transition-500 border-2">
          <Search size={18} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent border-none focus:outline-none w-xxs lg:w-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 px-4">
        <div className="mr-8 px-4 py-1 border-success/30 bg-success/10 rounded-full border-1 flex items-center gap-2">
          <span className="text-gray-300 rounded-full w-4 h-4 inline-block bg-radial from-success via-success to-success/30 to-60% animate-pulse">&nbsp;</span>
          <span className="text-gray-300" >Statut Système:</span>
          <span className="text-green-500" >Opérationnel</span>
        </div>


        <div className="flex items-center gap-6 text-white border-l-1 border-gray-500/50 px-10">
          <button className="flex gap-2 items-center">
            <Globe size={18} />
            <span >FR</span>
          </button>
          <button >
            <Moon size={18} />
          </button>
          <button className="relative">
            <div className="absolute -top-3 left-0 right-0">
              <div className="bg-red-500 rounded-full w-5 h-5" />
              <div className="absolute left-1 right-0 -top-1">
                3
              </div>
            </div>
            <Bell size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
