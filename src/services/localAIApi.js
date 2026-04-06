// import apiClient from './apiClient';

// const API_URL = '/LocalAI';

// export const localAIApi = {
//   // Send command to Local AI
//   sendCommand: async (command) => {
//     try {
//       const response = await apiClient.post(`${API_URL}/command`, { command });
//       return response.data;
//     } catch (error) {
//       console.error('AI Command Error:', error);
//       throw error;
//     }
//   },

//   // Get AI capabilities
//   getCapabilities: async () => {
//     try {
//       const response = await apiClient.get(`${API_URL}/capabilities`);
//       return response.data;
//     } catch (error) {
//       console.error('Get Capabilities Error:', error);
//       throw error;
//     }
//   },

//   // Health check
//   healthCheck: async () => {
//     try {
//       const response = await apiClient.get(`${API_URL}/health`);
//       return response.data;
//     } catch (error) {
//       console.error('Health Check Error:', error);
//       throw error;
//     }
//   }
// };


import apiClient from './apiClient';

const API_URL = '/LocalAI';

export const localAIApi = {
  // Send command to Local AI
  sendCommand: async (command) => {
    try {
      const response = await apiClient.post(`${API_URL}/command`, { command });
      return response.data;
    } catch (error) {
      console.error('AI Command Error:', error);
      throw error;
    }
  },

  // Get AI capabilities
  getCapabilities: async () => {
    try {
      const response = await apiClient.get(`${API_URL}/capabilities`);
      return response.data;
    } catch (error) {
      console.error('Get Capabilities Error:', error);
      throw error;
    }
  },

  // Health check
  healthCheck: async () => {
    try {
      const response = await apiClient.get(`${API_URL}/health`);
      return response.data;
    } catch (error) {
      console.error('Health Check Error:', error);
      throw error;
    }
  }
};