import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

const authConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export const getEAStatus = () => axios.get(`${API_URL}/api/ea/status`, authConfig());
export const createEACommand = (data) => axios.post(`${API_URL}/api/ea/command`, data, authConfig());
export const getLastEACommand = () => axios.get(`${API_URL}/api/ea/command/last`, authConfig());
export const getEAPositions = () => axios.get(`${API_URL}/api/ea/positions`, authConfig());
export const getTodayTradeHistory = () => axios.get(`${API_URL}/api/ea/history/today`, authConfig());
// Combines status + positions + today's history in one request - used by the
// dashboard's polling loop instead of firing the three calls above separately.
export const getEADashboard = () => axios.get(`${API_URL}/api/ea/dashboard`, authConfig());