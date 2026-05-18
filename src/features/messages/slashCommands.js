// Slash-command definitions. Each command declares how to transform the
// outgoing message (or which dialog to open). Triggered from MessageInput
// when the user types `/<name>` at the start of an otherwise-empty line.

const SHRUG = '¯\\_(ツ)_/¯';
const TABLEFLIP = '(╯°□°)╯︵ ┻━┻';
const UNFLIP = '┬─┬ノ( º _ ºノ)';

export const SLASH_COMMANDS = [
    {
        name: 'me',
        usage: '/me <Aktion>',
        description: 'Sendet eine Aktion in der dritten Person',
        // Resolved client-side into a regular text message with a leading "*".
        run: ({ args }) => ({
            kind: 'send-text',
            text: `* ${args}`.trim(),
        }),
        requiresArgs: true,
    },
    {
        name: 'shrug',
        usage: '/shrug [Text]',
        description: 'Sendet ein Schulterzucken',
        run: ({ args }) => ({
            kind: 'send-text',
            text: args ? `${args} ${SHRUG}` : SHRUG,
        }),
    },
    {
        name: 'tableflip',
        usage: '/tableflip [Text]',
        description: 'Wirft den Tisch um',
        run: ({ args }) => ({
            kind: 'send-text',
            text: args ? `${args} ${TABLEFLIP}` : TABLEFLIP,
        }),
    },
    {
        name: 'unflip',
        usage: '/unflip [Text]',
        description: 'Stellt den Tisch zurück',
        run: ({ args }) => ({
            kind: 'send-text',
            text: args ? `${args} ${UNFLIP}` : UNFLIP,
        }),
    },
    {
        name: 'poll',
        usage: '/poll [Frage]',
        description: 'Startet eine Umfrage',
        run: ({ args }) => ({
            kind: 'open-poll',
            question: args,
        }),
    },
];

export function findSlashCommands(query) {
    const q = (query || '').toLowerCase();
    return SLASH_COMMANDS.filter(c => c.name.startsWith(q));
}

// Parses "/poll Welche Pizza?" → { name: 'poll', args: 'Welche Pizza?' }
// Returns null if the text doesn't start with a slash command.
export function parseSlashInvocation(text) {
    const match = /^\/(\w+)(?:\s+(.*))?$/s.exec(text);
    if (!match) return null;
    const name = match[1].toLowerCase();
    const def = SLASH_COMMANDS.find(c => c.name === name);
    if (!def) return null;
    return { def, args: (match[2] ?? '').trim() };
}
