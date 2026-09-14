/**
 * 🛡️ VIBE Craft Evidence Image Compression Engine
 * Vibeforce Flow OS - Enterprise Hardening
 * 
 * Provides client-side canvas-based image resizing and WebP compression
 * prior to network transmission. Shrinks 48-108 MP mobile camera photos (4-12 MB)
 * down to ~150-300 KB (max 1920x1080) with SHA-256 cryptographic fingerprinting.
 */

export interface ImageCompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.82)
  mimeType?: 'image/webp' | 'image/jpeg';
}

export interface CompressedEvidenceResult {
  file: File;
  blob: Blob;
  sha256Hash: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: number; // e.g. 0.05 = 95% reduction
  width: number;
  height: number;
}

/**
 * Computes SHA-256 hex string from an ArrayBuffer using Web Crypto API.
 */
async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return '';
}

/**
 * Compresses an image file in the browser using an off-screen HTML Canvas.
 */
export async function compressEvidenceImage(
  file: File,
  options: ImageCompressOptions = {}
): Promise<CompressedEvidenceResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.82,
    mimeType = 'image/webp',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Failed to read image file'));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error('Failed to parse image data'));

      img.onload = async () => {
        try {
          let targetWidth = img.naturalWidth || img.width;
          let targetHeight = img.naturalHeight || img.height;

          // Scale down proportionally if larger than maximum bounds
          if (targetWidth > maxWidth || targetHeight > maxHeight) {
            const widthRatio = maxWidth / targetWidth;
            const heightRatio = maxHeight / targetHeight;
            const bestRatio = Math.min(widthRatio, heightRatio);

            targetWidth = Math.round(targetWidth * bestRatio);
            targetHeight = Math.round(targetHeight * bestRatio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d', { alpha: false });
          if (!ctx) {
            return reject(new Error('Failed to get 2D canvas rendering context'));
          }

          // High-quality image rendering interpolation
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // White background fallback for transparent regions
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          canvas.toBlob(
            async (blob) => {
              if (!blob) {
                return reject(new Error('Canvas toBlob conversion failed'));
              }

              const buffer = await blob.arrayBuffer();
              const sha256Hash = await computeSha256(buffer);

              const fileExtension = mimeType === 'image/webp' ? '.webp' : '.jpg';
              const baseName = file.name.replace(/\.[^/.]+$/, '');
              const compressedFile = new File([blob], `${baseName}_optimized${fileExtension}`, {
                type: mimeType,
                lastModified: Date.now(),
              });

              resolve({
                file: compressedFile,
                blob,
                sha256Hash,
                originalSizeBytes: file.size,
                compressedSizeBytes: blob.size,
                compressionRatio: Math.round((blob.size / file.size) * 100) / 100,
                width: targetWidth,
                height: targetHeight,
              });
            },
            mimeType,
            quality
          );
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
