import { useState, useEffect } from 'react';
import { jobsApi } from './api/jobs';
import { RefreshCw, Settings, Trash2, ChevronDown } from 'lucide-react';
import Navbar from './components/Navbar';
import SettingsModal from './components/SettingsModal';
import AddApplicationModal from './components/AddApplicationModal';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import toast from 'react-hot-toast';
 
function App() {
  const { user, loading: authLoading } = useAuth();

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('syncConfig');
    if (savedConfig) {
      setSyncConfig(JSON.parse(savedConfig));
    }
    if (user) {
      fetchJobs();
    }
  }, [user]);

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

  // Show loading state while checking auth
  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Login />;
  }


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

    toast.success('Sync completed successfully!', {
      id: 'gmail-sync-success',
      duration: 5000,
    });

  } catch (error) {
    console.error('Sync failed:', error);

    const errorType = error.response?.data?.detail?.error_type;

    if (errorType === 'gmail_quota_exceeded') {
      toast.error('Wait a few minutes and try again.', {
        id: 'gmail-quota-exceeded',
        duration: 10000,
      });

    } else if (errorType === 'groq_quota_exceeded') {
      toast.error('Change your API key or wait for the quota to reset.', {
        id: 'groq-quota-exceeded',
        duration: 10000,
      });

    } else {
      toast.error('Sync failed. Please try again.', {
        id: 'gmail-sync-error',
        duration: 10000,
      });
    }

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

  const handleAddApplication = async (jobData) => {
    try {
      await jobsApi.createJob(jobData);
      await fetchJobs();
    } catch (error) {
      console.error('Error adding application:', error);
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
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-white text-sm font-medium rounded transition-all ${
                syncing
                  ? 'bg-accent/70 cursor-not-allowed'
                  : 'bg-accent hover:bg-accent/90 hover:scale-105 active:scale-95'
              }`}
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

  {/* Row 1: Applications Heading */}
  <div className="mb-3">
    <h2 className="text-2xl font-semibold font-display text-text">
      Applications.
    </h2>
  </div>

  {/* Row 2: Filters + Search + Add Application */}
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-border mb-4">

    {/* Left: Status Filters */}
    <div className="flex min-w-0 gap-6 overflow-x-auto">
      {filterOptions.map((status) => (
        <button
          key={status}
          onClick={() => setFilter(status)}
          className={`h-11 shrink-0 border-b-2 text-sm font-medium transition-colors
            focus-visible:outline-2 focus-visible:outline-accent
            ${
              filter === status
                ? 'text-text border-accent'
                : 'text-text-light border-transparent hover:text-text'
            }`}
        >
          {status}
        </button>
      ))}
    </div>

    {/* Right: Search + Add Application */}
    <div className="flex items-center gap-2 pb-3 lg:pb-0">

      {/* Search Input - No Underline */}
      <div className="relative w-64 border-b border-transparent focus-within:border-accent transition-colors">

        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-text-light/60 pointer-events-none">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>

        <input
          type="text"
          placeholder="Search company or role"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search applications"
          className="search-input w-full pl-8 pr-2 py-2 bg-transparent border-0 rounded-none text-sm text-text placeholder:text-text-light/50 outline-none focus:outline-none focus:ring-0"
        />
      </div>

      {/* Add Application Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="shrink-0 whitespace-nowrap px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent/90 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        +
      </button>

    </div>
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
                      <div className="relative inline-block w-32">
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job.id, e.target.value)}
                          className={`w-full appearance-none pr-8 py-1.5 px-3 rounded-md text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 ${
                            job.status === 'Applied' ? 'bg-status-applied/20 text-status-applied' :
                            job.status === 'Interviewing' ? 'bg-status-interviewing/20 text-status-interviewing' :
                            job.status === 'Offer' ? 'bg-status-offer/20 text-status-offer' :
                            job.status === 'Rejected' ? 'bg-status-rejected/20 text-status-rejected' :
                            'bg-status-withdrawn/20 text-status-withdrawn'
                          }`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
                      </div>
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
          <AddApplicationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddApplication}
      />
    </div>
  );
}

export default App;
