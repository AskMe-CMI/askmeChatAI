import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'node:crypto';
import { json } from 'node:stream/consumers';
import { success, trim } from 'zod/v4';

// MD5 hash function using Node.js crypto
function md5(str: string): string {
  return crypto.createHash('md5').update(str).digest('hex');
}
declare const process: any;
// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@rmutl.ac.th',
    password: 'Pa55w.rd',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: '2',
    email: 'user@rmutl.ac.th',
    password: 'user123',
    name: 'Test User',
    role: 'user',
  },
  {
    id: '3',
    email: 'tawatchai@askme.co.th',
    password: 'Pa55w.rd',
    name: 'Tawatchai',
    role: 'user',
  },
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('Mock login attempt:', email.trim().toLowerCase());
    
    // Find user in mock data first
    const mockUser = MOCK_USERS.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password,
    );

    // start mock forwarding to real API if not found in mock users
    if (!mockUser) {
      try {
        console.log('User not found in mock data, forwarding to real API:', email.trim().toLowerCase());
        
        // Create form data as required by the real API
        const formData = new URLSearchParams();
        formData.append('email', email.trim().toLowerCase());
        formData.append('password', password);

        // const response = await fetch(`${process.env.API_URL}/login`, {
        //   method: 'POST',
        //   headers: {
        //     'accept': 'application/json',
        //     'Content-Type': 'application/x-www-form-urlencoded',
        //   },
        //   body: formData.toString(),
        // });
        const response: any = {
          status: 200,
          statusText: 'OK',
          ok: true,
          redirected: false,
        }
        
        if (response.ok) {
          // const data = await response.json();
          const data ={
            email: email.trim().toLowerCase(),
            user: {
              id: md5(email),
              name: email,
              role: "user"
            },
            status: "success"
          }
          console.log('Real API login successful for:', email.trim().toLowerCase());
          
          // Generate mock token for session management
          const token = `mock_token_${md5(email)}_${Date.now()}_${email.trim().toLowerCase()}`;
          
          const mockResponse = NextResponse.json({
            success: true,
            user: {
              id: data.user?.id || email.split('@')[0],
              email: email.trim().toLowerCase(),
              name: data.user?.name || 'API User',
              role: data.user?.role || 'user',
            },
            token,
          });
          console.log('mockResponse data: ', mockResponse);

          // Set session cookie
          mockResponse.cookies.set('session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
          });

          return mockResponse;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('Real API login failed:', errorData);
          return NextResponse.json(
            { success: false, message: errorData.message || 'Invalid email or password' },
            { status: 401 },
          );
        }
      } catch (error) {
        console.error('Error forwarding to real API:', error);
        return NextResponse.json(
          { success: false, message: 'Authentication service unavailable' },
          { status: 503 },
        );
      }
    }
    // end mock forwarding to real API if not found in mock users

    
    // Handle mock users
    const token = `mock_token_${md5(email)}_${Date.now()}_${mockUser.email.trim().toLowerCase()}`;

    console.log('Mock login successful for:', mockUser.email.trim().toLowerCase());

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: mockUser.id,
        email: mockUser.email.trim().toLowerCase(),
        name: mockUser.name,
        role: mockUser.role,
      },
      token,
    });

    // Set session cookie (same name as auth.ts)
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Mock login error:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 },
    );
  }
}
