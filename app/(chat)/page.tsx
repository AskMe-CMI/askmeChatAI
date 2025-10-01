import { cookies } from 'next/headers';

import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getSessionFromAPI } from '@/lib/auth/local-auth';
import { redirect } from 'next/navigation';
import { email } from 'zod/v4';

export default async function Page() {
  const session = await getSessionFromAPI();

  if (!session) {
    redirect('/login');
  }

  // Convert API session to UserPayload format
  const userPayload = {
    id: session.id,
    email: session.email,
    emailRmutl: session.emailRmutl,
    type: 'regular' as const,
  };

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialVisibilityType="private"
          isReadonly={false}
          session={userPayload}
          autoResume={false}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={modelIdFromCookie.value}
        initialVisibilityType="private"
        isReadonly={false}
        session={userPayload}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}
