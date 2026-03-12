import {useState} from "react";

function HasEmojiPicker({children, onSelect, position = 'top', orientation = 'right'}) {
    const [showEmojiSelector, setShowEmojiSelector] = useState(false);

    return (
        <div onClick={() => setShowEmojiSelector(true)} className="">
            {children}
        </div>
    )
}

export default HasEmojiPicker;