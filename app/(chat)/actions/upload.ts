'use server';

/**
 * File Upload Server Action
 * Handles file uploads to the backend API
 */

import { getStoredToken } from '@/lib/auth/local-auth';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export interface UploadedFile {
    filename: string;
    url: string;
    content_type: string;
}

export interface UploadResult {
    success: boolean;
    file?: UploadedFile;
    error?: string;
}

/**
 * Upload a file to the backend API
 * This is a server action that can be called from client components
 */
export async function uploadFileAction(formData: FormData): Promise<UploadResult> {
    if (!BACKEND_API_URL) {
        console.error('BACKEND_API_URL is not configured');
        return { success: false, error: 'Backend URL not configured' };
    }

    const token = await getStoredToken();
    if (!token) {
        console.error('No auth token available for file upload');
        return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    console.log('📤 Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
    });

    try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch(`${BACKEND_API_URL}/api/files/upload`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                // Note: Don't set Content-Type for FormData, browser/node sets it with boundary
            },
            body: uploadFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ File upload failed:', response.status, errorText);
            return {
                success: false,
                error: `Upload failed: ${response.status}`,
            };
        }

        const data = await response.json();

        // Prepend backend URL if the returned URL is a relative path
        let fullUrl = data.url;
        if (data.url && !data.url.startsWith('http://') && !data.url.startsWith('https://')) {
            fullUrl = `${BACKEND_API_URL}${data.url.startsWith('/') ? '' : '/'}${data.url}`;
        }

        console.log('✅ File uploaded successfully:', {
            filename: data.filename,
            originalUrl: data.url,
            fullUrl: fullUrl,
            contentType: data.content_type,
        });

        return {
            success: true,
            file: {
                filename: data.filename,
                url: fullUrl,
                content_type: data.content_type,
            },
        };
    } catch (error) {
        console.error('❌ Error uploading file:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Get the full URL for a file path
 * Handles both relative and absolute URLs
 */
export async function getFileFullUrl(filePath: string): Promise<string> {
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
 * Convert content type to attachment type for API
 */
export async function getAttachmentType(contentType: string): Promise<'image' | 'file'> {
    if (contentType.startsWith('image/')) {
        return 'image';
    }
    return 'file';
}
