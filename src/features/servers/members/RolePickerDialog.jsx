import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchRoles, assignRole, removeRole } from '../../../services/api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faXmark } from '@awesome.me/kit-95376d5d61/icons/classic/solid';
import {getSocket} from "../../../services/socket.js";

function RolePickerDialog({ serverId, member, onClose }) {
    const queryClient = useQueryClient();

    const { data: allRoles = [] } = useQuery({
        queryKey: ['roles', serverId],
        queryFn: () => fetchRoles(serverId),
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        const handle = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handle);
        return () => document.removeEventListener('keydown', handle);
    }, [onClose]);

    const memberRoleIds = new Set((member.roles || []).map(r => r.role?.id ?? r.id));

    async function toggleRole(role) {
        const isAssigned = memberRoleIds.has(role.id);

        queryClient.setQueryData(['members', serverId], (old) => {
            if (!old) return old;
            return old.map(m => {
                if (m.user.id !== member.user.id) return m;
                const newRoles = isAssigned
                    ? (m.roles || []).filter(r => (r.role?.id ?? r.id) !== role.id)
                    : [...(m.roles || []), { roleId: role.id, memberId: member.id, role }];
                return { ...m, roles: newRoles };
            });
        });

        if (isAssigned) {
            await removeRole(serverId, member.id, role.id);
        } else {
            await assignRole(serverId, member.id, role.id);
        }

        const socket = getSocket();
        socket.emit('server:user:update', 'updateRole', member.userId, serverId);
    }

    const displayName = member.user.displayName ?? member.user.username;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative bg-card border border-border rounded-xl shadow-2xl w-80 z-[301]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">Rollen verwalten</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{displayName}</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="py-1 max-h-72 overflow-y-auto">
                    {allRoles.length === 0 && (
                        <p className="text-xs text-muted-foreground px-4 py-3">Keine Rollen vorhanden</p>
                    )}
                    {allRoles.map(role => {
                        const assigned = memberRoleIds.has(role.id);
                        return (
                            <button
                                key={role.id}
                                onClick={() => toggleRole(role)}
                                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: role.color || '#99aab5' }} />
                                    <span className={`text-sm ${assigned ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                        {role.name}
                                    </span>
                                </div>
                                {assigned && <FontAwesomeIcon icon={faCheck} className="text-primary text-xs" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

export default RolePickerDialog;
