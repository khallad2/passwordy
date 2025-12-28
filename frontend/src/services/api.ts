import axios from 'axios';

const api = axios.create({
    baseURL: '/api/v1',
    withCredentials: true,
});

// Response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Could redirect to login here if not already there
        }
        return Promise.reject(error);
    }
);

export default api;
