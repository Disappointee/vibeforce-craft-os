export function getUserDisplayName(user: { first_name?: string; last_name?: string; name?: string; email?: string } | null | undefined): string {
    if (!user) return '';
    const full = [user.first_name, user.last_name].filter(Boolean).join(' ');
    if (full) return full;
    if (user.name) return user.name;
    return user.email || '';
}

export function getUserInitials(user: { first_name?: string; last_name?: string; name?: string; email?: string } | null | undefined): string {
    const display = getUserDisplayName(user);
    return display.charAt(0).toUpperCase() || '?';
}
