import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faPlus, faSpinner, faXmark, faUser, faShield } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    fetchRoles, fetchMembers, updateChannel,
    fetchChannelAccess, addChannelAccessRole, removeChannelAccessRole,
    addChannelAccessUser, removeChannelAccessUser,
} from "../../../../services/api.js";
import { canActOnRole } from "../../../../services/permissions.js";
import UserAvatar from "../../../components/UserAvatar.jsx";

function Toggle({ enabled, onChange, disabled }) {
    return (
        <button
            type="button"
            onClick={() => !disabled && onChange(!enabled)}
            disabled={disabled}
            className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
            }`} />
        </button>
    );
}

function PickerPopover({ items, renderItem, onPick, emptyLabel, onClose }) {
    return (
        <div className="absolute top-full left-0 mt-2 w-72 max-h-72 overflow-y-auto bg-popover border border-border rounded-lg shadow-xl z-30">
            {items.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">{emptyLabel}</div>
            ) : items.map(item => (
                <button
                    key={item.id}
                    onClick={() => { onPick(item); onClose(); }}
                    className="w-full px-3 py-2 flex items-center gap-2 hover:bg-muted/60 cursor-pointer transition-colors"
                >
                    {renderItem(item)}
                </button>
            ))}
        </div>
    );
}

export default function PrivateChannelSection({ channel, server }) {
    const queryClient = useQueryClient();
    const [isPrivate, setIsPrivate] = useState(!!channel.isPrivate);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showRolePicker, setShowRolePicker] = useState(false);
    const [showUserPicker, setShowUserPicker] = useState(false);

    useEffect(() => { setIsPrivate(!!channel.isPrivate); }, [channel.isPrivate]);

    const { data: roles = [] } = useQuery({
        queryKey: ['roles', server.id],
        queryFn: () => fetchRoles(server.id),
        staleTime: 5 * 60 * 1000,
    });
    const { data: members = [] } = useQuery({
        queryKey: ['members', server.id],
        queryFn: () => fetchMembers('members', server.id),
        staleTime: 5 * 60 * 1000,
    });
    const { data: access = { roles: [], users: [] } } = useQuery({
        queryKey: ['channelAccess', channel.id],
        queryFn: () => fetchChannelAccess(channel.id),
        enabled: isPrivate,
        staleTime: 60 * 1000,
    });

    const accessRoleIds = useMemo(() => new Set((access.roles ?? []).map(r => r.id)), [access.roles]);
    const accessUserIds = useMemo(() => new Set((access.users ?? []).map(u => u.id)), [access.users]);

    // Pickable roles: server roles minus already-added, minus owner role,
    // minus roles above caller's hierarchy (consistent with permissions UI).
    const pickableRoles = useMemo(() => {
        return roles.filter(r => !r.isOwnerRole && !accessRoleIds.has(r.id) && canActOnRole(server, r));
    }, [roles, accessRoleIds, server]);

    const pickableMembers = useMemo(() => {
        return members.filter(m => !accessUserIds.has(m.user.id));
    }, [members, accessUserIds]);

    async function togglePrivate(next) {
        setSaving(true);
        setError('');
        setIsPrivate(next);
        const res = await updateChannel(server.id, channel.id, { isPrivate: next });
        if (res?.error) {
            setError(res.error);
            setIsPrivate(!next);
        } else {
            // Patch the channels cache so the icon flips immediately.
            queryClient.setQueryData(['channels', server.id], (old) =>
                Array.isArray(old) ? old.map(c => c.id === channel.id ? { ...c, isPrivate: next } : c) : old
            );
            // Refresh access list (clears when turning off).
            queryClient.invalidateQueries({ queryKey: ['channelAccess', channel.id] });
            queryClient.invalidateQueries({ queryKey: ['channels', server.id] });
        }
        setSaving(false);
    }

    async function addRole(role) {
        const res = await addChannelAccessRole(channel.id, role.id);
        if (res?.error) { setError(res.error); return; }
        queryClient.setQueryData(['channelAccess', channel.id], (old) => ({
            roles: [...(old?.roles ?? []), role],
            users: old?.users ?? [],
        }));
    }
    async function removeRole(roleId) {
        const res = await removeChannelAccessRole(channel.id, roleId);
        if (res?.error) { setError(res.error); return; }
        queryClient.setQueryData(['channelAccess', channel.id], (old) => ({
            roles: (old?.roles ?? []).filter(r => r.id !== roleId),
            users: old?.users ?? [],
        }));
    }
    async function addUser(user) {
        const res = await addChannelAccessUser(channel.id, user.id);
        if (res?.error) { setError(res.error); return; }
        queryClient.setQueryData(['channelAccess', channel.id], (old) => ({
            roles: old?.roles ?? [],
            users: [...(old?.users ?? []), user],
        }));
    }
    async function removeUser(userId) {
        const res = await removeChannelAccessUser(channel.id, userId);
        if (res?.error) { setError(res.error); return; }
        queryClient.setQueryData(['channelAccess', channel.id], (old) => ({
            roles: old?.roles ?? [],
            users: (old?.users ?? []).filter(u => u.id !== userId),
        }));
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Privatsphäre</h1>
            </div>

            <div className="max-w-3xl mx-auto w-full py-4 px-4 flex flex-col gap-4">
                {/* isPrivate toggle */}
                <div className="bg-card rounded-xl border border-border p-5 flex items-start justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground flex items-center gap-2">
                            <FontAwesomeIcon icon={faLock} className="text-muted-foreground text-xs" />
                            Privater Sprachkanal
                        </span>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                            Nur ausgewählte Rollen oder Mitglieder können diesen Kanal betreten. Die Server-Berechtigung
                            „Sprachkanal beitreten" gilt weiterhin als Voraussetzung.
                        </span>
                    </div>
                    <Toggle enabled={isPrivate} onChange={togglePrivate} disabled={saving} />
                </div>

                {/* Access lists (only meaningful when private) */}
                {isPrivate && (
                    <>
                        {/* Roles */}
                        <div className="bg-card rounded-xl border border-border">
                            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Rollen mit Zugang
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowRolePicker(v => !v); setShowUserPicker(false); }}
                                        className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted/60 text-foreground hover:bg-muted cursor-pointer flex items-center gap-1.5"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                                        Rolle hinzufügen
                                    </button>
                                    {showRolePicker && (
                                        <PickerPopover
                                            items={pickableRoles}
                                            emptyLabel="Keine weiteren Rollen verfügbar."
                                            onPick={addRole}
                                            onClose={() => setShowRolePicker(false)}
                                            renderItem={(r) => (
                                                <>
                                                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color || '#99aab5' }} />
                                                    <span className="text-sm text-foreground truncate flex-1 text-left">
                                                        {r.isEveryone ? '@everyone' : r.name}
                                                    </span>
                                                </>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="divide-y divide-border">
                                {(access.roles ?? []).length === 0 ? (
                                    <div className="px-5 py-4 text-center text-xs text-muted-foreground">
                                        Noch keine Rollen freigegeben.
                                    </div>
                                ) : access.roles.map(r => (
                                    <div key={r.id} className="px-5 py-2.5 flex items-center gap-3">
                                        <FontAwesomeIcon icon={faShield} className="text-muted-foreground text-xs" />
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color || '#99aab5' }} />
                                        <span className="flex-1 text-sm text-foreground truncate">
                                            {r.isEveryone ? '@everyone' : r.name}
                                        </span>
                                        <button
                                            onClick={() => removeRole(r.id)}
                                            title="Entfernen"
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-dnd hover:bg-dnd/10 cursor-pointer"
                                        >
                                            <FontAwesomeIcon icon={faXmark} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Users */}
                        <div className="bg-card rounded-xl border border-border">
                            <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Mitglieder mit Zugang
                                </span>
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowUserPicker(v => !v); setShowRolePicker(false); }}
                                        className="text-xs font-medium px-2.5 py-1 rounded-md bg-muted/60 text-foreground hover:bg-muted cursor-pointer flex items-center gap-1.5"
                                    >
                                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                                        Mitglied hinzufügen
                                    </button>
                                    {showUserPicker && (
                                        <PickerPopover
                                            items={pickableMembers.map(m => ({ ...m, id: m.user.id }))}
                                            emptyLabel="Keine weiteren Mitglieder verfügbar."
                                            onPick={(m) => addUser(m.user)}
                                            onClose={() => setShowUserPicker(false)}
                                            renderItem={(m) => (
                                                <>
                                                    <UserAvatar
                                                        size="w-6 h-6 text-xs"
                                                        displayOnline={false}
                                                        avatar={m.user.avatar}
                                                        icon={(m.user.username ?? '?').charAt(0).toUpperCase()}
                                                    />
                                                    <span className="text-sm text-foreground truncate flex-1 text-left">
                                                        {m.user.displayName ?? m.user.username}
                                                    </span>
                                                </>
                                            )}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="divide-y divide-border">
                                {(access.users ?? []).length === 0 ? (
                                    <div className="px-5 py-4 text-center text-xs text-muted-foreground">
                                        Noch keine Mitglieder freigegeben.
                                    </div>
                                ) : access.users.map(u => (
                                    <div key={u.id} className="px-5 py-2.5 flex items-center gap-3">
                                        <UserAvatar
                                            size="w-7 h-7 text-xs"
                                            displayOnline={false}
                                            avatar={u.avatar}
                                            icon={(u.username ?? '?').charAt(0).toUpperCase()}
                                        />
                                        <span className="flex-1 text-sm text-foreground truncate">
                                            {u.displayName ?? u.username}
                                        </span>
                                        <button
                                            onClick={() => removeUser(u.id)}
                                            title="Entfernen"
                                            className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-dnd hover:bg-dnd/10 cursor-pointer"
                                        >
                                            <FontAwesomeIcon icon={faXmark} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {saving && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <FontAwesomeIcon icon={faSpinner} spin /> Speichern…
                    </div>
                )}
                {error && <p className="text-sm text-dnd">{error}</p>}
            </div>
        </div>
    );
}
