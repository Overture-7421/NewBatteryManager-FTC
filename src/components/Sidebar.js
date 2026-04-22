import { NavLink } from 'react-router-dom';
import { Battery, GitBranch, Package, Settings } from 'lucide-react';
import LogoMark from './LogoMark';

const Sidebar = () => {
  const navItems = [
    { path: '/batteries', icon: Battery, label: 'Baterías' },
    { path: '/matches', icon: GitBranch, label: 'Matches' },
    { path: '/borrowed', icon: Package, label: 'Prestados' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-20 md:w-64 flex-shrink-0 border-r border-[#272732] bg-[#1A1A22] min-h-screen">
      <div className="p-4 md:p-6 border-b border-[#272732]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <LogoMark className="w-8 h-8 logo-gradient-animate" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold text-white">Overture</h1>
            <p className="text-xs text-[#9CA3AF]">23619</p>
          </div>
        </div>
      </div>
      
      <nav className="p-2 md:p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            data-testid={`nav-${item.label.toLowerCase()}`}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-[#7C3AED]/20 text-[#A78BFA] border-l-4 border-[#7C3AED]'
                  : 'text-[#9CA3AF] hover:bg-[#252530] hover:text-[#E5E7EB]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-[#7C3AED]' : ''}`} />
                <span className="hidden md:block font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
