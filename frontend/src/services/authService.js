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

export const updateProfile = (data) =>
    API.patch("/profile", data, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

export const uploadAvatar = (formData) =>
    API.patch("/avatar", formData, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "multipart/form-data",
        },
    });

export const requestPasswordChange = (data) =>
    API.post("/password/request", data, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

export const confirmPasswordChange = (data) =>
    API.post("/password/confirm", data, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

export const requestEmailVerification = () =>
    API.post("/verify-email/request", {}, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });

export const confirmEmailVerification = (data) =>
    API.post("/verify-email/confirm", data, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });