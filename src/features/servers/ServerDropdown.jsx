import { faGear } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { faUserPlus, faRightFromBracket } from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import InviteDialog from "./dialogs/InviteDialog.jsx";
import { leaveServer } from "../../services/api.js";
import { getSocket } from "../../services/socket.js";
import { useAuth } from "../../hooks/useAuth.js";
import { hasPermission, PERMISSIONS } from "../../services/permissions.js";

export function ServerDropdown({ server, closeDropdown, onOpenSettings }) {
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [leaveError, setLeaveError] = useState('');
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const canInvite = hasPermission(server, PERMISSIONS.CREATE_INVITES);
    const isOwner = !!server?.isOwner;
    // Anyone who can manage *something* about the server sees the entry. Pure
    // @everyone members get no settings access at all.
    const canOpenSettings = isOwner
        || hasPermission(server, PERMISSIONS.MANAGE_SERVER)
        || hasPermission(server, PERMISSIONS.MANAGE_CHANNELS)
        || hasPermission(server, PERMISSIONS.KICK_MEMBERS)
        || hasPermission(server, PERMISSIONS.BAN_MEMBERS)
        || hasPermission(server, PERMISSIONS.MANAGE_INVITES)
        || canInvite;

    useEffect(() => {
        function handleClick(e) {
            // InviteDialog is portaled to document.body, so its clicks land
            // outside dropdownRef. Skip the outside-click while it's open or
            // the dialog would unmount on every click inside it.
            if (inviteDialogOpen) return;
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                closeDropdown();
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [closeDropdown, inviteDialogOpen]);

    async function handleLeave() {
        if (!server?.id || leaving) return;
        setLeaving(true);
        setLeaveError('');
        const res = await leaveServer(server.id);
        if (res?.error) {
            setLeaveError(res.error);
            setLeaving(false);
            return;
        }
        queryClient.setQueryData(['servers'], (old) =>
            Array.isArray(old) ? old.filter(s => s.id !== server.id) : old
        );
        queryClient.removeQueries({ queryKey: ['server', server.id] });
        queryClient.removeQueries({ queryKey: ['channels', server.id] });
        queryClient.removeQueries({ queryKey: ['server-members', server.id] });

        const socket = getSocket();
        if (socket && user) socket.emit('server:user:update', 'leave', user.id, server.id);

        closeDropdown();
        navigate('/@me');
    }

    return (
        <div ref={dropdownRef} className="absolute top-11.5 left-0 w-full">
            <div className="flex flex-col bg-guild-bar divide-y divide-border rounded-b-lg border border-border text-foreground w-full">
                {canInvite && (
                    <button
                        onClick={() => setInviteDialogOpen(true)}
                        className="cursor-pointer flex items-center gap-2 py-2.5 px-3 hover:bg-muted/50 text-foreground text-sm"
                    >
                        <FontAwesomeIcon icon={faUserPlus} />
                        Zu Server einladen
                    </button>
                )}
                {canOpenSettings && (
                    <button
                        onClick={() => { closeDropdown(); onOpenSettings(); }}
                        className="cursor-pointer flex items-center gap-2 py-2.5 px-3 hover:bg-muted/50 text-foreground text-sm"
                    >
                        <FontAwesomeIcon icon={faGear} />
                        Servereinstellungen
                    </button>
                )}
                {!isOwner && (
                    confirmLeave ? (
                        <div className="flex flex-col gap-1.5 px-3 py-2.5">
                            <span className="text-xs text-foreground">Server wirklich verlassen?</span>
                            {leaveError && <span className="text-[11px] text-dnd">{leaveError}</span>}
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => { setConfirmLeave(false); setLeaveError(''); }}
                                    disabled={leaving}
                                    className="flex-1 text-xs py-1 rounded-md bg-muted text-foreground hover:bg-muted/80 cursor-pointer disabled:opacity-50"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleLeave}
                                    disabled={leaving}
                                    className="flex-1 text-xs py-1 rounded-md bg-dnd text-white hover:bg-dnd/80 cursor-pointer disabled:opacity-50"
                                >
                                    Verlassen
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setConfirmLeave(true)}
                            className="cursor-pointer flex items-center gap-2 py-2.5 px-3 hover:bg-dnd/10 text-dnd text-sm"
                        >
                            <FontAwesomeIcon icon={faRightFromBracket} />
                            Server verlassen
                        </button>
                    )
                )}
            </div>
            {inviteDialogOpen && (
                <InviteDialog server={server} onCancel={() => setInviteDialogOpen(false)} />
            )}
        </div>
    );
}

export default ServerDropdown;
