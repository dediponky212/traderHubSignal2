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

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );

}

export const useAuth = () =>
    useContext(AuthContext);