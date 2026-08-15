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