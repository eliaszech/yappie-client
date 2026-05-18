import { forwardRef, useImperativeHandle, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlash } from "@awesome.me/kit-95376d5d61/icons/classic/solid";
import { findSlashCommands } from "../slashCommands.js";

const SlashCommandSuggestions = forwardRef(function SlashCommandSuggestions(
    { query, bottom = 'bottom-18', selectedIndex = 0, clickFunction, hideFunction },
    imperativeRef
) {
    const wrapperRef = useRef(null);
    const selectedItemRef = useRef(null);

    const commands = findSlashCommands(query);
    const clampedIndex = Math.min(selectedIndex, Math.max(0, commands.length - 1));

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
            const cmd = commands[clampedIndex];
            if (cmd) clickFunction(cmd);
        },
    }), [commands, clampedIndex, clickFunction]);

    useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ block: 'nearest' });
    }, [clampedIndex]);

    if (commands.length === 0) return null;

    return (
        <div
            ref={wrapperRef}
            onMouseDown={e => e.preventDefault()}
            className={`absolute ${bottom} w-full left-0 px-1.5`}
        >
            <div className="bg-guild-bar flex flex-col w-full text-foreground shadow-md rounded-lg py-2 px-2 max-h-60 overflow-y-auto">
                <span className="text-xs mb-2 text-muted-foreground shrink-0">Befehle</span>
                <div className="flex flex-col gap-1">
                    {commands.map((cmd, index) => {
                        const active = index === clampedIndex;
                        return (
                            <div
                                key={cmd.name}
                                ref={active ? selectedItemRef : null}
                                onClick={() => clickFunction(cmd)}
                                className={`cursor-pointer py-1 px-2 flex items-center gap-3 rounded-md transition-colors ${
                                    active ? 'bg-muted text-foreground' : 'hover:bg-muted/50'
                                }`}
                            >
                                <div className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                    <FontAwesomeIcon icon={faSlash} className="text-xs" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-mono text-foreground">{cmd.usage}</span>
                                    <span className="text-xs text-muted-foreground truncate">{cmd.description}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
});

export default SlashCommandSuggestions;
