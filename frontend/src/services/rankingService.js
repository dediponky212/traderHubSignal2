import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

const authConfig = () => ({
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
});

export const getRanking = () => axios.get(`${API_URL}/api/ranking`, authConfig());
