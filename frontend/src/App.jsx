import { useState, useEffect } from 'react';
import { jobsApi } from './api/jobs';
import { RefreshCw, Settings, Trash2 } from 'lucide-react';
import Navbar from './components/Navbar';
import SettingsModal from './components/SettingsModal';

function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState('All');
  const [syncConfig, setSyncConfig] = useState({
    daysBack: 1,
    maxResults: 100
  });
  const [searchQuery, setSearchQuery] = useState('');

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

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showSettings]);


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

  const handleSaveConfig = (newConfig) => {
    setSyncConfig(newConfig);
    // localStorage will update automatically via useEffect
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

    const filteredJobs = jobs.filter(job => {
    const matchesStatus = filter === 'All' || job.status === filter;
    const matchesSearch = searchQuery === '' || 
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  const statusOptions = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];
  const filterOptions = ['All', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn'];

    return (
    <div className="min-h-screen bg-background">
      <Navbar 
        showSettings={showSettings} 
        onToggleSettings={() => setShowSettings(!showSettings)} 
      />
      
      <div className="max-w-7xl mx-auto px-8 py-4">
                  {/* Workspace Header */}
        <header className="mb-6 flex items-start justify-between gap-8">
          {/* Left Group */}
          <div className="flex-1">
            <p className="text-xs font-medium text-text-light uppercase tracking-widest mb-4">
              OVERVIEW / 2026
            </p>
            <h1 className="text-5xl font-extrabold font-display text-text mb-3 tracking-tight -ml-1.5">
              Your Workspace<span className="text-accent">.</span>
            </h1>
            <p className="text-lg text-text-light">
              A clearer view of your job search.
            </p>
          </div>
          
          {/* Right Group - Sync */}
          <div className="flex flex-col items-end gap-3 min-w-[220px]">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Gmail'}
            </button>
            
            {/* Scheduler Status - Single Line */}
            <div className="flex items-center justify-end gap-2 text-xs text-text-light">
              <div className={`w-1.5 h-1.5 rounded-full ${syncStatus?.scheduler_running ? 'bg-accent' : 'bg-gray-400'}`} />
              <span>{syncStatus?.scheduler_running ? 'Running' : 'Stopped'}</span>
              {syncStatus?.next_sync && (
                <>
                  <span className="text-text-light/50">·</span>
                  <span>
                    Next: {new Date(syncStatus.next_sync).toLocaleDateString()} {new Date(syncStatus.next_sync).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </>
              )}
            </div>
          </div>
        </header>
                {/* Statistics */}
        <div className="mb-2 grid grid-cols-5 gap-6 py-5 border-b border-border">
          <div>
            <p className="text-3xl font-extrabold font-display text-text">{jobs.length}</p>
            <p className="text-xs font-medium text-text-light uppercase tracking-wider mt-1">Total</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold font-display text-text">{jobs.filter(j => j.status === 'Applied').length}</p>
            <p className="text-xs font-medium text-text-light uppercase tracking-wider mt-1">Applied</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold font-display text-accent">{jobs.filter(j => j.status === 'Interviewing').length}</p>
            <p className="text-xs font-medium text-text-light uppercase tracking-wider mt-1">Interviewing</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold font-display text-accent">{jobs.filter(j => j.status === 'Offer').length}</p>
            <p className="text-xs font-medium text-text-light uppercase tracking-wider mt-1">Offers</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold font-display text-status-rejected">{jobs.filter(j => j.status === 'Rejected').length}</p>
            <p className="text-xs font-medium text-text-light uppercase tracking-wider mt-1">Rejected</p>
          </div>
        </div>
        

              {/* Applications Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-semibold font-display text-text mb-4">Applications.</h2>
            
            {/* Search Input */}
                        {/* Search Input */}
            <div className="relative w-64">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 text-text-light/50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search company or role"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 border-b border-border text-sm focus:outline-none focus:border-accent placeholder:text-text-light/50 bg-transparent transition-colors"
                aria-label="Search applications"
              />
            </div>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-8 border-b border-border mb-4">
            {filterOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`pb-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  filter === status
                    ? 'text-text border-b-2 border-accent'
                    : 'text-text-light hover:text-text'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
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
                {
                filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-text">
                      {job.company}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-text-light">
                      {job.role}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm">
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
                {searchQuery 
                  ? `No applications matching "${searchQuery}"`
                  : filter === 'All'
                  ? 'No job applications found. Click "Sync Gmail" to fetch your applications.'
                  : `No applications with status "${filter}"`
                }
              </div>
            )}
          </div>
        )}
      </div>
                <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        syncStatus={syncStatus}
        syncConfig={syncConfig}
        onSaveConfig={handleSaveConfig}
      />
    
    </div>
  );
}

export default App;