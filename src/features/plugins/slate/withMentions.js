import { Editor, Transforms, Range, Element } from 'slate';

export function withMentions(editor) {
    const { isInline, isVoid } = editor;

    editor.isInline = (element) => {
        return element.type === 'mention' ? true : isInline(element);
    };

    editor.isVoid = (element) => {
        return element.type === 'mention' ? true : isVoid(element);
    };

    return editor;
}