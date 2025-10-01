import { cookies } from 'next/headers';
import { sha512 } from 'js-sha512';

// In a real app, this should be in .env.local
const secret =
  process.env.JWT_SECRET ||
  'askme-super-secret-jwt-key-2025-development-only-change-in-production-8f4a2e1b9c6d3f7a';
const COOKIE_NAME = 'session';

export type UserPayload = {
  sub: string; // user id
  email: string;
  emailRmutl: string;
  type: 'regular';
};

export type UserType = UserPayload['type'];

// The shape returned by the compatibility `auth()` helper used across
// the codebase. Many callers expect an object with a `user` property
// containing `id`, `email` and `type`.
export type AuthResponse = {
  user: {
    id: string;
    email: string;
    emailRmutl: string;
    type: UserType;
  };
} | null;

// Helper to create base64url encoding
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper to decode base64url
function base64UrlDecode(str: string): string {
  let result = str.replace(/-/g, '+').replace(/_/g, '/');
  while (result.length % 4) {
    result += '=';
  }
  return atob(result);
}

// Convert string to ArrayBuffer for Web Crypto API
async function getKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

// Create a simple JWT-like token using Web Crypto API
async function createToken(payload: UserPayload): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 60 * 60; // 7 days

  const tokenPayload = {
    ...payload,
    iat: now,
    exp: exp,
  };

  const headerBase64 = base64UrlEncode(JSON.stringify(header));
  const payloadBase64 = base64UrlEncode(JSON.stringify(tokenPayload));

  const data = `${headerBase64}.${payloadBase64}`;
  const key = await getKey();
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureBase64 = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature)),
  );

  return `${data}.${signatureBase64}`;
}

// Verify a JWT-like token using Web Crypto API
async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerBase64, payloadBase64, signatureBase64] = parts;

    // Verify signature
    const data = `${headerBase64}.${payloadBase64}`;
    const key = await getKey();
    const encoder = new TextEncoder();

    // Convert base64url to Uint8Array
    const signatureArray = Uint8Array.from(
      base64UrlDecode(signatureBase64),
      (c) => c.charCodeAt(0),
    );

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureArray,
      encoder.encode(data),
    );
    if (!isValid) return null;

    // Parse payload
    const payload = JSON.parse(base64UrlDecode(payloadBase64));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;

    return {
      sub: payload.sub,
      // email: payload.email,
      email: `${sha512(`AskMe${payload.email}`).substring(0,4)}-${sha512(`AskMe${payload.email}`).substring(5,10)}-${sha512(`AskMe${payload.email}`).substring(11,15)}-${sha512(`AskMe${payload.email}`).substring(16,20)}`,
      emailRmutl: `${payload.email}`,
      type: payload.type,
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Creates a session for the user by signing a JWT
 * and setting it as a secure, HTTP-only cookie.
 * This function must be called from a Server Action or Route Handler.
 */
export async function createSession(user: {
  id: string;
  email: string;
  emailRmutl: string;
  type: UserPayload['type'];
}) {
  console.log('Creating session for user:', user);

  const payload: UserPayload = {
    sub: user.id,
    // email: user.email,
    email: `${sha512(`AskMe${user.email}`).substring(0,4)}-${sha512(`AskMe${user.email}`).substring(5,10)}-${sha512(`AskMe${user.email}`).substring(11,15)}-${sha512(`AskMe${user.email}`).substring(16,20)}`,
    emailRmutl: `${user.email}`,
    type: user.type,
  };

  const token = await createToken(payload);
  // console.log(`Created token: ${token.substring(0, 50)}...`);

  // Simple approach: just store the token and let middleware handle it
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: false, // false for localhost
    path: '/',
    expires,
    sameSite: 'lax',
  });

  // console.log('Session cookie set successfully');
  return token;
}

/**
 * Retrieves the current user session from the cookie.
 * @returns The user payload if the session is valid, otherwise null.
 */
export async function getSession(): Promise<UserPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // console.log('Getting session...');
  // console.log('Looking for cookie:', COOKIE_NAME);
  // console.log('Token found:', !!token);
  // console.log('Token length:', token?.length || 0);

  // Debug: List all cookies
  const allCookies = cookieStore.getAll();
  // console.log(
  //   'All cookies:',
  //   allCookies.map((c) => ({ name: c.name, hasValue: !!c.value })),
  // );

  if (!token) {
    // console.log('No token found, returning null');
    return null;
  }

  try {
    // Check if it's a mock token (for development)
    if (token.startsWith('mock_token_')) {
      // console.log('Mock token detected, parsing...');
      const parts = token.split('_');
      const userId = parts[2];
      const userEmail = parts[4];
      const userEmailRmutl = `R${parts[4]}`;
      // console.log('Mock token userId:', token);
      
      // Return mock session data — map userId to the mock user's email when available
      // const mockUser = getUserById(userId);
      const mockSession: UserPayload = {
        sub: userId,
        // email: userEmail || 'admin@rmutl.ac.th',
        email: `${sha512(`AskMe${userEmail}`).substring(0,4)}-${sha512(`AskMe${userEmail}`).substring(5,10)}-${sha512(`AskMe${userEmail}`).substring(11,15)}-${sha512(`AskMe${userEmail}`).substring(16,20)}`,
        emailRmutl: userEmailRmutl,
        type: 'regular',
      };

      // console.log('Mock session created:', mockSession);
      return mockSession;
    }

    // Verify the token and return the decoded payload
    const decoded = await verifyToken(token);
    // console.log('Session decoded:', decoded ? 'success' : 'failed');
    // if (decoded) {
    //   console.log('User data:', {
    //     sub: decoded.sub,
    //     email: decoded.email,
    //     type: decoded.type,
    //   });
    // }
    return decoded;
  } catch (error) {
    // If this is React's special postpone object used by Next.js to bail out of
    // prerendering when cookies are accessed, rethrow it so Next can handle it.
    if (
      error &&
      typeof error === 'object' &&
      Object.prototype.hasOwnProperty.call(error, '$$typeof')
    ) {
      throw error;
    }

    // If the token is invalid (e.g., expired or malformed), delete the cookie
    console.error('Invalid token:', error);
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return null;
  }
}

/**
 * Signs the user out by deleting the session cookie.
 * This function must be called from a Server Action or Route Handler.
 */
export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * A simplified signIn function for demonstration purposes.
 * In a real-world application, you would validate the user's credentials
 * against a database. Here, we simulate a successful login.
 */
export async function signIn(email: string, password?: string) {
  // NOTE: This is a mock implementation.
  // We are not validating the password and assuming any login attempt is successful.
  // We assign a static user ID for demonstration.
  console.log(
    `Signing in user: ${email} with password: ${password ? '******' : 'none'}`,
  );
  const user = {
    id: '12345', // Dummy user ID
    // email: email,
    email: `${sha512(`AskMe${email}`).substring(0,4)}-${sha512(`AskMe${email}`).substring(5,10)}-${sha512(`AskMe${email}`).substring(11,15)}-${sha512(`AskMe${email}`).substring(16,20)}`,
    emailRmutl: `${email}`,
    type: 'regular' as const,
  };
  return await createSession(user);
}

/**
 * A function to get the authenticated user session.
 * This is a replacement for the `auth` object from next-auth.
 */
export async function auth(): Promise<AuthResponse> {
  const session = await getSession();
  console.log('Auth session:', session);
  
  if (!session) return null;

  // Wrap the payload in the compatibility shape expected by callers.
  return {
    user: { 
      id: session.sub, 
      // email: session.email, 
      email: `${sha512(`AskMe${session.email}`).substring(0,4)}-${sha512(`AskMe${session.email}`).substring(5,10)}-${sha512(`AskMe${session.email}`).substring(11,15)}-${sha512(`AskMe${session.email}`).substring(16,20)}`,
      emailRmutl: `${session.email}`, 
      type: session.type 
    },
  };
}

// We no longer need the GET and POST handlers from NextAuth.
// The new implementation handles sessions directly via functions.
