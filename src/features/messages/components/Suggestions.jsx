import {fetchMembers} from "../../../services/api.js";
import {useUsersWithPresence} from "../../../hooks/useUsersWithPresence.js";
import Spinner from "../../components/static/Spinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";
import {useEffect, useRef} from "react";

function Suggestions({type = 'members', bottom = 'bottom-18', serverId, query, clickFunction, hideFunction}) {
    const ref = useRef(null);

    const { users: members, isLoading, isError } = useUsersWithPresence({
        queryKey: [type, serverId],
        fetchFunction: () => fetchMembers(type, serverId),
        getUserId: (member) => member.user.id,
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                hideFunction();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    })

    function selectMember(member) {
        clickFunction(member);
    }

    if(isLoading) return <Spinner size="w-10 h-10" />

    const suggestionQuery = query.substring(1);
    const filteredMembers = members.filter(member => member.user.username.toLowerCase().includes(suggestionQuery.toLowerCase()));

    return (
        <div ref={ref} className={`absolute ${bottom} w-full left-0 px-1.5`}>
            <div className="bg-guild-bar flex flex-col w-full text-foreground shadow-md rounded-lg py-2 px-2">
                <span className="text-xs mb-2">
                    {suggestionQuery.length > 0 ? 'Mitglieder mit ' + query : 'Mitglieder auf diesem Server'}
                </span>
                <div className="flex flex-col gap-1">
                    {filteredMembers.map((member) => (
                        <div key={member.userId} onClick={() => selectMember(member.user)} className="cursor-pointer py-1 flex items-center text-sm rounded-md hover:bg-muted/50 px-2">
                            <div className="flex items-center gap-2">
                                <UserAvatar icon={member.user.username.charAt(0).toUpperCase()} onlineSize="w-3 h-3 -bottom-1 -right-1" size="w-5 h-5" />
                                {member.user.displayName ?? member.user.username}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Suggestions;