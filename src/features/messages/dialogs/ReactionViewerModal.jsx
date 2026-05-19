import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import UserAvatar from "../../components/UserAvatar.jsx";

function groupByEmoji(reactions) {
    const map = new Map();
    for (const r of reactions || []) {
        if (!map.has(r.emoji)) map.set(r.emoji, []);
        map.get(r.emoji).push(r);
    }
    return map;
}

function ReactionViewerModal({ message, onClose }) {
    const grouped = useMemo(() => groupByEmoji(message.reactions), [message.reactions]);
    const emojis = Array.from(grouped.keys());
    const totalCount = (message.reactions || []).length;
    const [activeEmoji, setActiveEmoji] = useState(emojis[0] ?? null);

    if (emojis.length === 0) return null;

    const visible = activeEmoji === '__all__'
        ? (message.reactions || [])
        : (grouped.get(activeEmoji) ?? []);

    // De-duplicate "Alle"-Tab so a user who reacted with multiple emojis only
    // shows up once. Keeps the user's first reaction's emoji for the row icon.
    const rows = activeEmoji === '__all__'
        ? Array.from(
            visible.reduce((acc, r) => {
                if (!acc.has(r.userId)) acc.set(r.userId, r);
                return acc;
            }, new Map()).values()
        )
        : visible;

    return createPortal((
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-background border border-border rounded-xl shadow-2xl w-[26rem] max-h-[70vh] flex flex-col overflow-hidden z-[301]">
                <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Reaktionen</h3>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="flex gap-1 px-3 pt-3 pb-2 border-b border-border overflow-x-auto">
                    <button
                        onClick={() => setActiveEmoji('__all__')}
                        className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                            activeEmoji === '__all__'
                                ? 'bg-muted text-foreground'
                                : 'text-muted-foreground hover:bg-muted/40'
                        }`}
                    >
                        Alle <span className="text-xs opacity-70">{totalCount}</span>
                    </button>
                    {emojis.map(e => (
                        <button
                            key={e}
                            onClick={() => setActiveEmoji(e)}
                            className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                                activeEmoji === e
                                    ? 'bg-muted text-foreground'
                                    : 'text-muted-foreground hover:bg-muted/40'
                            }`}
                        >
                            <span className="text-base leading-none">{e}</span>
                            <span className="text-xs opacity-70">{grouped.get(e).length}</span>
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2">
                    {rows.map(r => {
                        const u = r.user ?? {};
                        const name = u.displayName ?? u.username ?? r.userId;
                        return (
                            <div
                                key={`${r.userId}-${r.emoji}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/40"
                            >
                                <UserAvatar
                                    size="w-8 h-8"
                                    displayOnline={false}
                                    avatar={u.avatar}
                                    icon={(u.username ?? '?').charAt(0).toUpperCase()}
                                />
                                <span className="flex-1 text-sm text-foreground truncate">{name}</span>
                                <span className="text-lg leading-none">{r.emoji}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    ), document.body);
}

export default ReactionViewerModal;
