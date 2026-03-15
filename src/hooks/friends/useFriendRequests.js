import {useQueryClient} from "@tanstack/react-query";
import {useEffect} from "react";
import {onFriendRequest} from "../../services/socket.js";

export function useFriendRequests() {
    const queryClient = useQueryClient();

    useEffect(() => {
        onFriendRequest((type, friendRequest) => {
            if(type === 'new') {
                queryClient.setQueryData(['friends'], (old) => {
                    if (!old) return old;

                    return [...old, friendRequest];
                })
            }

            if(type === 'declined') {
                queryClient.setQueryData(['friends'], (old) => {
                    if (!old) return old;

                    return old.filter(f => f.friendId !== friendRequest);
                })
            }

            if(type === 'accepted') {
                console.log('Friend request accepted:', friendRequest);
                queryClient.setQueryData(['friends'], (old) => {
                    if (!old) return old;

                    return old.map(f => {
                        if(f.friendId === friendRequest) {
                            return {...f, friendStatus: 'ACCEPTED'};
                        }
                        return f;
                    })
                })
            }
        })
    })
}