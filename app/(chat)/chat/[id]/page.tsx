import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';

// Declare Node.js globals
declare const process: any;
declare const require: any;

// Server-side utility functions
const getCookies = async () => {
  if (typeof window !== 'undefined') {
    return { get: () => null };
  }

  try {
    const NextHeaders = require('next/headers');
    return NextHeaders.cookies();
  } catch (e) {
    console.error('Error importing next/headers:', e);
    return { get: () => null };
  }
};

const notFound = () => {
  if (typeof window !== 'undefined') {
    window.location.href = '/404';
    return;
  }

  try {
    const NextNavigation = require('next/navigation');
    return NextNavigation.notFound();
  } catch (e) {
    console.error('Error importing next/navigation notFound:', e);
    throw new Error('Not found');
  }
};

const redirect = (url: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = url;
    return;
  }

  try {
    const NextNavigation = require('next/navigation');
    return NextNavigation.redirect(url);
  } catch (e) {
    console.error('Error importing next/navigation redirect:', e);
    throw new Error('Redirect failed');
  }
};

// Fetch chat data from Dify API
async function getChatFromDify(id: string, userEmail: string) {
  try {
    console.log('Page getChatFromDify - Starting fetch for:', {
      id,
      userEmail,
    });

    const cookieStore = await getCookies();
    const sessionCookie = cookieStore.get('session');

    console.log(
      'Page getChatFromDify - Session cookie:',
      sessionCookie ? 'found' : 'not found',
    );
    const base_url = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('Page getChatFromDify - Base URL:', process.env.NEXT_PUBLIC_BASE_URL);
    
    const response = await fetch(
      `${base_url}/api/chat/${id}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Cookie: sessionCookie ? `session=${sessionCookie.value}` : '',
        },
      },
    );

    console.log('Page getChatFromDify - Response status:', response.status);

    if (!response.ok) {
      console.log('Page getChatFromDify - Response not ok:', response.status);
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch chat: ${response.status}`);
    }

    const result = await response.json();
    console.log(
      'Page getChatFromDify - Response data keys:',
      Object.keys(result || {}),
    );
    console.log('Page getChatFromDify - Has chat:', !!result.chat);
    console.log('Page getChatFromDify - Has messages:', !!result.messages);

    return result;
  } catch (error) {
    console.error('Error fetching chat from Dify:', error);
    return null;
  }
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  console.log('Page component - Starting with id:', id);

  const session = await auth();

  if (!session?.user) {
    console.log('Page component - No session, redirecting to login');
    redirect('/login');
    return; // Add explicit return for TypeScript
  }

  // At this point, session and session.user are guaranteed to exist
  const userSession = session.user;
  const userEmail = userSession.email || userSession.id;

  console.log('Page component - User session:', {
    userEmail,
    userId: userSession.id,
  });

  const chatData = await getChatFromDify(id, userEmail);

  console.log('Page component - Chat data result:', {
    hasData: !!chatData,
    keys: chatData ? Object.keys(chatData) : 'none',
  });

  if (!chatData) {
    console.log('Page component - No chat data, calling notFound');
    notFound();
  }

  const { chat, messages: uiMessages } = chatData;

  // Check permissions - session is guaranteed to exist at this point
  if (chat.visibility === 'private') {
    console.log('Page component - Permission check:', {
      userEmail: userEmail,
      chatUserId: chat.userId,
      areEqual: userEmail === chat.userId,
      types: {
        userEmailType: typeof userEmail,
        chatUserIdType: typeof chat.userId,
      },
    });
    if (userEmail !== chat.userId) {
      console.log('Page component - Permission denied:', {
        userEmail: userEmail,
        chatUserId: chat.userId,
      });
      return notFound();
    }
  }

  const isReadonly = userEmail !== chat.userId;
  console.log('Page component - isReadonly calculation:', {
    userEmail,
    chatUserId: chat.userId,
    isReadonly,
    areEqual: userEmail === chat.userId,
  });

  const cookieStore = await getCookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          id={chat.id}
          initialMessages={uiMessages}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType={chat.visibility}
          isReadonly={isReadonly}
          session={userSession}
          autoResume={true}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        id={chat.id}
        initialMessages={uiMessages}
        initialChatModel={chatModelFromCookie.value}
        initialVisibilityType={chat.visibility}
        isReadonly={isReadonly}
        session={userSession}
        autoResume={true}
      />
      <DataStreamHandler />
    </>
  );
}
