import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

const authConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export const listRobots = () => axios.get(`${API_URL}/api/robots`, authConfig());
export const getRobot = (id) => axios.get(`${API_URL}/api/robots/${id}`, authConfig());
export const createRobot = (data) => axios.post(`${API_URL}/api/robots`, data, authConfig());
export const updateRobot = (id, data) => axios.patch(`${API_URL}/api/robots/${id}`, data, authConfig());
export const deleteRobot = (id) => axios.delete(`${API_URL}/api/robots/${id}`, authConfig());
