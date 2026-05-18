import {useQuery} from "@tanstack/react-query";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faThumbtack} from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import {useState, useRef, useEffect} from "react";
import {fetchChannelPins} from "../../../services/api.js";
import UserAvatar from "../../components/UserAvatar.jsx";
import Spinner from "../../components/static/Spinner.jsx";

function scrollToMessage(messageId) {
    const element = document.getElementById(`message-${messageId}`);
    if (!element) return;

    element.scrollIntoView({behavior: 'smooth', block: 'center'});
    element.classList.add('bg-primary/10!');
    setTimeout(() => {
        element.classList.remove('bg-primary/10!');
    }, 1500);
}

function PinsPopover({channelId}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const {data: pins = [], isLoading} = useQuery({
        queryKey: ['channelPins', channelId],
        queryFn: () => fetchChannelPins(channelId),
        enabled: open,
        staleTime: 60 * 1000,
    });

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    function onPinClick(messageId) {
        scrollToMessage(messageId);
        setOpen(false);
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(!open)}
                title="Angepinnte Nachrichten"
                className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors cursor-pointer ${open ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
            >
                <FontAwesomeIcon icon={faThumbtack} />
            </button>
            {open && (
                <div className="absolute z-50 top-full mt-2 right-0 w-96 max-h-[480px] bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-border shrink-0">
                        <h3 className="font-semibold text-foreground">Angepinnte Nachrichten</h3>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        {isLoading && <div className="p-4 flex justify-center"><Spinner size="w-6 h-6" /></div>}
                        {!isLoading && pins.length === 0 && (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                                In diesem Kanal wurden noch keine Nachrichten angepinnt.
                            </div>
                        )}
                        {!isLoading && pins.map((message) => (
                            <button
                                key={message.id}
                                onClick={() => onPinClick(message.id)}
                                className="w-full text-left px-3 py-2.5 hover:bg-muted/50 border-b border-border last:border-0 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start gap-2.5">
                                    <UserAvatar
                                        size="w-8 h-8 text-xs"
                                        displayOnline={false}
                                        avatar={message.user.avatar}
                                        icon={message.user.username.charAt(0).toUpperCase()}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                {message.user.displayName ?? message.user.username}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground shrink-0">
                                                {new Date(message.createdAt).toLocaleDateString('de-DE', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-foreground/90 break-words line-clamp-3">
                                            {message.text || '(Anhang)'}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default PinsPopover;
