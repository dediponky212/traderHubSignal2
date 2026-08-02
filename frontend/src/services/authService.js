import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:3000/api/auth",
});

export const login = (data) =>
    API.post("/login", data);

export const register = (data) =>
    API.post("/register", data);

export const me = (token) =>
    API.get("/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });