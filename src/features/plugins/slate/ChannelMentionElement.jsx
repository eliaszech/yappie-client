function ChannelMentionElement({ attributes, children, element }) {
    return (
        <span
            {...attributes}
            contentEditable={false}
            className="bg-primary/20 text-primary rounded px-1 font-medium"
        >
            #{element.channelName}
            {children}
        </span>
    );
}

export default ChannelMentionElement;
