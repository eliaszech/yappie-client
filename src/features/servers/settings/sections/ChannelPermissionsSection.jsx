import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faMinus, faPlus, faSpinner, faXmark } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchRoles, fetchChannelOverwrites, setChannelOverwrite, deleteChannelOverwrite,
} from "../../../../services/api.js";
import { PERMISSIONS, canActOnRole } from "../../../../services/permissions.js";

// Permission rows shown in the overwrite editor. Channel-level only — server-
// only flags (KICK_MEMBERS, MANAGE_SERVER, …) don't belong here.
// Common rows are shown for every channel type; text rows only for text;
// voice rows only for voice (Discord-style split — message permissions on a
// voice channel are meaningless).
const COMMON_TOP_ROWS = [
    { bit: PERMISSIONS.VIEW_CHANNEL,    label: 'Kanal sehen',           desc: 'Diesen Kanal in der Liste anzeigen und betreten.' },
];
const TEXT_ROWS = [
    { bit: PERMISSIONS.SEND_MESSAGES,   label: 'Nachrichten senden',    desc: 'Nachrichten in diesem Kanal posten.' },
    { bit: PERMISSIONS.ATTACH_FILES,    label: 'Dateien anhängen',      desc: 'Bilder und Dateien hochladen.' },
    { bit: PERMISSIONS.ADD_REACTIONS,   label: 'Reaktionen hinzufügen', desc: 'Auf Nachrichten in diesem Kanal mit Emojis reagieren.' },
    { bit: PERMISSIONS.PIN_MESSAGES,    label: 'Nachrichten anpinnen',  desc: 'Nachrichten in diesem Kanal anpinnen.' },
    { bit: PERMISSIONS.MANAGE_MESSAGES, label: 'Nachrichten verwalten', desc: 'Nachrichten anderer Mitglieder löschen.' },
];
const VOICE_ROWS = [
    { bit: PERMISSIONS.CONNECT_VOICE,   label: 'Sprachkanal beitreten', desc: 'In diesem Sprachkanal verbinden.' },
];
const COMMON_BOTTOM_ROWS = [
    { bit: PERMISSIONS.MANAGE_CHANNELS, label: 'Kanal verwalten',       desc: 'Diesen Kanal bearbeiten oder Berechtigungen setzen.' },
];

function TriToggle({ state, onChange, disabled = false }) {
    // state: 'neutral' | 'allow' | 'deny'
    function pick(next) {
        if (disabled) return;
        onChange(state === next ? 'neutral' : next);
    }
    const baseDisabled = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
    const hoverDeny = disabled ? '' : 'hover:bg-dnd/30 hover:text-dnd';
    const hoverNeutral = disabled ? '' : 'hover:bg-muted hover:text-foreground';
    const hoverAllow = disabled ? '' : 'hover:bg-green-500/30 hover:text-green-400';
    return (
        <div className="flex items-center gap-1.5 shrink-0">
            <button
                onClick={() => pick('deny')}
                disabled={disabled}
                title="Verweigern"
                className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-colors ${baseDisabled} ${
                    state === 'deny'
                        ? 'bg-dnd text-white'
                        : `bg-muted/40 text-muted-foreground ${hoverDeny}`
                }`}
            >
                <FontAwesomeIcon icon={faXmark} />
            </button>
            <button
                onClick={() => pick('neutral')}
                disabled={disabled}
                title="Neutral (Servereinstellung)"
                className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-colors ${baseDisabled} ${
                    state === 'neutral'
                        ? 'bg-muted text-foreground'
                        : `bg-muted/40 text-muted-foreground ${hoverNeutral}`
                }`}
            >
                <FontAwesomeIcon icon={faMinus} />
            </button>
            <button
                onClick={() => pick('allow')}
                disabled={disabled}
                title="Erlauben"
                className={`w-7 h-7 flex items-center justify-center rounded-md text-sm transition-colors ${baseDisabled} ${
                    state === 'allow'
                        ? 'bg-green-500 text-white'
                        : `bg-muted/40 text-muted-foreground ${hoverAllow}`
                }`}
            >
                <FontAwesomeIcon icon={faCheck} />
            </button>
        </div>
    );
}

function SaveBar({ visible, onReset, onSave, saving }) {
    if (!visible) return null;
    return (
        <div className="absolute left-0 bottom-6 w-full z-10 flex justify-between items-center gap-4 bg-card border border-border rounded-xl px-5 py-3 shadow-2xl">
            <span className="text-sm text-muted-foreground">Du hast nicht gespeicherte Änderungen</span>
            <div className="flex items-center gap-4">
                <button onClick={onReset} className="text-sm text-foreground hover:underline cursor-pointer">
                    Zurücksetzen
                </button>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                >
                    {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Speichern'}
                </button>
            </div>
        </div>
    );
}

// Converts (allow, deny) masks into per-permission "neutral"|"allow"|"deny".
function masksToState(allow, deny, rows) {
    const state = {};
    for (const r of rows) {
        if ((allow & r.bit) !== 0) state[r.bit] = 'allow';
        else if ((deny & r.bit) !== 0) state[r.bit] = 'deny';
        else state[r.bit] = 'neutral';
    }
    return state;
}

function stateToMasks(state, rows) {
    let allow = 0, deny = 0;
    for (const r of rows) {
        if (state[r.bit] === 'allow') allow |= r.bit;
        else if (state[r.bit] === 'deny') deny |= r.bit;
    }
    return { allow, deny };
}

export default function ChannelPermissionsSection({ channel, server }) {
    const queryClient = useQueryClient();
    const isVoice = channel.type === 'voice';
    const rows = useMemo(() => isVoice
        ? [...COMMON_TOP_ROWS, ...VOICE_ROWS, ...COMMON_BOTTOM_ROWS]
        : [...COMMON_TOP_ROWS, ...TEXT_ROWS, ...COMMON_BOTTOM_ROWS],
    [isVoice]);

    const { data: roles = [] } = useQuery({
        queryKey: ['roles', server.id],
        queryFn: () => fetchRoles(server.id),
        staleTime: 5 * 60 * 1000,
    });
    const { data: overwrites = [], isLoading } = useQuery({
        queryKey: ['channelOverwrites', channel.id],
        queryFn: () => fetchChannelOverwrites(channel.id),
        staleTime: 60 * 1000,
    });

    const overwriteByRoleId = useMemo(() => {
        const m = new Map();
        for (const o of overwrites) m.set(o.roleId, o);
        return m;
    }, [overwrites]);

    const everyoneRole = roles.find(r => r.isEveryone);
    // Default-selected role: @everyone if present, else first role with an
    // overwrite, else first role.
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    useEffect(() => {
        if (selectedRoleId && roles.some(r => r.id === selectedRoleId)) return;
        const initial = everyoneRole?.id
            ?? overwrites[0]?.roleId
            ?? roles.find(r => !r.isOwnerRole)?.id
            ?? roles[0]?.id
            ?? null;
        setSelectedRoleId(initial);
    }, [roles, overwrites, everyoneRole, selectedRoleId]);

    // Local edit state (per-permission tristate). Resets when role changes.
    const [editState, setEditState] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const currentOverwrite = selectedRoleId ? overwriteByRoleId.get(selectedRoleId) : null;
    const serverState = useMemo(() => {
        return masksToState(currentOverwrite?.allow ?? 0, currentOverwrite?.deny ?? 0, rows);
    }, [currentOverwrite, rows]);

    useEffect(() => {
        setEditState(serverState);
        setError('');
    }, [selectedRoleId, serverState]);

    const hasChanges = useMemo(() => {
        return rows.some(r => editState[r.bit] !== serverState[r.bit]);
    }, [editState, serverState, rows]);

    function pickRole(roleId) {
        setSelectedRoleId(roleId);
    }

    async function handleSave() {
        if (!selectedRoleId) return;
        const { allow, deny } = stateToMasks(editState, rows);
        setSaving(true);
        setError('');

        try {
            if (allow === 0 && deny === 0) {
                // Empty overwrite → drop the row instead of keeping zeros.
                const res = await deleteChannelOverwrite(channel.id, selectedRoleId);
                if (res?.error) {
                    setError(res.error);
                } else {
                    queryClient.setQueryData(['channelOverwrites', channel.id], (old) =>
                        Array.isArray(old) ? old.filter(o => o.roleId !== selectedRoleId) : old
                    );
                }
            } else {
                const res = await setChannelOverwrite(channel.id, selectedRoleId, allow, deny);
                if (res?.error) {
                    setError(res.error);
                } else {
                    queryClient.setQueryData(['channelOverwrites', channel.id], (old) => {
                        if (!Array.isArray(old)) return [res];
                        const idx = old.findIndex(o => o.roleId === selectedRoleId);
                        if (idx === -1) return [...old, res];
                        const next = old.slice();
                        next[idx] = res;
                        return next;
                    });
                }
            }
            // Channel-list may have changed visibility — backend already
            // emits channel:overwrites which invalidates ['channels', serverId].
        } finally {
            setSaving(false);
        }
    }

    function handleReset() {
        setEditState(serverState);
        setError('');
    }

    const orderedRoles = useMemo(() => {
        // Owner role pinned-hidden; everything else stays visible. Whether
        // the caller can actually *edit* a given role is decided per-row via
        // canActOnRole (read-only view for roles above the caller).
        const filtered = roles.filter(r => !r.isOwnerRole);
        return filtered.sort((a, b) => {
            if (a.isEveryone) return 1;
            if (b.isEveryone) return -1;
            return (b.position ?? 0) - (a.position ?? 0);
        });
    }, [roles]);

    // True when the caller may modify overwrites for the currently selected
    // role. Backend enforces the same gate; UI mirrors it for clarity.
    const selectedRole = selectedRoleId ? roles.find(r => r.id === selectedRoleId) : null;
    const canEditSelected = selectedRole ? canActOnRole(server, selectedRole) : false;

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Berechtigungen</h1>
            </div>

            <div className="relative flex-1 min-h-0 flex gap-3 px-4 pb-6 overflow-hidden">
                {/* Role list */}
                <div className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto bg-card border border-border rounded-xl p-2">
                    <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Rollen
                    </div>
                    {orderedRoles.map(role => {
                        const hasOverwrite = overwriteByRoleId.has(role.id);
                        const active = role.id === selectedRoleId;
                        return (
                            <button
                                key={role.id}
                                onClick={() => pickRole(role.id)}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors ${
                                    active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                }`}
                            >
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: role.color || (role.isEveryone ? '#99aab5' : '#99aab5') }}
                                />
                                <span className="truncate flex-1 text-left">
                                    {role.isEveryone ? '@everyone' : role.name}
                                </span>
                                {hasOverwrite && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="Overrides aktiv" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Permissions grid for the selected role */}
                <div className="flex-1 min-w-0 flex flex-col gap-3 overflow-hidden">
                    {!selectedRoleId ? (
                        <div className="text-sm text-muted-foreground p-4">Keine Rolle ausgewählt.</div>
                    ) : isLoading ? (
                        <div className="text-sm text-muted-foreground p-4">Lade…</div>
                    ) : (
                        <>
                            {!canEditSelected && (
                                <div className="text-xs text-dnd bg-dnd/10 border border-dnd/30 rounded-lg px-3 py-2">
                                    Diese Rolle steht hierarchisch über deiner — du kannst die Overrides sehen, aber nicht ändern.
                                </div>
                            )}
                            <div className="bg-card border border-border rounded-xl overflow-y-auto">
                                <div className="px-5 py-3 border-b border-border">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        Berechtigungen für {selectedRole?.isEveryone ? '@everyone' : selectedRole?.name}
                                    </span>
                                </div>
                                <div className="divide-y divide-border">
                                    {rows.map(row => (
                                        <div key={row.bit} className="flex items-start justify-between px-5 py-3 gap-4">
                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                <span className="text-sm font-medium text-foreground">{row.label}</span>
                                                <span className="text-xs text-muted-foreground">{row.desc}</span>
                                            </div>
                                            <TriToggle
                                                state={editState[row.bit] ?? 'neutral'}
                                                disabled={!canEditSelected}
                                                onChange={(s) => setEditState(prev => ({ ...prev, [row.bit]: s }))}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {error && <p className="text-sm text-dnd px-1">{error}</p>}

                    <SaveBar visible={hasChanges && canEditSelected} onReset={handleReset} onSave={handleSave} saving={saving} />
                </div>
            </div>
        </div>
    );
}
