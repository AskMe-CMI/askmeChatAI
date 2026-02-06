'use server';

import { getStoredToken } from '@/lib/auth/local-auth';

const BACKEND_API_URL = process.env.BACKEND_API_URL;

export interface BackendModel {
    id: string;
    object: string;
    owned_by: string;
}

export interface ModelsResponse {
    data: BackendModel[];
}

/**
 * Fetch available models from backend API
 */
export async function fetchModelsFromBackend(): Promise<BackendModel[]> {
    try {
        const token = await getStoredToken();

        if (!token) {
            console.error('No auth token available for fetching models');
            return [];
        }

        const response = await fetch(`${BACKEND_API_URL}/model/list`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            // Cache for 5 minutes
            next: { revalidate: 300 },
        });

        if (!response.ok) {
            console.error('Failed to fetch models:', response.status);
            return [];
        }

        const data: ModelsResponse = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
}

/**
 * Convert backend model to chat model format
 */
export function formatModelName(modelId: string): string {
    // Remove prefixes like "ollama/", "hf.co/" etc.
    const parts = modelId.split('/');
    const name = parts[parts.length - 1];

    // Clean up the name
    return name
        .replace(/:latest$/, '')
        .replace(/:Q4_K_M$/, '')
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
