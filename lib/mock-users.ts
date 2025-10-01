
import type { NextRequest } from 'next/server';

export type MockUser = {
  id: string;
  email: string;
  password?: string;
  name?: string;
  role?: string;
  type?: 'regular';
};

export const mockUsers: MockUser[] = [
  { id: '1', email: 'admin@rmutl.ac.th', password: 'Pa55w.rd', name: 'Admin User', role: 'admin', type: 'regular' },
  { id: '2', email: 'user@rmutl.ac.th', password: 'user123', name: 'Test User', role: 'user', type: 'regular' },
  { id: '3', email: 'tawatchai@askme.co.th', password: 'Pa55w.rd', name: 'Tawatchai', role: 'user', type: 'regular' },
];

export function getUserByEmail(email: string, request: NextRequest): MockUser | null {
  const authHeader: any = request.headers.get('authorization');
  const token = authHeader.substring(7);
  const parts = token.split('_');
  const userId = parts[2];
  const userEmail = parts[4];
  const user = mockUsers.find((u) => u.email === email) ?? {
    id: userId,
    email: userEmail,
    name: userEmail,
    role: 'user',
    type: 'regular',
  };
  return user;
}

export function getUserById(id: string): MockUser | null {
  return mockUsers.find((u) => u.id === id) ?? null;
}
