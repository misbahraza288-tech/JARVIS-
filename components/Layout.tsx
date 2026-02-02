
import React from 'react';
import { AppView } from '../types';
import { 
  Cpu, 
  Sparkles, 
  Activity, 
  LayoutDashboard,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Mic,
  Settings,
  Github
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, onViewChange }) => {
  return (
    <div className="flex h-screen w-full bg-[#030712] overflow-hidden text-gray-200">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 glass border-r border-gray-800 flex flex-col items-center md:items-stretch py-6 transition-all">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <Cpu className="text-white w-6 h-6" />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tight gradient-text">Lumina AI</span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem 
            icon={<MessageSquare className="w-5 h-5" />} 
            label="Intelligence" 
            active={activeView === AppView.INTELLIGENCE} 
            onClick={() => onViewChange(AppView.INTELLIGENCE)}
          />
          <NavItem 
            icon={<ImageIcon className="w-5 h-5" />} 
            label="Vision Studio" 
            active={activeView === AppView.VISION} 
            onClick={() => onViewChange(AppView.VISION)}
          />
          <NavItem 
            icon={<Activity className="w-5 h-5" />} 
            label="Presence Live" 
            active={activeView === AppView.PRESENCE} 
            onClick={() => onViewChange(AppView.PRESENCE)}
          />
        </nav>

        <div className="px-4 py-4 border-t border-gray-800/50 space-y-1">
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={false} onClick={() => {}} />
          <NavItem icon={<Github className="w-5 h-5" />} label="Github" active={false} onClick={() => {}} />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-16 glass border-b border-gray-800 flex items-center justify-between px-8 z-10">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest">
            {activeView === AppView.INTELLIGENCE && "Deep Intelligence Workspace"}
            {activeView === AppView.VISION && "Creative Vision Studio"}
            {activeView === AppView.PRESENCE && "Multimodal Live Experience"}
          </h2>
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <img key={i} src={`https://picsum.photos/seed/${i}/32/32`} className="w-8 h-8 rounded-full border-2 border-[#030712]" alt="User" />
                ))}
             </div>
             <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">
               Share Workspace
             </button>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-950 to-[#030712]">
          {children}
        </div>
      </main>
    </div>
  );
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${
        active 
          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
          : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
      }`}
    >
      <span className={`${active ? 'text-blue-400' : 'group-hover:scale-110 transition-transform'}`}>
        {icon}
      </span>
      <span className="hidden md:block font-medium">{label}</span>
      {active && <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-glow shadow-blue-500" />}
    </button>
  );
};

export default Layout;
