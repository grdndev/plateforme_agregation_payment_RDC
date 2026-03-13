import { MoveLeft } from "lucide-react";
import { Link, useRouteError } from "react-router-dom"

export default function Error() {
    const error = useRouteError()
    console.error(error);

    return <div className="bg-dark text-white h-screen w-screen flex flex-col justify-center items-center">
        <div className="custom-bg fixed h-screen w-screen -z-1" />
        <div className="w-sm flex p-2">
            <Link to={-1} className="flex gap-1 text-gray-300">
                <MoveLeft />
                <div>Retour</div>
            </Link>
        </div>
        <div className="bg-deeper border-1 border-white/5 p-8 rounded-lg flex flex-col gap-6 w-sm shadow-md shadow-primary/5">
            <h1 className="text-lg">Une erreur s'est produite. Veuillez réessayer plus tard.</h1>
            <div className="text-red-500">
              {error.status ? `Erreur ${error.status} - `: ''}
              {error.statusText ?? ''}
            </div>
        </div>
    </div>;
}