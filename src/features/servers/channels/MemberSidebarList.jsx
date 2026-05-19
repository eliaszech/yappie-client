import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMembers, fetchRoles, fetchServer, kickMember, fetchOrCreateConversationWith } from '../../../services/api.js';
import Spinner from '../../components/static/Spinner.jsx';
import ErrorMessage from '../../components/static/ErrorMessage.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@awesome.me/kit-95376d5d61/icons/classic/light';
import { faMessage, faUserXmark, faBan } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { faTag } from '@awesome.me/kit-95376d5d61/icons/classic/regular';
import UserItem from '../../components/UserItem.jsx';
import { useUsersWithPresence } from '../../../hooks/useUsersWithPresence.js';
import HasUserPopup from '../../components/user/HasUserPopup.jsx';
import { useContextMenu } from '../../../hooks/useContextMenu.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import RolePickerDialog from '../members/RolePickerDialog.jsx';
import {getSocket} from "../../../services/socket.js";
import { hasPermission, PERMISSIONS } from "../../../services/permissions.js";
function KickConfirmDialog({ member, onConfirm, onClose }) {
    const [kicking, setKicking] = useState(false);

    async function handleConfirm() {
        setKicking(true);
        await onConfirm(member);
        setKicking(false);
        onClose();
    }

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-xl shadow-2xl p-6 w-80 z-[301]">
                <h3 className="text-base font-semibold text-foreground mb-1">Mitglied rauswerfen</h3>
                <p className="text-sm text-muted-foreground mb-5">
                    Möchtest du <span className="font-semibold text-foreground">{member.user.displayName ?? member.user.username}</span> wirklich aus dem Server rauswerfen?
                </p>
                <div className="flex gap-2 justify-end">
                    <button onClick={onClose} className="px-4 py-1.5 text-sm rounded-md bg-muted text-foreground hover:bg-muted/80 cursor-pointer transition-colors">
                        Abbrechen
                    </button>
                    <button onClick={handleConfirm} disabled={kicking} className="px-4 py-1.5 text-sm rounded-md bg-dnd text-white hover:bg-dnd/80 cursor-pointer disabled:opacity-50 transition-colors">
                        {kicking ? '…' : 'Rauswerfen'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MemberSidebarList({ serverId }) {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { openContextMenu } = useContextMenu();

    const [confirmKick, setConfirmKick] = useState(null);
    const [rolePicker, setRolePicker] = useState(null);

    const { users: members, isLoading, isError } = useUsersWithPresence({
        queryKey: ['members', serverId],
        fetchFunction: () => fetchMembers('members', serverId),
        getUserId: (member) => member.user.id,
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['roles', serverId],
        queryFn: () => fetchRoles(serverId),
        staleTime: 5 * 60 * 1000,
    });

    const { data: server } = useQuery({
        queryKey: ['server', serverId],
        queryFn: () => fetchServer(serverId),
        staleTime: 10 * 60 * 1000,
    });

    const isOwner = server?.ownerId === currentUser?.id;
    const canManageRoles = hasPermission(server, PERMISSIONS.MANAGE_ROLES);
    const canKick = hasPermission(server, PERMISSIONS.KICK_MEMBERS);
    const canBan = hasPermission(server, PERMISSIONS.BAN_MEMBERS);

    if (isLoading) return <Spinner size="w-10 h-10" />;
    if (isError) return <ErrorMessage icon={<FontAwesomeIcon icon={faUsers} />} title="Fehler beim Laden" message="Mitglieder konnten nicht geladen werden" />;

    const onlineMembers = members.filter(m => m.user.online);
    const offlineMembers = members.filter(m => !m.user.online);

    // Roles is sorted by [isOwnerRole desc, position desc] — index 0 is the
    // top of the hierarchy. We need two top-role pickers:
    //  - hoisted: only roles flagged hoist (drives the sidebar grouping)
    //  - colored: anything with a color (drives username tint)
    function topRoleBy(member, predicate) {
        const memberRoleIds = new Set((member.roles || []).map(r => r.role?.id ?? r.id));
        for (const role of roles) {
            if (memberRoleIds.has(role.id) && predicate(role)) return role;
        }
        return null;
    }
    function getTopHoistedRole(member) {
        return topRoleBy(member, r => r.hoist && !r.isEveryone);
    }
    function getTopColoredRole(member) {
        return topRoleBy(member, r => !!r.color && !r.isEveryone);
    }

    async function handleKick(member) {
        const res = await kickMember(serverId, member.id);
        if (!res?.error) {
            const socket = getSocket();
            socket.emit('server:user:update', 'kick', member.userId, serverId);
        }
    }

    async function handleOpenDm(member) {
        const conversation = await fetchOrCreateConversationWith(member.user.id);
        if (!conversation.error) {
            navigate(`/@me/messages/${conversation.id}`);
        }
    }

    function buildContextItems(member) {
        const isSelf = member.user.id === currentUser.id;

        const items = [
            {
                label: 'Nachricht senden',
                icon: faMessage,
                onClick: () => handleOpenDm(member),
            },
        ];

        if (!isSelf) {
            const modItems = [];
            if (canManageRoles) {
                modItems.push({
                    label: 'Rollen verwalten',
                    icon: faTag,
                    onClick: () => setRolePicker(member),
                });
            }
            if (canKick) {
                modItems.push({
                    label: 'Rauswerfen',
                    icon: faUserXmark,
                    danger: true,
                    onClick: () => setConfirmKick(member),
                });
            }
            if (canBan) {
                modItems.push({
                    label: 'Sperren',
                    icon: faBan,
                    danger: true,
                    disabled: true,
                    disabledLabel: 'Bald',
                    onClick: () => {},
                });
            }
            if (modItems.length > 0) {
                items.push({ separator: true });
                items.push({ label: 'MODERATION', header: true });
                items.push(...modItems);
            }
        }

        return items;
    }

    const grouped = [];
    const assignedIds = new Set();

    for (const role of roles) {
        if (!role.hoist || role.isEveryone) continue;
        const roleMembers = onlineMembers.filter(m => getTopHoistedRole(m)?.id === role.id);
        if (roleMembers.length > 0) {
            grouped.push({ role, members: roleMembers });
            roleMembers.forEach(m => assignedIds.add(m.user.id));
        }
    }

    const ungroupedOnline = onlineMembers.filter(m => !assignedIds.has(m.user.id));

    function renderMember(member) {
        const colorRole = getTopColoredRole(member);
        return (
            <div
                key={member.userId ?? member.user.id}
                onContextMenu={(e) => openContextMenu(e, buildContextItems(member))}
            >
                <HasUserPopup user={member.user} orientation="left" roles={member.roles}>
                    <UserItem serverMember={member} color={colorRole?.color} />
                </HasUserPopup>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col px-2 py-4 gap-1">
                {grouped.map(({ role, members: roleMembers }) => (
                    <div key={role.id} className="mb-1">
                        <div className="flex items-center gap-1.5 px-2 py-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: role.color || '#99aab5' }}>
                                {role.name} — {roleMembers.length}
                            </span>
                        </div>
                        {roleMembers.map(member => renderMember(member))}
                    </div>
                ))}

                {ungroupedOnline.length > 0 && (
                    <div className="mb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 text-muted-foreground block">
                            Online — {ungroupedOnline.length}
                        </span>
                        {ungroupedOnline.map(member => renderMember(member))}
                    </div>
                )}

                {offlineMembers.length > 0 && (
                    <div className="mt-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 text-muted-foreground block">
                            Offline — {offlineMembers.length}
                        </span>
                        {offlineMembers.map(member => renderMember(member))}
                    </div>
                )}
            </div>

            {confirmKick && (
                <KickConfirmDialog
                    member={confirmKick}
                    onConfirm={handleKick}
                    onClose={() => setConfirmKick(null)}
                />
            )}

            {rolePicker && (
                <RolePickerDialog
                    serverId={serverId}
                    server={server}
                    member={rolePicker}
                    onClose={() => setRolePicker(null)}
                />
            )}
        </>
    );
}

export default MemberSidebarList;
