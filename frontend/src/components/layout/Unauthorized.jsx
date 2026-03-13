import { MoveLeft } from "lucide-react";
import { Link, useRouteError } from "react-router-dom"

export default function Unauthorized() {
    const error = useRouteError()

    return <div className="text-white flex flex-col justify-center items-center">
        <div className="custom-bg fixed h-screen w-screen -z-1" />
        <div className="w-sm flex p-2">
            <Link to={-1} className="flex gap-1 text-gray-300">
                <MoveLeft />
                <div>Retour</div>
            </Link>
        </div>
        <div className="bg-deeper border-1 border-white/5 p-8 rounded-lg flex flex-col gap-6 w-sm shadow-md shadow-primary/5">
            <h1 className="text-lg">Accès restreint.</h1>
            <div>Vous n'avez pas les autorisations nécessaires.</div>
        </div>
    </div>;
}