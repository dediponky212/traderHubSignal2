import { createContext, useContext, useEffect, useState } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            return;
        }
        authService.me(token)
            .then((res) => {
                setUser(res.data);
            })
            .catch(() => {
                localStorage.removeItem("token");
            })
            .finally(() => {
                setLoading(false);
            });

    }, []);

    const login = async (email, password) => {
        const res = await authService.login({
            email,
            password,
        });
        localStorage.setItem(
            "token",
            res.data.token
        );
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    // Lets pages that update the profile (PATCH /api/auth/profile) push the
    // fresh user object straight into context, instead of the rest of the
    // app showing stale name/avatar/etc. until the next full reload.
    const updateUser = (updatedUser) => {
        setUser((prev) => ({ ...prev, ...updatedUser }));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                updateUser,
            }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () =>
    useContext(AuthContext);