import { useState, useRef, useEffect } from "react";
import EmojiPicker from "./EmojiPicker.jsx";

const POSITION_CLASSES = {
    top: 'bottom-full mb-0',
    bottom: 'top-full mt-2',
};

const ORIENTATION_CLASSES = {
    right: 'right-0',
    left: 'left-0',
};

function HasEmojiPicker({ children, onSelect, position = 'top', orientation = 'right' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handle = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [open]);

    return (
        <div ref={ref} className="relative" onClick={() => setOpen(v => !v)}>
            {children}
            {open && (
                <div
                    className={`absolute z-50 ${POSITION_CLASSES[position] ?? POSITION_CLASSES.top} ${ORIENTATION_CLASSES[orientation] ?? ORIENTATION_CLASSES.right}`}
                    onClick={e => e.stopPropagation()}
                >
                    <EmojiPicker onSelect={onSelect} onClose={() => setOpen(false)} />
                </div>
            )}
        </div>
    );
}

export default HasEmojiPicker;
