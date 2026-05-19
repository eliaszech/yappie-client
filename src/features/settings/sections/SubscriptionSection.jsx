import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faSparkles, faCrown, faPalette, faImage, faVolumeHigh, faBolt } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useQuery } from "@tanstack/react-query";
import { fetchSubscription } from "../../../services/api.js";

// Feature list shown on the Yappie Plus card. Edit here as the perk set
// firms up — until billing is wired we just keep it forward-looking.
const PLUS_PERKS = [
    { icon: faImage,      label: 'Animiertes Profilbild & -banner' },
    { icon: faPalette,    label: 'Profil-Themes mit eigenen Akzentfarben' },
    { icon: faVolumeHigh, label: 'Höhere Audio-Bitrate in Sprachkanälen' },
    { icon: faBolt,       label: 'Größere Datei-Uploads' },
    { icon: faSparkles,   label: 'Plus-Badge neben deinem Namen' },
];

function FreePlanCard({ isCurrent }) {
    return (
        <div className="bg-card rounded-xl border border-border p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Aktueller Plan
                    </span>
                    <span className="text-xl font-bold text-foreground">Yappie Free</span>
                </div>
                {isCurrent && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-primary/15 text-primary">
                        Aktiv
                    </span>
                )}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
                Alle Kernfunktionen von Yappie — Server, Sprachkanäle, Direktnachrichten und mehr — bleiben kostenlos.
            </p>
        </div>
    );
}

function PlusPlanCard({ isCurrent }) {
    return (
        <div className="relative bg-gradient-to-br from-primary/15 via-card to-card rounded-xl border border-primary/40 p-6 flex flex-col gap-4 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faCrown} className="text-primary" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Premium-Plan
                        </span>
                    </div>
                    <span className="text-xl font-bold text-foreground">Yappie Plus</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full bg-muted/60 text-muted-foreground">
                    Bald verfügbar
                </span>
            </div>

            <ul className="flex flex-col gap-2 relative">
                {PLUS_PERKS.map(perk => (
                    <li key={perk.label} className="flex items-center gap-2.5 text-sm text-foreground/90">
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                        </span>
                        <FontAwesomeIcon icon={perk.icon} className="text-muted-foreground text-xs" />
                        <span>{perk.label}</span>
                    </li>
                ))}
            </ul>

            <button
                type="button"
                disabled
                className="mt-2 px-4 py-2 rounded-lg bg-primary/70 text-primary-foreground text-sm font-semibold opacity-60 cursor-not-allowed relative"
                title="Yappie Plus kommt bald"
            >
                Demnächst freischaltbar
            </button>
        </div>
    );
}

export default function SubscriptionSection() {
    const { data: subscription } = useQuery({
        queryKey: ['subscription'],
        queryFn: fetchSubscription,
        staleTime: 5 * 60 * 1000,
    });

    const currentPlan = subscription?.plan ?? 'free';

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Abo</h1>
            </div>

            <div className="relative max-w-[70%] py-4 px-4 w-full mx-auto flex flex-col gap-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Yappie ist kostenlos nutzbar. Mit <span className="text-foreground font-medium">Yappie Plus</span>{' '}
                    schalten wir bald zusätzliche Profil- und Komfort-Features frei.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FreePlanCard isCurrent={currentPlan === 'free'} />
                    <PlusPlanCard isCurrent={currentPlan === 'plus'} />
                </div>
            </div>
        </div>
    );
}
