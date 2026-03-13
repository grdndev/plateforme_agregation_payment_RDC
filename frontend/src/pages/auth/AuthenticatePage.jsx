import { AtSign, Eye, EyeOff, KeyRound, MoveRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function AuthenticatePage() {
    const {login} = useAuth();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    function handleFormData(type, value) {
        const newFormData = {...formData};
        newFormData[type] = value ?? undefined;
        setFormData(newFormData);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await login(formData);
        } catch (error) {
            setError(error.message ?? "Une erreur s'est produite, veuillez réessayer plus tard");
        } finally {
            setLoading(false);
        }
    }

    return <div className="bg-dark text-white h-screen w-screen flex flex-col justify-center items-center">
        <div className="custom-bg fixed h-screen w-screen -z-1" />
        <form className="bg-deeper border-1 border-white/5 p-8 rounded-lg flex flex-col gap-6 w-sm shadow-md shadow-primary/5" onSubmit={handleFormSubmit}>
            <h1 className="text-lg font-bold">Veuillez vous authentifier :</h1>
            {error && <div className="bg-red-500/10 border-1 border-red-500/30 text-red-500 rounded py-2 px-3">
                {error}
            </div>}
            <div className="flex flex-col gap-2">
                <div className="flex flex-col text-gray-400">
                    <div>Email</div>
                    <div className="border-1 border-gray-500 bg-gray-500/10 rounded-lg p-2 px-2 text-white/60 flex focus-within:border-primary">
                        <AtSign />
                        <input className={`focus:outline-none ml-2 w-full${loading ? " animate-pulse opacity-10" : ""}`} disabled={loading} type="email" onChange={(e) => handleFormData('email', e.target.value)} />
                    </div>
                </div>
                <div className="flex flex-col text-gray-400">
                    <div>Mot de passe</div>
                    <div className="border-1 border-gray-500 bg-gray-500/10 rounded-lg p-2 px-2 text-white/60 flex focus-within:border-primary">
                        <KeyRound />
                        <input className={`focus:outline-none ml-2 w-full${loading ? " animate-pulse opacity-10" : ""}`} disabled={loading} type="password" onChange={(e) => handleFormData('password', e.target.value)} />
                        <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <Eye /> : <EyeOff />}</button>
                    </div>
                </div>
            </div>
            <button className="bg-primary/80 hover:bg-primary border-1 border-white/20 transition rounded p-2 font-bold" type="submit">
                {loading ? "Connexion..." : "Connexion"}
            </button>
        </form>
        <div className="w-sm flex p-2">
            <a href="/register" className="ml-auto flex gap-1 text-gray-300">
                <div>Je n'ai pas de compte</div>
                <MoveRight />
            </a>
        </div>
    </div>;
}