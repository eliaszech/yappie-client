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

    if (isLoading) return <Spinner size="w-10 h-10" />;
    if (isError) return <ErrorMessage icon={<FontAwesomeIcon icon={faUsers} />} title="Fehler beim Laden" message="Mitglieder konnten nicht geladen werden" />;

    const onlineMembers = members.filter(m => m.user.online);
    const offlineMembers = members.filter(m => !m.user.online);

    function getTopRole(member) {
        const memberRoles = member.roles || [];
        let topIndex = Infinity;
        let topRole = null;
        for (const r of memberRoles) {
            const roleId = r.role?.id ?? r.id;
            const idx = roles.findIndex(role => role.id === roleId);
            if (idx !== -1 && idx < topIndex) {
                topIndex = idx;
                topRole = roles[idx];
            }
        }
        return topRole;
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

        if (!isSelf && isOwner) {
            items.push({ separator: true });
            items.push({ label: 'MODERATION', header: true });
            items.push({
                label: 'Rollen verwalten',
                icon: faTag,
                onClick: () => setRolePicker(member),
            });
            items.push({ separator: true });
            items.push({
                label: 'Rauswerfen',
                icon: faUserXmark,
                danger: true,
                onClick: () => setConfirmKick(member),
            });
            items.push({
                label: 'Sperren',
                icon: faBan,
                danger: true,
                disabled: true,
                disabledLabel: 'Bald',
                onClick: () => {},
            });
        }

        return items;
    }

    const grouped = [];
    const assignedIds = new Set();

    for (const role of roles) {
        const roleMembers = onlineMembers.filter(m => getTopRole(m)?.id === role.id);
        if (roleMembers.length > 0) {
            grouped.push({ role, members: roleMembers });
            roleMembers.forEach(m => assignedIds.add(m.user.id));
        }
    }

    const ungroupedOnline = onlineMembers.filter(m => !assignedIds.has(m.user.id));

    function renderMember(member) {
        const topRole = getTopRole(member);
        return (
            <div
                key={member.userId ?? member.user.id}
                onContextMenu={(e) => openContextMenu(e, buildContextItems(member))}
            >
                <HasUserPopup user={member.user} orientation="left" roles={member.roles}>
                    <UserItem serverMember={member} color={topRole?.color} />
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
                    member={rolePicker}
                    onClose={() => setRolePicker(null)}
                />
            )}
        </>
    );
}

export default MemberSidebarList;
