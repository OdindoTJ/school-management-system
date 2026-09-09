import apiClient from './client';

export const schoolsAPI = {
  // School Info
  getSchoolInfo: () => apiClient.get('/schools/school-info/active/'),
  
  // About
  getAbout: () => apiClient.get('/schools/about/active/'),
  
  // Academics
  getAcademics: () => apiClient.get('/schools/academics/'),
  
  // Staff
  getStaff: () => apiClient.get('/schools/staff/'),
  getLeadership: () => apiClient.get('/schools/staff/leadership/'),
  
  // Gallery
  getGallery: (params) => apiClient.get('/schools/gallery/', { params }),
  
  // School Life
  getSchoolLifeCategories: () => apiClient.get('/schools/school-life-categories/'),
  
  // News
  getNews: () => apiClient.get('/schools/news/'),
  getFeaturedNews: () => apiClient.get('/schools/news/featured/'),
  
  // Events
  getEvents: () => apiClient.get('/schools/events/'),
  getUpcomingEvents: () => apiClient.get('/schools/events/upcoming/'),
  
  // Contact
  sendContactMessage: (data) => apiClient.post('/schools/contact/', data),
};