import { MoveLeft } from "lucide-react";
import { useRouteError } from "react-router-dom"

export default function ErrorPage() {

    const error = useRouteError()
    return <div className="bg-dark text-white h-screen w-screen flex flex-col justify-center items-center">
        <div className="custom-bg fixed h-screen w-screen -z-1" />
        <div className="w-sm flex p-2">
            <a href="/" className="flex gap-1 text-gray-300">
                <MoveLeft />
                <div>Retour</div>
            </a>
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