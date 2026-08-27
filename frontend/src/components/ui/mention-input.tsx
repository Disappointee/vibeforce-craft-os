'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import { UserRecord } from '@/lib/pocketbase-types';
import { Loader2 } from 'lucide-react';

interface MentionInputProps {
    value: string;
    onChange: (value: string, mentionedUserIds: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
    minRows?: number;
}

export function MentionInput({
    value,
    onChange,
    placeholder = 'Schreibe einen Kommentar...',
    disabled = false,
    minRows = 2,
}: MentionInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionResults, setMentionResults] = useState<UserRecord[]>([]);
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionStartPos, setMentionStartPos] = useState(-1);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

    // Fetch users for mention autocomplete
    const searchUsers = useCallback(async (query: string) => {
        if (!query || query.length < 1) {
            setMentionResults([]);
            return;
        }

        setIsSearchingUsers(true);
        try {
            const result = await pb.collection('users').getList(1, 8, {
                filter: pb.filter('name ~ {:q} || email ~ {:q}', { q: query }),
                sort: 'name',
            });
            setMentionResults(result.items as UserRecord[]);
        } catch (error) {
            console.error('Failed to search users:', error);
            setMentionResults([]);
        } finally {
            setIsSearchingUsers(false);
        }
    }, []);

    // Handle input changes and detect @ mentions
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart;

        // Find if we're typing a mention
        const textBeforeCursor = newValue.substring(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf('@');

        if (atIndex !== -1) {
            // Check if there's a space before @ or it's at the start
            const charBeforeAt = atIndex > 0 ? textBeforeCursor[atIndex - 1] : ' ';
            if (charBeforeAt === ' ' || charBeforeAt === '\n' || atIndex === 0) {
                const searchText = textBeforeCursor.substring(atIndex + 1);
                // Only show dropdown if there's no space in the search text
                if (!searchText.includes(' ')) {
                    setMentionSearch(searchText);
                    setShowMentionDropdown(true);
                    setMentionStartPos(atIndex);
                    searchUsers(searchText);
                } else {
                    setShowMentionDropdown(false);
                }
            } else {
                setShowMentionDropdown(false);
            }
        } else {
            setShowMentionDropdown(false);
        }

        // Extract all @username mentions from the full text to track mentioned user IDs
        // We'll update mentionedUserIds when a mention is selected
        onChange(newValue, mentionedUserIds);
    };

    // Handle selecting a user from the mention dropdown
    const handleSelectMention = (user: UserRecord) => {
        if (!textareaRef.current) return;

        const currentValue = value;
        const beforeMention = currentValue.substring(0, mentionStartPos);
        const afterMention = currentValue.substring(textareaRef.current.selectionStart || mentionStartPos + mentionSearch.length + 1);

        const mentionText = `@${user.name || user.email} `;
        const newValue = beforeMention + mentionText + afterMention;

        // Track mentioned user ID
        const newMentionedIds = [...mentionedUserIds];
        if (!newMentionedIds.includes(user.id)) {
            newMentionedIds.push(user.id);
        }
        setMentionedUserIds(newMentionedIds);

        onChange(newValue, newMentionedIds);
        setShowMentionDropdown(false);

        // Set cursor position after the inserted mention
        const newCursorPos = mentionStartPos + mentionText.length;
        requestAnimationFrame(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        });
    };

    // Handle keyboard navigation in dropdown
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showMentionDropdown && mentionResults.length > 0) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                const items = dropdownRef.current?.querySelectorAll('[data-mention-item]');
                if (!items) return;
                const currentIndex = Array.from(items).findIndex((item) =>
                    item.getAttribute('data-selected') === 'true'
                );
                let nextIndex;
                if (e.key === 'ArrowDown') {
                    nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
                } else {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
                }
                items.forEach((item, i) => {
                    item.setAttribute('data-selected', i === nextIndex ? 'true' : 'false');
                });
                (items[nextIndex] as HTMLElement)?.scrollIntoView({ block: 'nearest' });
                return;
            }

            if (e.key === 'Enter' && mentionResults.length > 0) {
                e.preventDefault();
                const selected = dropdownRef.current?.querySelector('[data-mention-item][data-selected="true"]');
                if (selected) {
                    const userId = selected.getAttribute('data-user-id');
                    const user = mentionResults.find((u) => u.id === userId);
                    if (user) {
                        handleSelectMention(user);
                    }
                } else {
                    handleSelectMention(mentionResults[0]);
                }
                return;
            }
        }

        // Escape to close dropdown
        if (e.key === 'Escape') {
            setShowMentionDropdown(false);
        }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(e.target as Node)
            ) {
                setShowMentionDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.max(
                textareaRef.current.scrollHeight,
                minRows * 24
            )}px`;
        }
    }, [value, minRows]);

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={minRows}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Mention Dropdown */}
            {showMentionDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute bottom-full left-0 mb-1 w-64 max-h-48 overflow-y-auto rounded-lg border border-border bg-background shadow-xl z-50"
                >
                    {isSearchingUsers ? (
                        <div className="flex items-center justify-center py-3">
                            <Loader2 size={16} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : mentionResults.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                            {mentionSearch ? 'Keine Benutzer gefunden' : 'Gib einen Namen ein...'}
                        </div>
                    ) : (
                        mentionResults.map((user, index) => (
                            <button
                                key={user.id}
                                data-mention-item
                                data-user-id={user.id}
                                data-selected={index === 0 ? 'true' : 'false'}
                                onClick={() => handleSelectMention(user)}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-foreground hover:bg-card transition-colors text-left data-[selected=true]:bg-card"
                            >
                                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-medium flex-shrink-0">
                                    {(user.name || user.email || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="block truncate font-medium">
                                        {user.name || 'Unbekannt'}
                                    </span>
                                    <span className="block text-xs text-muted-foreground truncate">
                                        {user.email}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
