import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";
import Loading from "../layout/Loading";

export default function ProtectionProvider() {
    const navigate = useNavigate();
    const auth = useAuth();

    useEffect(() => {
        if (!auth?.user) {
            navigate("/login");
        }
    }, []);

    if (!auth?.user) {
        return <Loading />;
    }

    return <Outlet />;
}