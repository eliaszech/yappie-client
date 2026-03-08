import {Link} from "react-router-dom";

function Login() {
    return (
        <>
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px]"></div>
            <div className="w-full max-w-md mx-4 animate-slide-up">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-extrabold text-foreground mb-2">Willkommen zurück</h1>
                    <p className="text-muted-foreground">Melde dich an, um fortzufahren</p>
                </div>
                <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border p-8 glow-primary">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-foreground">E-Mail</label>
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                 fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                 stroke-linejoin="round"
                                 className="lucide lucide-mail absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground">
                                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                            </svg>
                            <input type="email" placeholder="name@example.com"
                                   className="w-full h-11 pl-10 pr-4 rounded-xl bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                                   value="" data-keeper-lock-id="k-jma9m7s7fbb"/>
                        </div>
                    </div>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-6">
                    Noch kein Konto?
                    <Link className="text-primary font-medium hover:text-primary/80 transition-colors"
                          to="/register">Registrieren</Link>
                </p>
            </div>
        </>
    )
}

export default Login;