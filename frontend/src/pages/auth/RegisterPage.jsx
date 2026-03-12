import { AtSign, KeyRound, MoveLeft } from "lucide-react";
import { useState } from "react";

export default function RegisterPage() {
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    return <div className="bg-dark text-white h-screen w-screen flex flex-col justify-center items-center">
        <div className="custom-bg fixed h-screen w-screen -z-1" />
        <div className="bg-deeper border-1 border-white/5 p-8 rounded-lg flex flex-col gap-6 w-sm shadow-md shadow-primary/5">
            <h1 className="text-lg font-bold">Formulaire d'inscription :</h1>
            {error && <div className="bg-red-500/10 border-1 border-red-500/30 text-red-500 rounded py-2 px-3">
                {error}
            </div>}
            {success && <div className="bg-green-500/10 border-1 border-green-500/30 text-green-500 rounded py-2 px-3">
                {success}
            </div>}
            <div className="flex flex-col gap-2">
                <div className="flex flex-col text-gray-400">
                    <div>Email</div>
                    <div className="border-1 border-gray-500 bg-gray-500/10 rounded-lg p-2 px-2 text-white/60 flex focus-within:border-primary">
                        <AtSign />
                        <input className="focus:outline-none ml-2 w-full" type="email" />
                    </div>
                </div>
                <div className="flex flex-col text-gray-400">
                    <div>Mot de passe</div>
                    <div className="border-1 border-gray-500 bg-gray-500/10 rounded-lg p-2 px-2 text-white/60 flex focus-within:border-primary">
                        <KeyRound />
                        <input className="focus:outline-none ml-2 w-full" type="password" />
                    </div>
                </div>
                <div className="flex flex-col text-gray-400">
                    <div>Confirmer le mot de passe</div>
                    <div className="border-1 border-gray-500 bg-gray-500/10 rounded-lg p-2 px-2 text-white/60 flex focus-within:border-primary">
                        <KeyRound />
                        <input className="focus:outline-none ml-2 w-full" type="password" />
                    </div>
                </div>
            </div>
            <button className="bg-primary/80 hover:bg-primary border-1 border-white/20 transition rounded p-2 font-bold">Inscription</button>
        </div>
        <div className="w-sm flex p-2">
            <a href="/login" className="flex gap-1 text-gray-300">
                <MoveLeft />
                <div>J'ai déjà un compte</div>
            </a>
        </div>
    </div>;
}