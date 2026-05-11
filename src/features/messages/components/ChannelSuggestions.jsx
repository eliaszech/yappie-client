import { forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchChannels } from '../../../services/api.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag } from '@awesome.me/kit-95376d5d61/icons/classic/regular';

const ChannelSuggestions = forwardRef(function ChannelSuggestions(
    { serverId, query, bottom = 'bottom-18', clickFunction, hideFunction, selectedIndex = 0 },
    imperativeRef
) {
    const wrapperRef = useRef(null);
    const selectedItemRef = useRef(null);

    const { data: channels = [] } = useQuery({
        queryKey: ['channels', serverId],
        queryFn: () => fetchChannels(serverId),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                hideFunction();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [hideFunction]);

    const channelQuery = query.substring(1);
    const textChannels = channels.filter(c => c.type === 'text');
    const filtered = channelQuery.length > 0
        ? textChannels.filter(c => c.name.toLowerCase().includes(channelQuery.toLowerCase()))
        : textChannels;

    const clampedIndex = Math.min(selectedIndex, Math.max(0, filtered.length - 1));

    useImperativeHandle(imperativeRef, () => ({
        selectCurrent() {
            const channel = filtered[clampedIndex];
            if (channel) clickFunction(channel);
        },
    }), [filtered, clampedIndex, clickFunction]);

    useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [clampedIndex]);

    if (!filtered.length) return null;

    return (
        <div
            ref={wrapperRef}
            onMouseDown={e => e.preventDefault()}
            className={`absolute ${bottom} w-full left-0 px-1.5`}
        >
            <div className="bg-guild-bar flex flex-col w-full text-foreground shadow-md rounded-lg py-2 px-2 max-h-48 overflow-y-auto">
                <span className="text-xs mb-2 text-muted-foreground shrink-0">
                    {channelQuery.length > 0 ? `Kanäle mit ${query}` : 'Textkanäle'}
                </span>
                <div className="flex flex-col gap-1">
                    {filtered.map((channel, index) => (
                        <div
                            key={channel.id}
                            ref={index === clampedIndex ? selectedItemRef : null}
                            onClick={() => clickFunction(channel)}
                            className={`cursor-pointer py-1 flex items-center text-sm rounded-md px-2 transition-colors ${
                                index === clampedIndex ? 'bg-muted text-foreground' : 'hover:bg-muted/50'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faHashtag} className="text-muted-foreground w-3 shrink-0" />
                                {channel.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

export default ChannelSuggestions;
