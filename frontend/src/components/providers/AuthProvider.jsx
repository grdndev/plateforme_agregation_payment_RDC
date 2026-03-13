import { useState } from "react";
import { AuthContext } from "../../hooks/useAuth";
import { Outlet, useNavigate } from "react-router-dom";

export default function AuthProvider() {
    const auth = provideAuth();

    return <AuthContext.Provider value={auth}>
        <Outlet />
    </AuthContext.Provider>;
}

function dataToLocalStorage(key, data, setter) {
    localStorage.setItem(key, JSON.stringify(data));
    setter(data);
}

function dataFromLocalStorage(key) {
    const json = localStorage.getItem(key);
    if (!json) {
        return null;
    }

    const data = JSON.parse(json);
    return data;
}

function provideAuth() {
    const navigate = useNavigate();
    const [user, setUser] = useState(dataFromLocalStorage("user"));
    const [tokens, setTokens] = useState(dataFromLocalStorage("tokens"));
    const API_URL = import.meta.env.VITE_API_URL;

    function register(user, tokens) {
        if (!user || !tokens) {
            throw new Error("Erreur d'inscription");
        }

        dataToLocalStorage("user", user, setUser);
        dataToLocalStorage("tokens", tokens, setTokens);
        navigate("/");
    }

    async function login(formData) {
        if (!formData?.email || !formData?.password) {
            throw new Error("Email et mot de passe requis");
        }

        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify(formData)
        });

        const json = await response.json();

        if (!json.success) {
            throw new Error(json.message ?? "Erreur serveur");
        } else {
            dataToLocalStorage("user", json.data.user, setUser);
            dataToLocalStorage("tokens", json.data.tokens, setTokens);
            navigate("/");
        }
    }

    function logout() {
        dataToLocalStorage("user", null, setUser)
        dataToLocalStorage("tokens", null, setTokens)
        navigate("/login");
    }

    return {
        register,
        login,
        logout,
        user,
        tokens
    };
}