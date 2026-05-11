import { useQuery } from "@tanstack/react-query";
import { fetchMembers, fetchRoles } from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers } from "@awesome.me/kit-95376d5d61/icons/classic/light";
import UserItem from "../../components/UserItem.jsx";
import { useUsersWithPresence } from "../../../hooks/useUsersWithPresence.js";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";

function MemberSidebarList({ serverId }) {
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

    return (
        <div className="flex flex-col px-2 py-4 gap-1">
            {grouped.map(({ role, members: roleMembers }) => (
                <div key={role.id} className="mb-1">
                    <div className="flex items-center gap-1.5 px-2 py-1">
                        <span
                            className="text-[11px] font-semibold uppercase tracking-wider"
                            style={{ color: role.color || '#99aab5' }}
                        >
                            {role.name} — {roleMembers.length}
                        </span>
                    </div>
                    {roleMembers.map(member => (
                        <HasUserPopup user={member.user} orientation="left" key={member.userId ?? member.user.id} roles={member.roles}>
                            <UserItem serverMember={member} color={role.color} />
                        </HasUserPopup>
                    ))}
                </div>
            ))}

            {ungroupedOnline.length > 0 && (
                <div className="mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 text-muted-foreground block">
                        Online — {ungroupedOnline.length}
                    </span>
                    {ungroupedOnline.map(member => (
                        <HasUserPopup user={member.user} orientation="left" key={member.userId ?? member.user.id} roles={member.roles}>
                            <UserItem serverMember={member} />
                        </HasUserPopup>
                    ))}
                </div>
            )}

            {offlineMembers.length > 0 && (
                <div className="mt-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 text-muted-foreground block">
                        Offline — {offlineMembers.length}
                    </span>
                    {offlineMembers.map(member => (
                        <HasUserPopup user={member.user} orientation="left" key={member.userId ?? member.user.id} roles={member.roles}>
                            <UserItem serverMember={member} />
                        </HasUserPopup>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MemberSidebarList;
