import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sha512 } from 'js-sha512';

// Mock token storage (in production this would be Redis/Database)
const mockTokens = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid authorization header' },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    console.log('Mock verify token:', token);

    // Simple token validation (extract user id)
    if (!token.startsWith('mock_token_')) {
      return NextResponse.json(
        { success: false, message: 'Invalid token format' },
        { status: 401 },
      );
    }

    // Extract user ID from token
    const parts = token.split('_');
    const userId = parts[2];
    const userEmail = parts[4];

    // Mock user data based on ID
    // const users = {
    //   '1': {
    //     id: '1',
    //     email: 'admin@rmutl.ac.th',
    //     name: 'Admin User',
    //     role: 'admin',
    //   },
    //   '2': {
    //     id: '2',
    //     email: 'user@rmutl.ac.th',
    //     name: 'Test User',
    //     role: 'user',
    //   },
    //   '3': {
    //     id: '3',
    //     email: 'tawatchai@askme.co.th',
    //     password: 'Pa55w.rd',
    //     name: 'Tawatchai',
    //     role: 'user',
    //   },
    // };

    // const user = users[userId as keyof typeof users];
    const user = {
      id: userId,
      email: `${sha512(`AskMe${userEmail}`).substring(0,4)}-${sha512(`AskMe${userEmail}`).substring(5,10)}-${sha512(`AskMe${userEmail}`).substring(11,15)}-${sha512(`AskMe${userEmail}`).substring(16,20)}`,
      emailRmutl: `${userEmail}`,
      name: userEmail,
      role: 'user',
    };

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 401 },
      );
    }

    // console.log('Mock verify successful for:', user.email);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Mock verify error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 },
    );
  }
}
