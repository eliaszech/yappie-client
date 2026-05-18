export const PERMISSIONS = {
    SEND_MESSAGES:   1 << 0,
    MANAGE_MESSAGES: 1 << 1,
    ATTACH_FILES:    1 << 2,
    CREATE_INVITES:  1 << 3,
    KICK_MEMBERS:    1 << 4,
    BAN_MEMBERS:     1 << 5,
    MANAGE_CHANNELS: 1 << 6,
    MANAGE_SERVER:   1 << 7,
    ADMINISTRATOR:   1 << 8,
};

export function hasPermission(server, flag) {
    if (!server) return false;
    if (server.isOwner) return true;
    const perm = server.permissions ?? 0;
    if ((perm & PERMISSIONS.ADMINISTRATOR) !== 0) return true;
    return (perm & flag) !== 0;
}
