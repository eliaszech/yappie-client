import { Editor, Transforms, Range, Element } from 'slate';

export function withMentions(editor) {
    const { isInline, isVoid } = editor;

    editor.isInline = (element) => {
        return element.type === 'mention' || element.type === 'channel-mention' ? true : isInline(element);
    };

    editor.isVoid = (element) => {
        return element.type === 'mention' || element.type === 'channel-mention' ? true : isVoid(element);
    };

    return editor;
}