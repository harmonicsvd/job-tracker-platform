import axios from 'axios';
 
const API_BASE_URL = 'http://localhost:8000';


export const jobsApi = {
  // Get all job applications
  getAllJobs: async () => {
    const response = await axios.get(`${API_BASE_URL}/api/jobs`);
    return response.data;
  },
 
  // Sync Gmail
  syncGmail: async (daysBack = 7, maxResults = 50) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/gmail/sync?days_back=${daysBack}&max_results=${maxResults}`
    );
    return response.data;
  },
 
  // Update job status (we'll add this endpoint later)
  updateJobStatus: async (id, status) => {
    // TODO: Add this endpoint to backend
    const response = await axios.put(`${API_BASE_URL}/api/jobs/${id}`, { status });
    return response.data;
  },
};