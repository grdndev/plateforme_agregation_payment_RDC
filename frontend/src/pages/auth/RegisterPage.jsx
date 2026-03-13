import { AtSign, CheckCircle, Eye, EyeOff, KeyRound, MoveLeft } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterPage() {
    const { register } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL;

    function validate() {
        if (!formData?.email || !formData?.password || !formData?.confirm) {
            throw new Error("Veuillez remplir tous les champs");
        }

        if (formData.password !== formData.confirm) {
            throw new Error("Les mots de passe ne correspondent pas");
        }
    }

    function handleFormData(type, value) {
        const newFormData = {...formData};
        newFormData[type] = value ?? undefined;
        setFormData(newFormData);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            validate();

            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {'content-type': 'application/json'},
                body: JSON.stringify(formData)
            });

            const json = await response.json();
            if (!json.success) {
                throw new Error(json.errors?.map(e => e.message).join(', ') ?? json.message ?? "Erreur serveur");
            }

            setSuccess("Inscription validée ! Vous allez être redirigé...");
            setTimeout(() => register(json.data.user, json.data.tokens), 3000);
        } catch (error) {
            setError(error.message ?? "Une erreur s'est produite, veuillez réessayer plus tard");
        } finally {
            setLoading(false);
        }
    }

    return <div className="bg-dark text-white h-screen w-screen flex flex-col justify-center items-center">
        <div className="custom-bg fixed h-screen w-screen -z-1" />
        <form className="bg-deeper border-1 border-white/5 p-8 rounded-lg flex flex-col gap-6 w-sm shadow-md shadow-primary/5" onSubmit={handleFormSubmit}>
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
                        <input className={`focus:outline-none ml-2 w-full${loading ? " animate-pulse opacity-10" : ""}`} disabled={loading} type="email" onChange={(e) => handleFormData('email', e.target.value)} />
                    </div>
                </div>
                <div className="flex flex-col text-gray-400">
                    <div>Mot de passe</div>
                    <div className="relative border-1 border-gray-500 bg-gray-500/10 rounded-lg p-2 px-2 text-white/60 flex focus-within:border-primary">
                        <KeyRound />
                        <input className={`focus:outline-none ml-2 w-full${loading ? " animate-pulse opacity-10" : ""}`} disabled={loading} type={showPassword ? 'text' : 'password'} onChange={(e) => handleFormData('password', e.target.value)} />
                        <button onClick={() => setShowPassword(!showPassword)}>{showPassword ? <Eye /> : <EyeOff />}</button>
                    </div>
                </div>
                <div className="flex flex-col text-gray-400">
                    <div>Confirmer le mot de passe</div>
                    <div className="relative border-1 border-gray-500 bg-gray-500/10 rounded-lg p-2 px-2 text-white/60 flex focus-within:border-primary">
                        <CheckCircle />
                        <input className={`focus:outline-none ml-2 w-full${loading ? " animate-pulse opacity-10" : ""}`} disabled={loading} type={showPasswordConfirm ? 'text' : 'password'} onChange={(e) => handleFormData('confirm', e.target.value)} />
                        <button onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}>{showPasswordConfirm ? <Eye /> : <EyeOff />}</button>
                    </div>
                </div>
            </div>
            <button className="bg-primary/80 hover:bg-primary border-1 border-white/20 transition rounded p-2 font-bold" type="submit">
                { loading ? "Inscription..." : "Inscription" }
            </button>
        </form>
        <div className="w-sm flex p-2">
            <a href="/login" className="flex gap-1 text-gray-300">
                <MoveLeft />
                <div>J'ai déjà un compte</div>
            </a>
        </div>
    </div>;
}