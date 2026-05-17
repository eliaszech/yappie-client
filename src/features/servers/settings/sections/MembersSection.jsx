import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMembers, fetchRoles, kickMember, assignRole, removeRole } from "../../../../services/api.js";
import UserAvatar from "../../../components/UserAvatar.jsx";
import { useAuth } from "../../../../hooks/useAuth.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserXmark, faPlus, faCheck } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import Spinner from "../../../components/static/Spinner.jsx";
import {getSocket} from "../../../../services/socket.js";

function RoleAssignPopup({ serverId, member, onClose }) {
    const ref = useRef(null);
    const queryClient = useQueryClient();

    const { data: allRoles = [] } = useQuery({
        queryKey: ['roles', serverId],
        queryFn: () => fetchRoles(serverId),
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        const handle = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [onClose]);

    const memberRoleIds = new Set((member.roles || []).map(r => r.id));

    async function toggleRole(role) {
        const isAssigned = memberRoleIds.has(role.id);

        queryClient.setQueryData(['members', serverId], (old) => {
            if (!old) return old;
            return old.map(m => {
                if (m.user.id !== member.user.id) return m;
                const newRoles = isAssigned
                    ? (m.roles || []).filter(r => r.roleId !== role.roleId)
                    : [...(m.roles || []), {roleId: role.id, memberId: member.id, role: role}];
                return { ...m, roles: newRoles };
            });
        });

        if (isAssigned) {
            await removeRole(serverId, member.id, role.id);
        } else {
            await assignRole(serverId, member.id, role.id);
        }
    }

    return (
        <div
            ref={ref}
            className="absolute bottom-full left-0 mb-1 w-52 bg-guild-bar rounded-lg border border-border shadow-xl z-20 py-1 overflow-hidden"
        >
            <div className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                Rollen
            </div>
            {allRoles.length === 0 && (
                <p className="text-xs text-muted-foreground px-3 py-2">Keine Rollen vorhanden</p>
            )}
            {allRoles.map(role => {
                const assigned = memberRoleIds.has(role.id);
                return (
                    <button
                        key={role.id}
                        onClick={() => toggleRole(role)}
                        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-muted/50 text-sm cursor-pointer transition-colors"
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: role.color || '#99aab5' }}
                            />
                            <span className={`truncate ${assigned ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {role.name}
                            </span>
                        </div>
                        {assigned && <FontAwesomeIcon icon={faCheck} className="text-primary text-xs shrink-0" />}
                    </button>
                );
            })}
        </div>
    );
}

function RoleBadge({ role }) {
    return (
        <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
                background: `${role.color || '#99aab5'}22`,
                color: role.color || '#99aab5',
            }}
        >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: role.color || '#99aab5' }} />
            {role.name}
        </span>
    );
}

function MembersSection({ server }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [confirmId, setConfirmId] = useState(null);
    const [kickingId, setKickingId] = useState(null);
    const [roleMenuId, setRoleMenuId] = useState(null);

    const { data: members = [], isLoading } = useQuery({
        queryKey: ['members', server.id],
        queryFn: () => fetchMembers('members', server.id),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const filtered = members.filter(m =>
        (m.user.displayName ?? m.user.username).toLowerCase().includes(search.toLowerCase()) ||
        m.user.username.toLowerCase().includes(search.toLowerCase())
    );

    async function handleKick(member) {
        setKickingId(member.id);
        const res = await kickMember(server.id, member.id);
        if (!res?.error) {
            const socket = getSocket();
            socket.emit('server:user:update', 'kick', member.userId, server.id);
        }
        setKickingId(null);
        setConfirmId(null);
    }

    return (
        <div className="flex flex-col w-full h-full">
            <div className="flex items-center justify-between px-4 py-2">
                <h1 className="text-lg font-bold text-foreground">Mitglieder</h1>
            </div>

            <div className="max-w-[80%] py-4 px-4 w-full mx-auto flex flex-col gap-4 overflow-y-auto">
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Mitglieder suchen…"
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                />

                <div className="bg-card rounded-xl border border-border overflow-visible">
                    <div className="px-4 py-2.5 border-b border-border">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Mitglieder — {filtered.length}
                        </span>
                    </div>

                    {isLoading && (
                        <div className="flex justify-center p-8">
                            <Spinner size="w-8 h-8" />
                        </div>
                    )}

                    <div className="flex flex-col divide-y divide-border">
                        {filtered.map(member => {
                            const isSelf = member.user.id === user.id;
                            const isConfirming = confirmId === member.user.id;
                            const isKicking = kickingId === member.user.id;
                            const memberRoles = member.roles || [];
                            const topRoleColor = memberRoles[0]?.role.color ?? null;

                            return (
                                <div
                                    key={member.user.id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group"
                                >
                                    {/* Avatar + name */}
                                    <div className="flex items-center gap-3 min-w-0 w-44 shrink-0">
                                        <UserAvatar
                                            size="w-9 h-9"
                                            avatar={member.user.avatar}
                                            icon={member.user.username.charAt(0).toUpperCase()}
                                            displayOnline={false}
                                        />
                                        <div className="flex flex-col min-w-0">
                                            <span
                                                className="text-sm font-medium truncate text-foreground"
                                                style={topRoleColor ? { color: topRoleColor } : undefined}
                                            >
                                                {member.user.displayName ?? member.user.username}
                                                {isSelf && (
                                                    <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">(Du)</span>
                                                )}
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">{member.user.username}</span>
                                        </div>
                                    </div>

                                    {/* Roles */}
                                    <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                                        {memberRoles.map(role => (
                                            <RoleBadge key={role.roleId} role={role.role} />
                                        ))}
                                        <div className="relative">
                                            <button
                                                onClick={() => setRoleMenuId(roleMenuId === member.user.id ? null : member.user.id)}
                                                className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full border border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-all cursor-pointer"
                                            >
                                                <FontAwesomeIcon icon={faPlus} className="text-[9px]" />
                                            </button>
                                            {roleMenuId === member.user.id && (
                                                <RoleAssignPopup
                                                    serverId={server.id}
                                                    member={member}
                                                    onClose={() => setRoleMenuId(null)}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Kick */}
                                    {!isSelf && (
                                        isConfirming ? (
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="text-xs text-muted-foreground">Wirklich?</span>
                                                <button
                                                    onClick={() => setConfirmId(null)}
                                                    className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground cursor-pointer transition-colors"
                                                >
                                                    Nein
                                                </button>
                                                <button
                                                    onClick={() => handleKick(member)}
                                                    disabled={isKicking}
                                                    className="text-xs px-2 py-1 rounded-md bg-dnd text-white hover:bg-dnd/80 cursor-pointer disabled:opacity-50 transition-colors"
                                                >
                                                    {isKicking ? '…' : 'Ja'}
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmId(member.user.id)}
                                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md text-dnd hover:bg-dnd/10 transition-all cursor-pointer shrink-0"
                                            >
                                                <FontAwesomeIcon icon={faUserXmark} />
                                                Rauswerfen
                                            </button>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MembersSection;
