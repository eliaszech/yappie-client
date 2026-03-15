import {useTranslation} from "react-i18next";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowRight, faSearch} from "@awesome.me/kit-95376d5d61/icons/classic/regular";
import {faArrowLeft, faUsers} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import {AnimatePresence, motion} from "framer-motion";
import {faTimes} from "@awesome.me/kit-95376d5d61/icons/classic/light";
import Spinner from "../../components/static/Spinner.jsx";
import ErrorMessage from "../../components/static/ErrorMessage.jsx";
import {useState} from "react";
import NoResultsMessage from "../../components/static/NoResultsMessage.jsx";
import UserItem from "../../components/UserItem.jsx";
import {useUsersWithPresence} from "../../../hooks/useUsersWithPresence.js";
import {fetchFriends, fetchGetOrCreateConversation} from "../../../services/api.js";
import {useAuth} from "../../../hooks/useAuth.js";
import {useQueryClient} from "@tanstack/react-query";
import {useNavigate} from "react-router-dom";
import UserAvatar from "../../components/UserAvatar.jsx";

function FriendsListPending({filter}) {
    const { user } = useAuth();
    const { users, isLoading, isError } = useUsersWithPresence({
        queryKey: ['friends'],
        fetchFunction: () => fetchFriends(),
        getUserId: (user) => user.id,
    });
    const [search, setSearch] = useState('');

    function denyFriendRequest(friendId) {

    }

    function acceptFriendRequest(friendId) {

    }

    if (isLoading) return <Spinner size="w-10 h-10" />;
    if(isError) return <ErrorMessage title="Fehler beim Laden der Benutzer" message="Benutzer konnten nicht geladen werden" icon={<FontAwesomeIcon icon={faUsers} />} />;

    const filteredUsers = users.filter(user => (user.friendStatus === 'PENDING'))
        .filter(user => user.username.toLowerCase().includes(search.toLowerCase()));

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
                            {'Ausstehende Freundesanfragen - ' + filteredUsers.length}
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
                                        <div key={friend.id} className={`flex items-center group justify-between gap-3 px-2 py-2 rounded-md hover:bg-border transition duration-200`}>
                                            <div className="flex items-center gap-3">
                                                {friend.isSender ? (
                                                    <FontAwesomeIcon icon={faArrowLeft} className="text-red-400 text-lg" />
                                                ) : (
                                                    <FontAwesomeIcon icon={faArrowRight} className="text-green-300 text-lg" />
                                                )}
                                                <UserAvatar icon={friend.username.charAt(0).toUpperCase()} displayOnline={false} />
                                                <div className="flex flex-col">
                                                    <span className="text-foreground font-medium">{friend.displayName ?? friend.username}</span>
                                                    <span className="text-muted-foreground text-xs">{friend.username}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button disabled={friend.isSender} className={`${friend.isSender ? 'disabled bg-card text-muted-foreground' : 'cursor-pointer bg-green-300 text-primary-foreground hover:bg-green-200'} text-sm block rounded-lg  px-2 py-1`}>
                                                    {friend.isSender ? 'Angefragt' : 'Annehmen' }
                                                </button>
                                                {!friend.isSender && (
                                                    <button className={`cursor-pointer bg-red-400 hover:bg-red-300 text-primary-foreground text-sm block rounded-lg  px-2 py-1`}>
                                                        Ablehnen
                                                    </button>
                                                )}
                                                {friend.isSender && (
                                                    <button className="cursor-pointer hover:bg-red-300 bg-red-400 px-1 py-1 rounded-lg text-sm text-primary-foreground">
                                                        <FontAwesomeIcon icon={faTimes} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <NoResultsMessage title="Keine Anfragen"
                        message="Es gibt keine ausstehenden Freundesanfragen"
                        icon={<FontAwesomeIcon icon={faUsers} />}/>
                )}
            </div>
        </div>
    )
}

export default FriendsListPending;