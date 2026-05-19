import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faBan, faCheck } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBans, unbanUser } from "../../../../services/api.js";
import UserAvatar from "../../../components/UserAvatar.jsx";
import Spinner from "../../../components/static/Spinner.jsx";
import ErrorMessage from "../../../components/static/ErrorMessage.jsx";

function BanRow({ ban, onUnban }) {
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);

    const u = ban.user ?? {};
    const banner = ban.banner;
    const name = u.displayName ?? u.username ?? ban.userId;

    async function handleUnban() {
        setBusy(true);
        await onUnban(ban);
        // row unmounts on success
    }

    return (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
            <UserAvatar
                size="w-9 h-9 text-sm"
                displayOnline={false}
                avatar={u.avatar}
                icon={(u.username ?? '?').charAt(0).toUpperCase()}
            />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{name}</div>
                {ban.reason ? (
                    <div className="text-xs text-muted-foreground truncate" title={ban.reason}>
                        Grund: {ban.reason}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground/70 italic">Kein Grund angegeben</div>
                )}
                <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {banner ? `von ${banner.displayName ?? banner.username} · ` : ''}
                    {new Date(ban.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
            </div>
            {confirming ? (
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-muted-foreground">Entsperren?</span>
                    <button
                        onClick={() => setConfirming(false)}
                        disabled={busy}
                        className="text-xs px-2 py-1 rounded-md bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                    >
                        Nein
                    </button>
                    <button
                        onClick={handleUnban}
                        disabled={busy}
                        className="text-xs px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer flex items-center gap-1 disabled:opacity-50 transition-colors"
                    >
                        {busy ? <FontAwesomeIcon icon={faSpinner} spin className="text-[10px]" /> : <FontAwesomeIcon icon={faCheck} className="text-[10px]" />}
                        Ja
                    </button>
                </div>
            ) : (
                <button
                    onClick={() => setConfirming(true)}
                    className="text-xs font-medium shrink-0 px-3 py-1.5 rounded-md bg-muted/60 text-foreground hover:bg-muted cursor-pointer transition-colors"
                >
                    Entsperren
                </button>
            )}
        </div>
    );
}

export default function BansSection({ server }) {
    const queryClient = useQueryClient();
    const { data: bans = [], isLoading, isError } = useQuery({
        queryKey: ['bans', server.id],
        queryFn: () => fetchBans(server.id),
        staleTime: 60 * 1000,
    });

    async function handleUnban(ban) {
        const res = await unbanUser(server.id, ban.userId);
        if (!res?.error) {
            queryClient.setQueryData(['bans', server.id], (old) =>
                Array.isArray(old) ? old.filter(b => b.userId !== ban.userId) : old
            );
        }
    }

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Sperren</h1>
            </div>

            <div className="max-w-3xl mx-auto w-full py-4 px-4 flex flex-col gap-4 flex-1 min-h-0">
                <p className="text-sm text-muted-foreground">
                    Mitglieder, die gesperrt sind und dem Server nicht mehr beitreten können.
                </p>

                <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 min-h-0 h-max">
                    {isLoading && (
                        <div className="p-6 flex justify-center"><Spinner size="w-6 h-6" /></div>
                    )}
                    {isError && (
                        <div className="p-6">
                            <ErrorMessage
                                title="Sperren laden"
                                message="Die Sperrliste konnte nicht geladen werden."
                                icon={<FontAwesomeIcon icon={faBan} />}
                            />
                        </div>
                    )}
                    {!isLoading && !isError && bans.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                            <FontAwesomeIcon icon={faBan} className="text-3xl opacity-40" />
                            <span className="text-sm">Aktuell ist niemand gesperrt.</span>
                        </div>
                    )}
                    {!isLoading && !isError && bans.length > 0 && (
                        <div className="divide-y divide-border overflow-y-auto h-full">
                            {bans.map(ban => (
                                <BanRow key={ban.id ?? ban.userId} ban={ban} onUnban={handleUnban} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
