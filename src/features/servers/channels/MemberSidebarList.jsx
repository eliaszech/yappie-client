import {fetchMembers} from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import UserItem from "../../components/UserItem.jsx";
import {useUsersWithPresence} from "../../../hooks/useUsersWithPresence.js";
import HasUserPopup from "../../components/user/HasUserPopup.jsx";

function MemberSidebarList({serverId}) {
    const { users: members, isLoading, isError } = useUsersWithPresence({
        queryKey: ['members', serverId],
        fetchFunction: () => fetchMembers('members', serverId),
        getUserId: (member) => member.user.id,
    });

    if(isLoading) return <Spinner size="w-10 h-10" />
    if(isError) return <ErrorMessage icon={<FontAwesomeIcon icon={faUsers} />} title="Fehler beim Laden" message="Mitglieder konnten nicht geladen werden" />

    const onlineMembers = members.filter(m => m.user.online);
    const offlineMembers = members.filter(m => !m.user.online);

    return (
        <div className="flex flex-col px-2 py-4">
            {onlineMembers.length > 0 && (
                <>
                    <span className="text-sm px-2 text-foreground mb-2">Online - {onlineMembers.length}</span>
                    {onlineMembers.map((member) => (
                        <HasUserPopup user={member.user} orientation="left" key={member.userId}>
                            <UserItem user={member.user} />
                        </HasUserPopup>
                    ))}
                </>
            )}
            {offlineMembers.length > 0 && (
                <>
                    <span className="text-sm px-2 text-foreground mb-2 mt-4">Offline - {offlineMembers.length}</span>
                    {offlineMembers.map((member) => (
                        <HasUserPopup user={member.user} orientation="left" key={member.userId}>
                            <UserItem user={member.user} />
                        </HasUserPopup>
                    ))}
                </>
            )}
        </div>
    );
}
export default MemberSidebarList;