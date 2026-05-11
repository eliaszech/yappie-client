import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser, faLock, faPalette, faBell, faXmark,
} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { faSignOut } from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import { useSettings } from "../../context/SettingsContext.jsx";
import { useAuth } from "../../hooks/useAuth.js";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ProfileSection from "./sections/ProfileSection.jsx";
import AccountSection from "./sections/AccountSection.jsx";
import AppearanceSection from "./sections/AppearanceSection.jsx";

const NAV = [
    {
        category: 'NUTZER',
        items: [
            { id: 'profile', label: 'Mein Profil', icon: faUser },
            { id: 'account', label: 'Konto', icon: faLock },
        ],
    },
    {
        category: 'APP-EINSTELLUNGEN',
        items: [
            { id: 'appearance', label: 'Erscheinungsbild', icon: faPalette },
            { id: 'notifications', label: 'Benachrichtigungen', icon: faBell },
        ],
    },
];

function PlaceholderSection({ title }) {
    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">{title}</h1>
            </div>
            <div className="relative max-w-[60%] py-4 px-4 w-full h-full mx-auto flex flex-col gap-6">
                <div className="bg-card rounded-xl border border-border p-8 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Dieser Bereich ist noch in Entwicklung.</p>
                </div>
            </div>

        </div>
    );
}

function SectionContent({ section }) {
    switch (section) {
        case 'profile': return <ProfileSection />;
        case 'account': return <AccountSection />;
        case 'appearance': return <AppearanceSection />;
        case 'notifications': return <PlaceholderSection title="Benachrichtigungen" />;
        default: return <ProfileSection />;
    }
}

function SettingsModal() {
    const { open, closeSettings, section, setSection } = useSettings();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!open) return;
        const handle = (e) => { if (e.key === 'Escape') closeSettings(); };
        document.addEventListener('keydown', handle);
        return () => document.removeEventListener('keydown', handle);
    }, [open, closeSettings]);

    if (!open) return null;

    function handleLogout() {
        closeSettings();
        logout();
        queryClient.clear();
        navigate('/login');
    }

    return (
        <>

            <div className="fixed w-full h-full top-0 left-0 flex items-center justify-center z-[200]">
                <div onClick={closeSettings} className="absolute w-full h-full cursor-pointer inset-0 bg-black opacity-60 z-[201]" />
                <div className="rounded-lg w-full max-w-[80%] z-[202] h-full max-h-[85%] flex bg-background overflow-hidden">
                    {/* ── Sidebar ── */}
                    <div className="w-[300px] flex-shrink-0 bg-guild-bar overflow-y-auto flex flex-col">
                        <nav className="flex flex-col flex-1 py-4 px-4 gap-1">
                            {NAV.map((group, gi) => (
                                <div key={gi} className={gi > 0 ? 'mt-4' : '' + 'flex flex-col gap-1'}>
                                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 mb-0.5">
                                        {group.category}
                                    </div>
                                    {group.items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => setSection(item.id)}
                                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md font-medium transition-colors cursor-pointer ${
                                                section === item.id
                                                    ? 'bg-muted text-foreground'
                                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                            }`}
                                        >
                                            <FontAwesomeIcon icon={item.icon} className="w-3.5 shrink-0" />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            ))}

                            <div className="mt-4 border-t border-border pt-2">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md font-medium text-dnd hover:bg-dnd/10 transition-colors cursor-pointer"
                                >
                                    <FontAwesomeIcon icon={faSignOut} className="w-3.5 shrink-0" />
                                    Abmelden
                                </button>
                            </div>
                        </nav>
                    </div>

                    {/* ── Content ── */}
                    <div className="flex flex-1">
                        {/* Scrollable content area */}
                        <SectionContent section={section} />

                        {/* Close button column */}
                        <div className="w-20 flex-shrink-0 flex flex-col items-center pt-4 px-4">
                            <button
                                onClick={closeSettings}
                                className="flex flex-col items-center gap-1.5 group cursor-pointer"
                            >
                                <div className="w-9 h-9 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center group-hover:border-foreground transition-colors">
                                    <FontAwesomeIcon icon={faXmark} className="text-muted-foreground group-hover:text-foreground transition-colors text-lg" />
                                </div>
                                <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors tracking-wider">ESC</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SettingsModal;
