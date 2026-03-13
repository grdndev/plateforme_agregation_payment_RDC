import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import Loading from "../layout/Loading";
import Unauthorized from "../layout/Unauthorized";

export default function ProtectionProvider({ roles = [] }) {
    const auth = useAuth();
    const navigate = useNavigate();
    const [allowed, setAllowed] = useState(false)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth?.user) {
            navigate("/login");
        } else if (roles.length && (!auth?.user?.role || !roles.includes(auth.user.role))) {
            setAllowed(false);
        } else {
            setAllowed(true);
        }

        setLoading(false);
    }, []);

    if (loading) {
        return <Loading />;
    }

    if (!allowed) {
        return <Unauthorized />;
    }

    return <Outlet />;
}