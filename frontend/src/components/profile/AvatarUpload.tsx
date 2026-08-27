'use client';

import { useState, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { updateAvatarAction, removeAvatarAction } from '@/app/actions/profile';

interface AvatarUploadProps {
    userId: string;
    currentAvatar?: string;
    userName?: string;
    onAvatarUpdate: (url: string) => void;
}

export function AvatarUpload({ userId, currentAvatar, userName, onAvatarUpdate }: AvatarUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const avatarUrl = currentAvatar
        ? pb.files.getURL({ id: userId } as any, currentAvatar, { thumb: '256x256' })
        : null;

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.type)) {
            toast.error('Ungültiges Dateiformat. Erlaubt: JPEG, PNG, WebP, SVG');
            return;
        }

        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('Datei zu groß. Maximal 2 MB erlaubt.');
            return;
        }

        // Show local preview
        const reader = new FileReader();
        reader.onload = (event) => {
            setPreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to PocketBase
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('avatar', file);

            const result = await updateAvatarAction(formData);
            if (result.success) {
                onAvatarUpdate(result.url);
                setPreview(null);
                toast.success('Avatar erfolgreich aktualisiert');
            } else {
                throw new Error('Upload fehlgeschlagen');
            }
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            toast.error(error?.message || 'Fehler beim Hochladen des Avatars');
            setPreview(null);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveAvatar = async () => {
        setUploading(true);
        try {
            const result = await removeAvatarAction();
            if (result.success) {
                onAvatarUpdate('');
                toast.success('Avatar entfernt');
            } else {
                throw new Error('Remove fehlgeschlagen');
            }
        } catch (error: any) {
            console.error('Avatar remove error:', error);
            toast.error(error?.message || 'Fehler beim Entfernen des Avatars');
        } finally {
            setUploading(false);
        }
    };

    const initials = (userName || 'A').charAt(0).toUpperCase();

    return (
        <div className="flex items-center gap-6">
            {/* Avatar Preview */}
            <div className="relative group">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center ring-2 ring-white/10">
                    {preview ? (
                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                    ) : avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-3xl font-bold text-foreground">{initials}</span>
                    )}
                </div>

                {/* Upload overlay */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                    {uploading ? (
                        <Loader2 size={20} className="text-white animate-spin" />
                    ) : (
                        <Camera size={20} className="text-white" />
                    )}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                >
                    <Upload size={14} />
                    Avatar hochladen
                </Button>
                {(currentAvatar || preview) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveAvatar}
                        disabled={uploading}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        Avatar entfernen
                    </Button>
                )}
                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP oder SVG. Max. 2 MB.</p>
            </div>
        </div>
    );
}
