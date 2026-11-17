import { Settings } from 'lucide-react';

function Navbar({ showSettings, onToggleSettings }) {
  return (
    <nav className="h-16 border-b border-border bg-surface">
      <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
        {/* Brand */}
        <span className="text-lg font-extrabold font-display text-text tracking-tight">
          JOB APPLICATION TRACKER<span className="text-accent">.</span>
        </span>
        
        {/* Settings */}
        <button 
          onClick={onToggleSettings}
          className="inline-flex items-center gap-2 text-sm text-text-light hover:text-accent transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </nav>
  );
}

export default Navbar;