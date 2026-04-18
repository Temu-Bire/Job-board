import axios from 'axios';

// In dev, Vite proxy serves /api -> backend.
// In production, set VITE_API_BASE_URL to your backend URL + /api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


// Add this to your existing api.js or where your API instance is created
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['X-Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    throw error.response?.data || error;
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  },

  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response;
  },
};


export const jobAPI = {
  getAllJobs: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));

    if (filters.search) params.append('search', filters.search);
    if (filters.location) params.append('location', filters.location);
    if (filters.type) params.append('type', filters.type);
    if (filters.salaryMin != null && filters.salaryMin !== '') {
      params.append('salaryMin', String(filters.salaryMin));
    }
    if (filters.salaryMax != null && filters.salaryMax !== '') {
      params.append('salaryMax', String(filters.salaryMax));
    }

    const qs = params.toString();
    return api.get(`/jobs${qs ? `?${qs}` : ''}`);
  },

  getJobById: (id) => api.get(`/jobs/${id}`),

  createJob: (jobData) => api.post('/jobs', jobData),

  updateJob: (id, jobData) => api.put(`/jobs/${id}`, jobData),

  deleteJob: (id) => api.delete(`/jobs/${id}`),

  getRecruiterJobs: () => api.get('/jobs/recruiter/my-jobs'),

  saveJob: (id) => api.post(`/jobs/${id}/save`),

  unsaveJob: (id) => api.delete(`/jobs/${id}/save`),
};
export const applicationAPI = {
  applyForJob: (jobId, applicationData) =>
    api.post(`/applications/job/${jobId}`, applicationData),

  getJobseekerApplications: () =>
    api.get('/applications/jobseeker/my-applications'),

  getJobApplicants: (jobId) =>
    api.get(`/applications/job/${jobId}/applicants`),

  updateApplicationStatus: (applicationId, status) =>
    api.put(`/applications/${applicationId}/status`, { status }),
};
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response;
  },

  updateProfile: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response;
  },

  updateJobseekerProfile: async (userId, profileData) => {
    const response = await api.put(`/users/${userId}/jobseeker-profile`, profileData);
    return response;
  },

  uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post(`/users/${userId}/jobseeker-profile/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  uploadResume: async (userId, file) => {
    const formData = new FormData();
    formData.append('resume', file);
    const response = await api.post(`/users/${userId}/jobseeker-profile/resume`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response;
  },

  getAllUsers: async () => {
    const response = await api.get('/users');
    return response;
  },

  approveRecruiter: async (recruiterId) => {
    const response = await api.put(`/users/${recruiterId}/approve`);
    return response;
  },

  blockUser: async (userId) => {
    const response = await api.put(`/users/${userId}/block`);
    return response;
  },

  resetPassword: async (userId, password) => {
    const response = await api.put(`/users/${userId}/reset-password`, { password });
    return response;
  },

  getSavedJobs: async () => {
    const response = await api.get('/users/saved-jobs');
    return response;
  },
};


export const statsAPI = {
  getPublicStats: async () => {
    const response = await api.get('/stats/public');
    return response;
  },

  getAdminStats: async () => {
    const response = await api.get('/stats/admin');
    return response;
  },

  getRecruiterStats: async () => {
    const response = await api.get('/stats/recruiter');
    return response;
  },

  getJobseekerStats: async () => {
    const response = await api.get('/stats/jobseeker');
    return response;
  },
};

export const notificationAPI = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

export const messageAPI = {
  getConversations: async () => {
    const response = await api.get(`/messages`);
    return response;
  },

  getConversation: async (userId) => {
    const response = await api.get(`/messages/${userId}`);
    return response;
  },

  sendMessage: async (userId, message) => {
    const response = await api.post(`/messages/${userId}`, { message });
    return response;
  },
};

export const contactAPI = {
  submitContactForm: async (data) => {
    const response = await api.post('/contact', data);
    return response;
  }
};

export default api;
