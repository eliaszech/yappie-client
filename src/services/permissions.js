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
    PIN_MESSAGES:    1 << 9,
    MANAGE_INVITES:  1 << 10,
    MANAGE_ROLES:    1 << 11,
    MANAGE_EMOJIS:   1 << 12,
};

// True if I can act on (edit, assign, delete) a role given my server context.
// Owner can also edit the Owner role itself (name/color/hoist; permissions are
// always pinned). ADMINISTRATOR bypasses the hierarchy check for every other
// role but cannot touch the Owner role.
export function canActOnRole(server, role) {
    if (!server || !role) return false;
    if (role.isOwnerRole) return !!server.isOwner;
    if (server.isOwner) return true;
    const perms = server.permissions ?? 0;
    if ((perms & PERMISSIONS.ADMINISTRATOR) !== 0) return true;
    const my = server.highestPosition ?? 0;
    return my > (role.position ?? 0);
}

export function hasPermission(server, flag) {
    if (!server) return false;
    if (server.isOwner) return true;
    const perm = server.permissions ?? 0;
    if ((perm & PERMISSIONS.ADMINISTRATOR) !== 0) return true;
    return (perm & flag) !== 0;
}
