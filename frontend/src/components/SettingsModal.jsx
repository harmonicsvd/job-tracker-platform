import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import SettingsSidebar from './SettingsSidebar';
import GmailSyncSettings from './GmailSyncSettings';

function SettingsModal({ isOpen, onClose, syncStatus, syncConfig, onSaveConfig  }) {
  const [activeCategory, setActiveCategory] = useState('gmail-sync');

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Modal Content */}
      <div 
        className="relative bg-surface rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-xl font-semibold font-display text-text">Settings</h2>
          <button 
            onClick={onClose}
            className="p-1 text-text-light hover:text-text transition-colors"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content Area */}
        <div className="flex h-[calc(90vh-73px)]">
          <SettingsSidebar 
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
          
        {/* Right Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeCategory === 'gmail-sync' && (
              <GmailSyncSettings 
                config={syncConfig}
                onSave={onSaveConfig}
                syncStatus={syncStatus}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;