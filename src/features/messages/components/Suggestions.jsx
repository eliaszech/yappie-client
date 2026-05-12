import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { useUsersWithPresence } from "../../../hooks/useUsersWithPresence.js";
import { fetchMembers } from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";

const Suggestions = forwardRef(function Suggestions(
    { type = 'members', bottom = 'bottom-18', serverId, query, clickFunction, hideFunction, selectedIndex = 0 },
    imperativeRef
) {
    const wrapperRef = useRef(null);
    const selectedItemRef = useRef(null);

    const { users: members, isLoading } = useUsersWithPresence({
        queryKey: [type, serverId],
        fetchFunction: () => fetchMembers(type, serverId),
        getUserId: (member) => member.user.id,
    });

    const suggestionQuery = query.substring(1);
    const filteredMembers = (members ?? []).filter(member =>
        member.user.username.toLowerCase().includes(suggestionQuery.toLowerCase())
    );

    const clampedIndex = Math.min(selectedIndex, Math.max(0, filteredMembers.length - 1));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                hideFunction();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [hideFunction]);

    useImperativeHandle(imperativeRef, () => ({
        selectCurrent() {
            const member = filteredMembers[clampedIndex];
            if (member) clickFunction(member.user);
        },
    }), [filteredMembers, clampedIndex, clickFunction]);

    useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [clampedIndex]);

    if (isLoading) return <Spinner size="w-10 h-10" />;

    if (!filteredMembers.length) return null;

    return (
        <div
            ref={wrapperRef}
            onMouseDown={e => e.preventDefault()}
            className={`absolute ${bottom} w-full left-0 px-1.5`}
        >
            <div className="bg-guild-bar flex flex-col w-full text-foreground shadow-md rounded-lg py-2 px-2 max-h-48 overflow-y-auto">
                <span className="text-xs mb-2 text-muted-foreground shrink-0">
                    {suggestionQuery.length > 0 ? `Mitglieder mit ${query}` : 'Mitglieder auf diesem Server'}
                </span>
                <div className="flex flex-col gap-1">
                    {filteredMembers.map((member, index) => (
                        <div
                            key={member.userId}
                            ref={index === clampedIndex ? selectedItemRef : null}
                            onClick={() => clickFunction(member.user)}
                            className={`cursor-pointer py-1 flex items-center text-sm rounded-md px-2 transition-colors ${
                                index === clampedIndex ? 'bg-muted text-foreground' : 'hover:bg-muted/50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <UserAvatar
                                    icon={member.user.username.charAt(0).toUpperCase()}
                                    onlineSize="w-3 h-3 -bottom-1 -right-1"
                                    size="w-5 h-5"
                                />
                                {member.user.displayName ?? member.user.username}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default Suggestions;
