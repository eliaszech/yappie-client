function MentionElement({ attributes, children, element }) {
    const label = element.kind === 'everyone' ? 'everyone'
        : element.kind === 'here' ? 'here'
        : element.username;

    return (
        <span
            {...attributes}
            contentEditable={false}
            className="bg-primary/20 text-primary rounded px-1 font-medium"
        >
            @{label}
            {children}
        </span>
    );
}

export default MentionElement;