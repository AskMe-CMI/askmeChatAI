/**
 * File Upload API Client
 * Handles file uploads to the backend API
 */

import { getStoredToken } from '@/lib/auth/local-auth';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

// Types
export interface UploadedFile {
    filename: string;
    url: string;
    content_type: string;
}

export interface UploadResponse {
    success: boolean;
    file?: UploadedFile;
    error?: string;
}

/**
 * Get the full URL for a file path
 * Handles both relative and absolute URLs
 */
export function getFileUrl(filePath: string): string {
    if (!filePath) return '';

    // Already a full URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
    }

    // Relative path - prepend backend URL
    if (BACKEND_API_URL) {
        return `${BACKEND_API_URL}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    }

    return filePath;
}

/**
 * Upload a file to the backend
 */
export async function uploadFile(file: File): Promise<UploadResponse> {
    if (!BACKEND_API_URL) {
        console.error('BACKEND_API_URL is not configured');
        return { success: false, error: 'Backend URL not configured' };
    }

    const token = await getStoredToken();
    if (!token) {
        console.error('No auth token available');
        return { success: false, error: 'Not authenticated' };
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${BACKEND_API_URL}/api/files/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                // Note: Don't set Content-Type for FormData, browser sets it with boundary
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to upload file:', response.status, errorText);
            return {
                success: false,
                error: `Upload failed: ${response.status}`
            };
        }

        const data = await response.json();

        return {
            success: true,
            file: {
                filename: data.filename,
                url: data.url,
                content_type: data.content_type,
            },
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(files: File[]): Promise<{
    success: boolean;
    files: UploadedFile[];
    errors: string[];
}> {
    const results = await Promise.all(files.map(uploadFile));

    const successfulUploads = results
        .filter((r): r is UploadResponse & { file: UploadedFile } => r.success && !!r.file)
        .map(r => r.file);

    const errors = results
        .filter(r => !r.success)
        .map(r => r.error || 'Unknown error');

    return {
        success: errors.length === 0,
        files: successfulUploads,
        errors,
    };
}

/**
 * Get file type category from content type
 */
export function getFileTypeCategory(contentType: string): 'image' | 'document' | 'file' {
    if (contentType.startsWith('image/')) {
        return 'image';
    }
    if (
        contentType === 'application/pdf' ||
        contentType.startsWith('application/msword') ||
        contentType.startsWith('application/vnd.openxmlformats-officedocument')
    ) {
        return 'document';
    }
    return 'file';
}

/**
 * Convert uploaded file to attachment format for message API
 */
export function toAttachment(uploadedFile: UploadedFile): {
    type: 'image' | 'file';
    url: string;
} {
    const category = getFileTypeCategory(uploadedFile.content_type);
    return {
        type: category === 'image' ? 'image' : 'file',
        url: uploadedFile.url,
    };
}
