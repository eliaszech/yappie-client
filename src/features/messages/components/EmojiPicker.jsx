import { useState, useEffect, useRef, useCallback } from "react";

const CATEGORIES = [
    {
        id: "frequent",
        label: "Häufig verwendet",
        icon: "🕐",
        emojis: ["👍","🔥","😂","❤️","😍","👏","🎉","🤣","😭","🙏","😊","💯","🥺","✨","🤔","😎","🤯","💀","😩","🤌"]
    },
    {
        id: "smileys",
        label: "Smileys & Personen",
        icon: "😀",
        emojis: [
            "😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍",
            "🤩","😘","😗","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫",
            "🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤",
            "😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸",
            "😎","🤓","🧐","😕","😟","🙁","☹️","😮","😯","😲","😳","🥺","😦","😧","😨",
            "😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬",
            "😈","👿","💀","☠️","💩","🤡","👹","👺","👻","👽","👾","🤖"
        ]
    },
    {
        id: "gestures",
        label: "Gesten & Körper",
        icon: "👋",
        emojis: [
            "👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙",
            "👈","👉","👆","🖕","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","👐","🤲","🤝","🙏",
            "💪","🦾","🦿","🦵","🦶","👂","🦻","👃","👀","👁️","👅","👄"
        ]
    },
    {
        id: "symbols",
        label: "Herzen & Symbole",
        icon: "❤️",
        emojis: [
            "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❤️‍🔥","❤️‍🩹",
            "💯","🔥","✨","💥","🎉","🎊","🎈","🎁","🏆","⭐","🌟","💫","✅","❌","❓","❗","‼️",
            "💬","💭","🔔","🚫","⛔","🔆","🔅","🆘","♻️","🔱","⚜️","🏳️","🏴","🚩","🏁"
        ]
    },
    {
        id: "animals",
        label: "Tiere & Natur",
        icon: "🐶",
        emojis: [
            "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵",
            "🐔","🐧","🐦","🦆","🦅","🦉","🦇","🐝","🦋","🐌","🐞","🐜","🐢","🐍","🦎",
            "🐙","🦑","🐡","🐠","🐟","🐬","🐳","🦈","🐊","🦓","🦍","🦧","🐘","🦏","🐪"
        ]
    },
    {
        id: "food",
        label: "Essen & Trinken",
        icon: "🍎",
        emojis: [
            "🍎","🍊","🍋","🍇","🍓","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🥑","🌽","🌶️",
            "🍔","🍟","🌮","🌯","🍕","🍜","🍝","🍣","🍱","🍤","🍦","🍧","🍨","🎂","🍰",
            "🍭","🍬","🍫","🍿","🍩","🍪","☕","🍵","🧃","🥤","🧋","🍺","🍻","🥂","🍷"
        ]
    },
    {
        id: "activities",
        label: "Aktivitäten",
        icon: "⚽",
        emojis: [
            "⚽","🏀","🏈","⚾","🎾","🏐","🎱","🎯","🎮","🕹️","🎲","♟️","🎭","🎨","🎬",
            "🎤","🎧","🎼","🎵","🎶","🎷","🎸","🎹","🎺","🎻","🥁","🚀","✈️","🚗","🚢",
            "🏖️","🏕️","🗺️","🌍","🌎","🌏","🌋","🏔️","⛰️","🗻","🏞️"
        ]
    }
];

function EmojiPicker({ onSelect, onClose }) {
    const [activeCategory, setActiveCategory] = useState(0);
    const [search, setSearch] = useState('');
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
        const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const filteredEmojis = CATEGORIES[activeCategory].emojis;

    const handleSelect = useCallback((emoji) => {
        onSelect(emoji);
        onClose();
    }, [onSelect, onClose]);

    return (
        <div className="flex flex-col bg-guild-bar border border-border rounded-lg shadow-2xl overflow-hidden" style={{ width: 320 }} onClick={e => e.stopPropagation()}>
            {/* Body */}
            <div className="flex" style={{ height: 300 }}>
                {/* Category sidebar */}
                {!search && (
                    <div className="flex flex-col border-r border-border py-1 overflow-y-auto" style={{ width: 40 }}>
                        {CATEGORIES.map((cat, i) => (
                            <button
                                key={cat.id}
                                title={cat.label}
                                onClick={() => setActiveCategory(i)}
                                className={`relative flex-shrink-0 flex items-center justify-center text-lg transition-colors cursor-pointer h-9 w-full ${
                                    activeCategory === i
                                        ? 'text-foreground bg-muted/80'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                                }`}
                            >
                                {activeCategory === i && (
                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-r-full" />
                                )}
                                {cat.icon}
                            </button>
                        ))}
                    </div>
                )}

                {/* Emoji grid */}
                <div className="flex flex-col">
                    {!search && (
                        <div className="px-2.5 pt-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-widest flex-shrink-0">
                            {CATEGORIES[activeCategory].label}
                        </div>
                    )}
                    <div className="grid grid-cols-7 h-max gap-0.5 px-1.5 pb-1.5 overflow-y-auto">
                        {filteredEmojis.length > 0 ? (
                            filteredEmojis.map((emoji, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSelect(emoji)}
                                    className="text-xl flex items-center justify-center rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                    style={{ width: 36, height: 36 }}
                                >
                                    {emoji}
                                </button>
                            ))
                        ) : (
                            <div className="col-span-7 flex items-center justify-center text-muted-foreground text-sm py-6">
                                Keine Emojis gefunden
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EmojiPicker;
