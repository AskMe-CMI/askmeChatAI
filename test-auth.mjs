// Test auth functions
import { signIn, auth } from '../app/(auth)/auth';

async function testAuth() {
  try {
    console.log('Testing signIn...');
    await signIn('admin@askme.co.th', 'password');
    console.log('✅ SignIn successful');

  console.log('Testing auth()...');
  const session = await auth();
  console.log('Session:', session);
  } catch (error) {
    console.error('❌ Auth test failed:', error);
  }
}

testAuth();
