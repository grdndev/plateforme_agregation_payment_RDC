import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { USER_ROLES } from "../utils/enums";
import Loading from "./layout/Loading";
import { useEffect } from "react";

export default function Redirect() {
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        switch (user.role) {
            case USER_ROLES.ADMIN:
            case USER_ROLES.SADMIN:
                navigate('/admin', { replace: true });
                break;
            case USER_ROLES.OWNER:
            case USER_ROLES.COLLABORATOR:
                navigate('/merchant', { replace: true });
                break;
        }
    }, [])

    return <Loading />
}