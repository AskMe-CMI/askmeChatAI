'use server';

export async function getSuggestions({ documentId }: { documentId: string }) {
  // Since we don't use database anymore, return empty array
  // In a real implementation, you might want to store suggestions in localStorage or other storage
  console.log('getSuggestions called with documentId:', documentId);
  return [];
}
