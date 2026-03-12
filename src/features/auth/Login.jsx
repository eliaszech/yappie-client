import {Link, useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faEnvelope, faLock, faArrowRight} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {faEye} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {useState} from "react";
import Input from "../components/static/Input.jsx";
import {useAuth} from "../../hooks/useAuth.js";

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Bitte E-Mail und Passwort eingeben');
            return;
        }

        try {
            setIsLoading(true);

            const res = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setIsLoading(false);
                setError(data.error || 'Login fehlgeschlagen');
                return;
            }

            login(data.token, data.user);
            navigate('/@me');
        } catch {
            setIsLoading(false);
            setError('Server nicht erreichbar');
        }
    }

    return (
        <>
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-lg bg-primary/10 blur-[120px]"></div>
            <div className="w-full max-w-md mx-4 animate-slide-up">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-foreground mb-2">Willkommen zurück</h1>
                    <p className="text-muted-foreground">Melde dich an, um fortzufahren</p>
                </div>
                <form onSubmit={handleLogin} className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border p-8 glow-primary flex flex-col gap-5">
                    {error && <p className="text-dnd text-sm">{error}</p>}

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground">E-Mail</label>
                        <div className="relative">
                            <FontAwesomeIcon icon={faEnvelope}
                                             className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                            <Input type="email" placeholder="example@example.com" value={email} setValue={setEmail} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between"><label
                            className="text-sm font-medium text-foreground">Passwort</label>
                            <button type="button"
                                    className="text-xs text-primary hover:text-primary/80 transition-colors">
                                Passwort vergessen?
                            </button>
                        </div>
                        <div className="relative">
                            <FontAwesomeIcon icon={faLock}
                                             className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                            <Input type="password" placeholder="******" value={password} setValue={setPassword} />
                            <button type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                <FontAwesomeIcon icon={faEye}/>
                            </button>
                        </div>
                    </div>
                    <button type="submit" disabled={isLoading}
                            className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity glow-primary">
                        Anmelden <FontAwesomeIcon icon={faArrowRight}/>
                    </button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Noch kein Konto?
                    <Link className="text-primary ml-1 font-medium hover:text-primary/80 transition-colors"
                          to="/register">Registrieren</Link>
                </p>
            </div>
        </>
    )
}

export default Login;