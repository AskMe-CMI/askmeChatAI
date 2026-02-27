/**
 * Google OIDC Configuration
 * For testing Google OAuth2 Login
 */

export interface GoogleOIDCConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  responseType: string;
}

export const googleOIDCConfig: GoogleOIDCConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  redirectUri: process.env.GOOGLE_CALLBACK_URL || '',
  scope: 'openid profile email',
  responseType: 'code',
};

export const googleOIDCEndpoints = {
  authorization: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  userInfo: 'https://www.googleapis.com/oauth2/v3/userinfo',
  revoke: 'https://oauth2.googleapis.com/revoke',
};

/**
 * สร้าง Google Authorization URL
 */
export function createGoogleAuthUrl(): { url: string; state: string } {
  const state = Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    client_id: googleOIDCConfig.clientId,
    redirect_uri: googleOIDCConfig.redirectUri,
    response_type: googleOIDCConfig.responseType,
    scope: googleOIDCConfig.scope,
    state: state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const url = `${googleOIDCEndpoints.authorization}?${params.toString()}`;
  return { url, state };
}

/**
 * แลก Authorization Code เป็น Tokens
 */
export async function exchangeGoogleCode(code: string): Promise<any> {
  const tokenParams = new URLSearchParams({
    client_id: googleOIDCConfig.clientId,
    client_secret: googleOIDCConfig.clientSecret,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: googleOIDCConfig.redirectUri,
  });

  const response = await fetch(googleOIDCEndpoints.token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Google token exchange failed:', data);
    return { error: true, ...data };
  }

  return data;
}

/**
 * ดึงข้อมูล User จาก Google
 */
export async function getGoogleUserInfo(accessToken: string): Promise<any> {
  const response = await fetch(googleOIDCEndpoints.userInfo, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Google user info failed:', data);
    return { error: true, ...data };
  }

  return data;
}
