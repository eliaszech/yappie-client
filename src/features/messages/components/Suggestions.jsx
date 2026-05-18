import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { useUsersWithPresence } from "../../../hooks/useUsersWithPresence.js";
import { fetchMembers } from "../../../services/api.js";
import Spinner from "../../components/static/Spinner.jsx";
import UserAvatar from "../../components/UserAvatar.jsx";

const SPECIAL_MENTIONS = [
    { id: '__everyone__', kind: 'everyone', label: 'everyone', description: 'Benachrichtigt alle Mitglieder' },
    { id: '__here__',     kind: 'here',     label: 'here',     description: 'Benachrichtigt alle Online-Mitglieder' },
];

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

    // @everyone / @here nur in Server-Channels (type === 'members')
    const filteredSpecials = type === 'members'
        ? SPECIAL_MENTIONS.filter(s => s.label.toLowerCase().includes(suggestionQuery.toLowerCase()))
        : [];

    const combined = [
        ...filteredSpecials.map(s => ({ kind: 'special', special: s })),
        ...filteredMembers.map(m => ({ kind: 'member', member: m })),
    ];

    const clampedIndex = Math.min(selectedIndex, Math.max(0, combined.length - 1));

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
            const item = combined[clampedIndex];
            if (!item) return;
            if (item.kind === 'special') clickFunction({ special: item.special });
            else clickFunction(item.member.user);
        },
    }), [combined, clampedIndex, clickFunction]);

    useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [clampedIndex]);

    if (isLoading) return <Spinner size="w-10 h-10" />;

    if (combined.length === 0) return null;

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
                    {combined.map((item, index) => {
                        const active = index === clampedIndex;
                        const onItemClick = () => {
                            if (item.kind === 'special') clickFunction({ special: item.special });
                            else clickFunction(item.member.user);
                        };
                        return (
                            <div
                                key={item.kind === 'special' ? item.special.id : item.member.userId}
                                ref={active ? selectedItemRef : null}
                                onClick={onItemClick}
                                className={`cursor-pointer py-1 flex items-center text-sm rounded-md px-2 transition-colors ${
                                    active ? 'bg-muted text-foreground' : 'hover:bg-muted/50'
                                }`}
                            >
                                {item.kind === 'special' ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">@</div>
                                        <span className="font-semibold text-primary">@{item.special.label}</span>
                                        <span className="text-xs text-muted-foreground">{item.special.description}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <UserAvatar
                                            icon={item.member.user.username.charAt(0).toUpperCase()}
                                            avatar={item.member.user.avatar}
                                            onlineSize="w-3 h-3 -bottom-1 -right-1"
                                            size="w-5 h-5"
                                        />
                                        {item.member.user.displayName ?? item.member.user.username}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default Suggestions;
