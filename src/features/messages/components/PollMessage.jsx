import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faSquarePollVertical } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { useAuth } from "../../../hooks/useAuth.js";
import { votePoll, removePollVote } from "../../../services/api.js";
import { useQueryClient } from "@tanstack/react-query";

export default function PollMessage({ message }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const poll = message.poll;

    const { totalVotes, voteByOption, myVotes } = useMemo(() => {
        const voteByOption = new Map();
        const myVotes = new Set();
        for (const v of poll?.votes ?? []) {
            voteByOption.set(v.optionId, (voteByOption.get(v.optionId) ?? 0) + 1);
            if (v.userId === user?.id) myVotes.add(v.optionId);
        }
        return {
            totalVotes: (poll?.votes ?? []).length,
            voteByOption,
            myVotes,
        };
    }, [poll, user?.id]);

    if (!poll) return null;

    const roomId = message.conversationId || message.channelId;

    function patchPollInCache(updatedPoll) {
        if (!updatedPoll) return;
        queryClient.setQueryData(['messages', roomId], (old) => {
            if (!old) return old;
            return {
                ...old,
                messages: old.messages.map(m =>
                    m.id === message.id ? { ...m, poll: updatedPoll } : m
                ),
            };
        });
    }

    async function handleVote(optionId) {
        if (message.pending) return;
        const alreadyVoted = myVotes.has(optionId);

        if (alreadyVoted) {
            const res = await removePollVote(poll.id, optionId);
            if (!res?.error) patchPollInCache(res);
            return;
        }

        const res = await votePoll(poll.id, optionId);
        if (!res?.error) patchPollInCache(res);
    }

    return (
        <div className="mt-1 max-w-xl bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <FontAwesomeIcon icon={faSquarePollVertical} />
                Umfrage {poll.multipleChoice && <span className="normal-case tracking-normal text-[10px]">(Mehrfachauswahl)</span>}
            </div>
            <h3 className="text-base font-semibold text-foreground">{poll.question}</h3>
            <div className="flex flex-col gap-2">
                {poll.options.map(opt => {
                    const count = voteByOption.get(opt.id) ?? 0;
                    const percent = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
                    const isMine = myVotes.has(opt.id);
                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleVote(opt.id)}
                            disabled={message.pending}
                            className={`relative w-full text-left rounded-lg border transition-colors px-3 py-2 group ${
                                isMine
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border bg-muted/30 hover:bg-muted/50 cursor-pointer'
                            }`}
                        >
                            <div
                                className={`absolute inset-0 rounded-lg ${isMine ? 'bg-primary/15' : 'bg-foreground/5'}`}
                                style={{ width: `${percent}%`, transition: 'width 200ms ease' }}
                                aria-hidden="true"
                            />
                            <div className="relative flex items-center gap-2">
                                {isMine && <FontAwesomeIcon icon={faCheckCircle} className="text-primary text-sm" />}
                                <span className="flex-1 text-sm text-foreground">{opt.text}</span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {count} · {percent}%
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
            <div className="text-xs text-muted-foreground">
                {totalVotes === 0 ? 'Noch keine Stimmen' : `${totalVotes} Stimme${totalVotes === 1 ? '' : 'n'}`}
            </div>
        </div>
    );
}
