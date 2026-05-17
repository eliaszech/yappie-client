import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import ContentHeader from '../../components/ContentHeader.jsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@awesome.me/kit-95376d5d61/icons/classic/light';
import { faMessage, faUserXmark, faBan } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import { faTag, faSearch } from '@awesome.me/kit-95376d5d61/icons/classic/regular';
import { fetchMembers, fetchRoles, fetchServer, kickMember, fetchOrCreateConversationWith } from '../../../services/api.js';
import UserAvatar from '../../components/UserAvatar.jsx';
import HasUserPopup from '../../components/user/HasUserPopup.jsx';
import Spinner from '../../components/static/Spinner.jsx';
import NoResultsMessage from '../../components/static/NoResultsMessage.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { useNavigate } from 'react-router-dom';
import { useContextMenu } from '../../../hooks/useContextMenu.js';
import RolePickerDialog from './RolePickerDialog.jsx';
import {getSocket} from "../../../services/socket.js";

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
                    Möchtest du <span className="font-semibold text-foreground">{member.user.displayName ?? member.user.username}</span> wirklich rauswerfen?
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

function MemberList() {
    const { serverId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { openContextMenu } = useContextMenu();

    const [search, setSearch] = useState('');
    const [confirmKick, setConfirmKick] = useState(null);
    const [rolePicker, setRolePicker] = useState(null);

    const { data: members = [], isLoading } = useQuery({
        queryKey: ['members', serverId],
        queryFn: () => fetchMembers('members', serverId),
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const { data: server } = useQuery({
        queryKey: ['server', serverId],
        queryFn: () => fetchServer(serverId),
        staleTime: 10 * 60 * 1000,
    });

    const isOwner = server?.ownerId === currentUser?.id;

    const filtered = members.filter(m =>
        (m.user.displayName ?? m.user.username).toLowerCase().includes(search.toLowerCase()) ||
        m.user.username.toLowerCase().includes(search.toLowerCase())
    );

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

    return (
        <>
            <ContentHeader>
                <div className="flex items-center text-foreground gap-3">
                    <FontAwesomeIcon icon={faUsers} />
                    <span className="font-medium">Mitglieder</span>
                </div>
            </ContentHeader>

            <div className="w-full h-full overflow-y-auto p-4">
                <div className="w-full bg-guild-bar rounded-xl border border-border text-foreground">
                    <div className="flex justify-between items-center px-4 py-3 border-b border-border gap-4">
                        <span className="text-sm font-medium">Alle Mitglieder</span>
                        <div className="relative">
                            <FontAwesomeIcon icon={faSearch} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                type="text"
                                placeholder="Nach Name oder ID suchen"
                                className="bg-card text-sm w-[260px] rounded-md border border-border outline-none py-1.5 pl-8 pr-3 text-foreground focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground"
                            />
                        </div>
                    </div>

                    {isLoading && (
                        <div className="flex justify-center p-8">
                            <Spinner size="w-8 h-8" />
                        </div>
                    )}

                    {!isLoading && filtered.length === 0 && (
                        <div className="flex items-center justify-center h-[200px]">
                            <NoResultsMessage
                                icon={<FontAwesomeIcon icon={faUsers} />}
                                title="Keine Mitglieder"
                                message={search ? 'Keine Mitglieder gefunden.' : 'Es sind noch keine Mitglieder in diesem Server.'}
                            />
                        </div>
                    )}

                    <div className="flex flex-col divide-y divide-border">
                        {filtered.map(member => {
                            const isSelf = member.user.id === currentUser.id;
                            const memberRoles = member.roles || [];
                            const topRoleColor = memberRoles[0]?.role?.color ?? null;

                            return (
                                <div
                                    key={member.user.id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                                    onContextMenu={(e) => openContextMenu(e, buildContextItems(member))}
                                >
                                    <HasUserPopup user={member.user} orientation="left" roles={member.roles}>
                                        <div className="flex items-center gap-3 min-w-0 w-52 shrink-0">
                                            <UserAvatar
                                                size="w-9 h-9"
                                                avatar={member.user.avatar}
                                                icon={member.user.username.charAt(0).toUpperCase()}
                                                displayOnline={false}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span
                                                    className="text-sm font-medium truncate"
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
                                    </HasUserPopup>

                                    <div className="flex-1 flex items-center gap-1.5 flex-wrap">
                                        {memberRoles.map(r => (
                                            <RoleBadge key={r.roleId ?? r.role?.id} role={r.role ?? r} />
                                        ))}
                                    </div>

                                    {!isSelf && isOwner && (
                                        <button
                                            onClick={() => setConfirmKick(member)}
                                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md text-dnd hover:bg-dnd/10 transition-all cursor-pointer shrink-0"
                                        >
                                            <FontAwesomeIcon icon={faUserXmark} />
                                            Rauswerfen
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {!isLoading && (
                        <div className="flex justify-between text-muted-foreground items-center px-4 py-2 border-t border-border text-xs">
                            {filtered.length} {filtered.length === 1 ? 'Mitglied' : 'Mitglieder'}
                        </div>
                    )}
                </div>
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

export default MemberList;
