
import { useState, useEffect } from 'react';
function GmailSyncSettings({ config, onSave, syncStatus }) {
  const [tempConfig, setTempConfig] = useState(config);

  // Update temp config when config prop changes
  useEffect(() => {
    setTempConfig(config);
  }, [config]);

  const handleSave = () => {
    onSave(tempConfig);
  };

  const handleCancel = () => {
    setTempConfig(config);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-text mb-1">Gmail Sync Configuration</h3>
        <p className="text-sm text-text-light">
          Configure how often and how many emails to sync from Gmail.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Days Back
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={tempConfig.daysBack}
            onChange={(e) => setTempConfig({...tempConfig, daysBack: parseInt(e.target.value) || 1})}
            className="w-full max-w-xs px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="text-xs text-text-light mt-1">
            Sync emails from the last {tempConfig.daysBack} days
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-2">
            Maximum Emails
          </label>
          <input
            type="number"
            min="1"
            max="200"
            value={tempConfig.maxResults}
            onChange={(e) => setTempConfig({...tempConfig, maxResults: parseInt(e.target.value) || 1})}
            className="w-full max-w-xs px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <p className="text-xs text-text-light mt-1">
            Maximum {tempConfig.maxResults} emails to fetch per sync
          </p>
        </div>
      </div>

      {/* Scheduler Status */}
      {syncStatus && (
        <div className="p-4 bg-background rounded border border-border">
          <h4 className="text-sm font-medium text-text mb-3">Scheduler Status</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${syncStatus.scheduler_running ? 'bg-accent' : 'bg-gray-400'}`} />
              <span className="text-text-light">
                {syncStatus.scheduler_running ? 'Running' : 'Stopped'}
              </span>
            </div>
            {syncStatus.last_sync && (
              <p className="text-text-light">
                Last sync: {new Date(syncStatus.last_sync).toLocaleString()}
              </p>
            )}
            {syncStatus.next_sync && (
              <p className="text-text-light">
                Next sync: {new Date(syncStatus.next_sync).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded hover:opacity-90 transition-opacity"
        >
          Save Changes
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2 border border-border text-text text-sm font-medium rounded hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default GmailSyncSettings;