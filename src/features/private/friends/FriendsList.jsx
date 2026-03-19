import {useTranslation} from "react-i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSearch} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {AnimatePresence, motion} from "framer-motion";
import {faTimes} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import Spinner from "../../components/static/Spinner.jsx";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {useState} from "react";
import NoResultsMessage from "../../components/static/NoResultsMessage.jsx";
import UserItem from "../../components/UserItem.jsx";
import {useUsersWithPresence} from "../../../hooks/useUsersWithPresence.js";
import {fetchFriends} from "../../../services/api.js";
import FriendUserItem from "../../components/FriendUserItem.jsx";

function FriendsList({filter}) {
    const { users, isLoading, isError } = useUsersWithPresence({
        queryKey: ['friends'],
        fetchFunction: () => fetchFriends(),
        getUserId: (user) => user.id,
    });
    const [search, setSearch] = useState('');

    const filteredUsers = users.filter(user => ((user.online && filter === 'online') || filter === 'all') && user.friendStatus === 'ACCEPTED')
        .filter(user => user.username.toLowerCase().includes(search.toLowerCase()));

    const {t} = useTranslation();

    if (isLoading) return <Spinner size="w-10 h-10" />;
    if(isError) return <ErrorMessage message="Benutzer konnten nicht geladen werden" icon={<FontAwesomeIcon icon={faUsers} />} />;

    return (
        <div className="flex flex-col h-full overflow-hidden pt-4">
            <div className="relative flex items-center w-full mb-6 px-4">
                <FontAwesomeIcon icon={faSearch}
                                 className="absolute left-5.5 pointer-events-none text-muted-foreground"/>
                <input
                    className="pl-8 pr-2.5 py-2 w-full rounded-lg border border-border outline-none bg-input text-sm focus:ring-2 focus:ring-primary/80 text-foreground placeholder:text-muted-foreground!"
                    placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)}/>
                <button onClick={() => setSearch('')}
                    className={`${search !== '' ? '' : 'hidden'} absolute right-5.5 rounded-full w-6 h-6 bg-transparent cursor-pointer text-muted-foreground hover:text-foreground transition-colors`}>
                    <FontAwesomeIcon icon={faTimes} />
                </button>
            </div>
            <div className="flex flex-col h-full overflow-y-auto scrollbar px-4">
                {filteredUsers.length > 0 ? (
                    <>
                        <span className="text-sm font-semibold uppercase tracking-wide text-foreground mb-2">
                            {t('messages.friends.filters.texts.' + filter.toLowerCase()) + ' - ' + filteredUsers.length}
                        </span>
                        <div className="flex flex-col divide-y divide-border">
                            <AnimatePresence mode="popLayout">
                                {filteredUsers.map((friend) => (
                                    <motion.div
                                        key={friend.id}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -50 }}
                                        transition={{ duration: 0.25 }}
                                    >
                                        <FriendUserItem friend={friend} paddings={'px-2 py-2'} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <NoResultsMessage title="Keine Freunde"
                        message={filter === 'online' ? t('messages.friends.empty.online') : t('messages.friends.empty.all')}
                        icon={<FontAwesomeIcon icon={faUsers} />}/>
                )}
            </div>
        </div>
    )
}

export default FriendsList;