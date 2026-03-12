import {toggleReaction} from "../../../hooks/messages/useReactMessage.js";
import {useAuth} from "../../../hooks/useAuth.js";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFaceSmilePlus} from "@awesome.me/kit-95376d5d61/icons/classic/solid";

function Reactions({message, disabled = false}) {
    const { user } = useAuth();

    const groupedReactions = (message.reactions || []).reduce((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = [];
        acc[r.emoji].push(r.userId);
        return acc;
    }, {});

    return <>
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
            <div className="flex gap-1 my-1">
                {Object.entries(groupedReactions).map(([emoji, userIds]) => (
                    <button
                        key={emoji}
                        onClick={() => toggleReaction(message.id, emoji)}
                        className={`flex cursor-pointer items-center gap-1 px-2 py-0.5 rounded-lg text-base ${
                            userIds.includes(user.id)
                                ? 'bg-primary/10 hover:bg-primary/20'
                                : 'bg-card hover:bg-muted'
                        }`}
                    >
                        <span>{emoji}</span>
                        <span className="text-foreground">{userIds.length}</span>
                    </button>
                ))}
                {!disabled && Object.entries(groupedReactions).length > 0 && (
                    <button className={`flex cursor-pointer items-center w-max text-muted-foreground gap-1 px-2 py-0.5 rounded-lg text-base bg-card hover:bg-muted`}>
                        <FontAwesomeIcon icon={faFaceSmilePlus} />
                    </button>
                )}
            </div>
        )}

    </>
}
export default Reactions;