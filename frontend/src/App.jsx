import { useState, useEffect } from 'react';
import { jobsApi } from './api/jobs';
import { RefreshCw, Settings, Trash2 } from 'lucide-react';
import Navbar from './components/Navbar';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState('All');
  const [syncConfig, setSyncConfig] = useState({
    daysBack: 7,
    maxResults: 50
  });

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('syncConfig');
    if (savedConfig) {
      setSyncConfig(JSON.parse(savedConfig));
    }
    fetchJobs();
  }, []);

  // Save config when it changes
  useEffect(() => {
    localStorage.setItem('syncConfig', JSON.stringify(syncConfig));
  }, [syncConfig]);


  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const status = await jobsApi.getSyncStatus();
        setSyncStatus(status);
      } catch (error) {
        console.error('Error fetching sync status:', error);
      }
    };
    fetchSyncStatus();
    // Refresh sync status every 30 seconds
    const interval = setInterval(fetchSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);


  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobsApi.getAllJobs();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await jobsApi.syncGmail(syncConfig.daysBack, syncConfig.maxResults);
      await fetchJobs();
    } catch (error) {
      console.error('Error syncing Gmail:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await jobsApi.updateJobStatus(id, newStatus);
      await fetchJobs();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this application?')) return;
    
    try {
      await jobsApi.deleteJob(id);
      await fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const filteredJobs = filter === 'All' 
    ? jobs 
    : jobs.filter(job => job.status === filter);

  const statusOptions = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];
  const filterOptions = ['All', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];

    return (
    <div className="min-h-screen bg-background">
      <Navbar 
        showSettings={showSettings} 
        onToggleSettings={() => setShowSettings(!showSettings)} 
      />
      
      <div className="max-w-7xl mx-auto px-8 py-16">
               {/* Workspace Header */}
        <header className="mb-16">
          <p className="text-xs font-medium text-text-light uppercase tracking-widest mb-4">
            OVERVIEW / 2026
          </p>
          <h1 className="text-5xl font-extrabold font-display text-text mb-3 tracking-tight">
            Your Workspace<span className="text-accent">.</span>
          </h1>
          <p className="text-lg text-text-light">
            A clearer view of your job search.
          </p>
        </header>

                {/* Gmail Sync Section */}
        <div className="mb-16 flex items-center justify-between">
          {/* Scheduler Info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${syncStatus?.scheduler_running ? 'bg-accent' : 'bg-gray-400'}`} />
              <span className="text-sm text-text-light">
                {syncStatus?.scheduler_running ? 'Scheduler running' : 'Scheduler stopped'}
              </span>
            </div>
            {syncStatus?.last_sync && (
              <span className="text-sm text-text-light">
                Last sync: {new Date(syncStatus.last_sync).toLocaleDateString()}
              </span>
            )}
            {syncStatus?.next_sync && (
              <span className="text-sm text-text-light">
                Next: {new Date(syncStatus.next_sync).toLocaleDateString()} at {new Date(syncStatus.next_sync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            )}
          </div>
          
          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Gmail'}
          </button>
        </div>

        {/* Keep the rest of your existing code unchanged */}
        {showSettings && (
          <div className="mb-12 p-6 bg-surface rounded border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text">Sync Configuration</h3>
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Days Back
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={syncConfig.daysBack}
                  onChange={(e) => setSyncConfig({...syncConfig, daysBack: parseInt(e.target.value)})}
                  className="w-32 px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  Max Results
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={syncConfig.maxResults}
                  onChange={(e) => setSyncConfig({...syncConfig, maxResults: parseInt(e.target.value)})}
                  className="w-32 px-3 py-2 border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
            <p className="text-sm text-text-light mt-2">
              Sync emails from the last {syncConfig.daysBack} days (max {syncConfig.maxResults} emails)
            </p>
          </div>
        )}

        <div className="mb-12 flex gap-3 items-center">
          <span className="text-sm font-medium text-text">Filter:</span>
          {filterOptions.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-accent text-white'
                  : 'bg-gray-200 text-text hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
            
          ))}
          
        </div>
          
          
        {loading ? (
          <div className="text-center py-12 text-text">Loading...</div>
        ) : (
          <div className="bg-surface rounded border border-border overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-light uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text">
                      {job.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                      {job.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={job.status}
                        onChange={(e) => handleStatusChange(job.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === 'Applied' ? 'bg-status-applied text-white' :
                          job.status === 'Interviewing' ? 'bg-status-interviewing text-white' :
                          job.status === 'Offer' ? 'bg-status-offer text-white' :
                          job.status === 'Rejected' ? 'bg-status-rejected text-white' :
                          'bg-status-withdrawn text-white'
                        }`}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-light">
                      {job.application_date ? new Date(job.application_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDelete(job.id)}
                        className="text-status-rejected hover:opacity-80"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredJobs.length === 0 && (
              <div className="text-center py-12 text-text-light">
                {filter === 'All' 
                  ? 'No job applications found. Click "Sync Gmail" to fetch your applications.'
                  : `No applications with status "${filter}"`
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;