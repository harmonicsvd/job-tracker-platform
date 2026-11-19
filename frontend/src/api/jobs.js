import axios from 'axios';
 
const API_BASE_URL = 'http://localhost:8000';


export const jobsApi = {
  // Get all job applications
  getAllJobs: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/jobs`);
    return response.data;
  },
    // Create new job application
  createJob: async (jobData) => {
    const response = await axios.post(`${API_BASE_URL}/api/jobs/`, jobData);
    return response.data;
  },
  // Sync Gmail
  syncGmail: async (daysBack = 7, maxResults = 50) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/gmail/sync?days_back=${daysBack}&max_results=${maxResults}`
    );
    return response.data;
  },
   // Get sync status
  getSyncStatus: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/jobs/sync-status`);
    return response.data;
  },
  
   // Update job status (uses PATCH)
  updateJobStatus: async (id, status) => {
    const response = await axios.patch(`${API_BASE_URL}/api/jobs/${id}`, { status });
    return response.data;
  },

  // Delete job application
  deleteJob: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/api/jobs/${id}`);
    return response.data;
  },
};