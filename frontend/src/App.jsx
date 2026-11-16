import { useState, useEffect } from 'react';
import { jobsApi } from './api/jobs';
import { RefreshCw } from 'lucide-react';
 
function App() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
 
  // Fetch jobs on load
  useEffect(() => {
    fetchJobs();
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
      await jobsApi.syncGmail();
      await fetchJobs(); // Refresh the list
    } catch (error) {
      console.error('Error syncing Gmail:', error);
    } finally {
      setSyncing(false);
    }
  };

   return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Job Application Tracker</h1>
          <p className="text-gray-600">Track your job applications automatically from Gmail</p>
        </header>
 
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Gmail'}
          </button>
        </div>
 
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {job.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'Applied' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'Interviewing' ? 'bg-green-100 text-green-800' :
                        job.status === 'Offer' ? 'bg-purple-100 text-purple-800' :
                        job.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.application_date ? new Date(job.application_date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {jobs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No job applications found. Click "Sync Gmail" to fetch your applications.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
 
export default App;