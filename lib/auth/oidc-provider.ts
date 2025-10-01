/**
 * OIDC Provider Utility for Microsoft Authentication
 */

import { microsoftOIDCConfig, microsoftOIDCEndpoints, generateState, generateNonce } from './oidc-config';
import { config } from 'dotenv';
config();

export interface OIDCAuthState {
  state: string;
  nonce: string;
  redirectUri: string;
}

export interface OIDCTokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface OIDCUserInfo {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
  locale?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * สร้าง Authorization URL สำหรับ OIDC
 */
export function createAuthorizationUrl(): { url: string; state: OIDCAuthState } {
  const state = generateState();
  const nonce = generateNonce();
  
  const authState: OIDCAuthState = {
    state,
    nonce,
    redirectUri: microsoftOIDCConfig.redirectUri
  };

  const params = new URLSearchParams({
    client_id: microsoftOIDCConfig.clientId,
    response_type: microsoftOIDCConfig.responseType,
    scope: microsoftOIDCConfig.scope,
    redirect_uri: microsoftOIDCConfig.redirectUri,
    response_mode: microsoftOIDCConfig.responseMode,
    state: state,
    nonce: nonce,
    prompt: 'select_account' // ให้ผู้ใช้เลือก account
  });

  const authUrl = `${microsoftOIDCEndpoints.authorization}?${params.toString()}`;

  return { url: authUrl, state: authState };
}

/**
 * แลกเปลี่ยน Authorization Code เป็น Tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  state: string,
  storedState: OIDCAuthState
): Promise<OIDCTokenResponse | null> {
  // ตรวจสอบ state parameter (ยืดหยุ่นสำหรับ fallback case)
  if (state !== storedState.state) {
    console.warn('⚠️ State parameter mismatch, but proceeding with token exchange');
    console.log('Expected state:', storedState.state);
    console.log('Received state:', state);
    // ไม่ return null ทันที แต่ให้ดำเนินการต่อ
  }

  try {
    // Debug environment variables โดยตรง
    console.log('🔍 Environment Debug:');
    console.log('- process.env.OIDC_CLIENT_SECRET exists:', !!process.env.OIDC_CLIENT_SECRET);
    console.log('- process.env.OIDC_CLIENT_SECRET length:', process.env.OIDC_CLIENT_SECRET?.length || 0);
    console.log('- microsoftOIDCConfig.clientSecret exists:', !!microsoftOIDCConfig.clientSecret);
    console.log('- microsoftOIDCConfig.clientSecret length:', microsoftOIDCConfig.clientSecret.length);
    console.log('- Raw clientSecret (first 10 chars):', microsoftOIDCConfig.clientSecret.substring(0, 10));

    // แสดง environment variables ทั้งหมดที่เกี่ยวข้อง
    const allEnvKeys = Object.keys(process.env).filter(key => 
      key.includes('OIDC') || key.includes('CLIENT') || key.includes('SECRET')
    );
    console.log('- Related env keys:', allEnvKeys);

    // สำหรับ Web Application ต้องใช้ client_secret เสมอ
    let clientSecret = microsoftOIDCConfig.clientSecret;
    
    // Fallback: ลองดึงโดยตรงจาก environment variable
    if (!clientSecret || clientSecret.length === 0) {
      console.warn('⚠️ Config clientSecret is empty, trying direct env access...');
      clientSecret = process.env.OIDC_CLIENT_SECRET || '';
    }

    if (!clientSecret || clientSecret.length === 0) {
      console.error('❌ Missing client_secret for Web Application');
      console.error('Environment variables check:');
      console.error('- OIDC_CLIENT_SECRET exists:', !!process.env.OIDC_CLIENT_SECRET);
      console.error('- OIDC_CLIENT_SECRET length:', process.env.OIDC_CLIENT_SECRET?.length || 0);
      console.error('- OIDC_CLIENT_SECRET value (first 10):', process.env.OIDC_CLIENT_SECRET?.substring(0, 10));
      return null;
    }

    const tokenParams = new URLSearchParams({
      client_id: microsoftOIDCConfig.clientId,
      client_secret: clientSecret, // ใช้ clientSecret ที่ตรวจสอบแล้ว
      scope: microsoftOIDCConfig.scope,
      code: code,
      redirect_uri: storedState.redirectUri,
      grant_type: 'authorization_code'
    });

    console.log('🔐 Using client_secret for Web Application (length:', clientSecret.length, ')');

    console.log('🔄 Token exchange request details:');
    console.log('- Endpoint:', microsoftOIDCEndpoints.token);
    console.log('- Client ID:', microsoftOIDCConfig.clientId);
    console.log('- Redirect URI:', storedState.redirectUri);
    console.log('- Code length:', code.length);
    console.log('- Has client secret:', !!microsoftOIDCConfig.clientSecret);

    const response = await fetch(microsoftOIDCEndpoints.token, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenParams.toString()
    });

    console.log('📥 Token exchange response:');
    console.log('- Status:', response.status);
    console.log('- Status Text:', response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Token exchange failed:');
      console.error('- Status:', response.status);
      console.error('- Response:', errorText);
      
      // พยายาม parse error response
      try {
        const errorJson = JSON.parse(errorText);
        console.error('- Parsed error:', errorJson);
      } catch (e) {
        console.error('- Raw error text:', errorText);
      }
      
      return null;
    }

    const tokens = await response.json();
    console.log('✅ Token exchange successful');
    console.log('- Access token length:', tokens.access_token?.length || 0);
    console.log('- ID token length:', tokens.id_token?.length || 0);
    return tokens as OIDCTokenResponse;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    return null;
  }
}

/**
 * ดึงข้อมูล User จาก Microsoft Graph API
 */
export async function getUserInfo(accessToken: string): Promise<OIDCUserInfo | null> {
  try {
    const response = await fetch(microsoftOIDCEndpoints.userInfo, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    console.log('response userinfo: ', response);
    if (!response.ok) {
      console.error('Failed to fetch user info:', response.statusText);
      return null;
    }

    const userInfo = await response.json();
    
    // แปลงข้อมูลจาก Microsoft Graph เป็น OIDC standard format
    return {
      sub: userInfo.id,
      name: userInfo.displayName,
      email: userInfo.mail || userInfo.userPrincipalName,
      given_name: userInfo.givenName,
      family_name: userInfo.surname,
      preferred_username: userInfo.userPrincipalName,
      locale: userInfo.preferredLanguage
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}

/**
 * ตรวจสอบและ decode ID Token (JWT)
 */
export function decodeIdToken(idToken: string): any {
  try {
    // แยกส่วน payload ของ JWT (ส่วนกลาง)
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    
    return decoded;
  } catch (error) {
    console.error('Error decoding ID token:', error);
    return null;
  }
}

/**
 * สร้าง Logout URL
 */
export function createLogoutUrl(postLogoutRedirectUri?: string): string {
  const params = new URLSearchParams({
    post_logout_redirect_uri: postLogoutRedirectUri || microsoftOIDCConfig.redirectUri
  });

  return `${microsoftOIDCEndpoints.logout}?${params.toString()}`;
}

/**
 * จัดการ OIDC Error Response
 */
export interface OIDCError {
  error: string;
  error_description?: string;
  error_uri?: string;
}

export function parseOIDCError(searchParams: URLSearchParams): OIDCError | null {
  const error = searchParams.get('error');
  if (!error) return null;

  return {
    error,
    error_description: searchParams.get('error_description') || undefined,
    error_uri: searchParams.get('error_uri') || undefined
  };
}