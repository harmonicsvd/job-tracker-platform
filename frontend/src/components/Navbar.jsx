import { Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function Navbar({ showSettings, onToggleSettings }) {
  const { user, logout } = useAuth();

  return (
    <nav className="h-[72px] bg-[#17231F]">
      <div className="px-6 md:px-12 h-full flex items-center justify-between">
        {/* Brand */}
        <span className="text-2xl font-extrabold font-display text-white tracking-tight">
          sniff<span className="text-sage">.</span>
        </span>
        
        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* User info */}
          {user && (
            <span className="text-sm text-gray-300">
              {user.name || user.email}
            </span>
          )}
          
          {/* Logout */}
          {user && (
            <button 
              onClick={logout}
              className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-sage transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          
          {/* Settings */}
          <button 
            onClick={onToggleSettings}
            className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-sage transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;