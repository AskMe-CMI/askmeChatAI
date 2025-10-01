# API Management System

ระบบจัดการ API แบบครบครันสำหรับ RMUTL ChatAI โดยมีการจัดการ Authentication, Chat, Dify AI และ File uploads อย่างเป็นระบบ

## 📁 โครงสร้างไฟล์

```
lib/config/
├── api-config.ts      # การตั้งค่า API และ endpoints ทั้งหมด
├── api-client.ts      # HTTP client สำหรับจัดการ requests
├── api-services.ts    # Services สำหรับ business logic
├── api-hooks.ts       # React hooks สำหรับใช้ใน components
├── index.ts           # รวบรวม exports ทั้งหมด
└── README.md          # เอกสารนี้
```

## 🚀 การใช้งาน

### 1. Import แบบง่าย

```typescript
import { AuthService, ChatService, DifyService } from '@/lib/config';
import { useLogin, useChatSessions } from '@/lib/config';
```

### 2. Authentication

```typescript
// Login
const response = await AuthService.mockLogin({
  email: 'admin@rmutl.ac.th',
  password: 'password123'
});

// Verify token
const user = await AuthService.mockVerifyToken(token);

// ใช้ hook ใน React component
const { login, loading, error } = useLogin();
const handleLogin = async () => {
  try {
    const result = await login(credentials, true); // true = use mock
    console.log('Login success:', result);
  } catch (err) {
    console.error('Login failed:', err);
  }
};
```

### 3. Chat Management

```typescript
// Get chat sessions
const sessions = await ChatService.getSessions(token);

// Send message
const message = await ChatService.sendMessage({
  message: 'สวัสดีครับ',
  sessionId: 'session-123'
}, token);

// ใช้ hook
const { data: sessions, loading, error } = useChatSessions(token);
const { sendMessage } = useSendMessage();
```

### 4. Dify AI Integration

```typescript
// Send message to Dify
const response = await DifyService.sendMessage({
  inputs: {},
  query: 'อธิบายเรื่อง AI',
  response_mode: 'blocking',
  user: 'dify-user-123'
});

// ใช้ hook
const { sendMessage } = useDifyChat();
const result = await sendMessage('สวัสดี', 'dify-user-123');
```

#### Dify Application Types
Dify รองรับ application ประเภทต่างๆ:

1. **Chatbot** - ผู้ช่วยสนทนาที่สร้างจาก LLM
2. **Text Generator** - สำหรับงานสร้างข้อความ เช่น การเขียน การแปล
3. **Agent** - ผู้ช่วยอัจฉริยะที่สามารถแยกงานและใช้เครื่องมือได้
4. **Chatflow** - Workflow สำหรับงานสนทนาหลายรอบที่ซับซ้อน
5. **Workflow** - สำหรับงานแบบรอบเดียว เช่น automation

#### Dify API Endpoints
```typescript
// Chat completion endpoint
POST /v1/chat-messages

// Headers
{
  "Authorization": "Bearer {API_KEY}",
  "Content-Type": "application/json"
}

// Request body
{
  "inputs": {},
  "query": "Hello!",
  "response_mode": "blocking", // หรือ "streaming"
  "conversation_id": null,
  "user": "user-123"
}
```

#### Response Modes
- **blocking**: รอ response ทั้งหมดก่อนส่งกลับ
- **streaming**: ส่ง response แบบ stream (real-time)

### 5. File Upload

```typescript
// Upload file
const fileResult = await FileService.uploadFile(file, token);

// ใช้ hook
const { uploadFile, loading } = useFileUpload();
const result = await uploadFile(file, token);
```

## ⚙️ การตั้งค่า

### Environment Variables

⚠️ **Security Warning**: อย่าเก็บ API keys หรือ sensitive data ใน repository!

ตั้งค่าในไฟล์ `.env.local`:

```env
# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend API
NEXT_PUBLIC_BACKEND_URL=https://api.rmutl.ac.th

# Dify API
DIFY_API_KEY=your_dify_api_key_here
NEXT_PUBLIC_DIFY_URL=https://api.dify.ai/v1

# Development settings
NODE_ENV=development
```

📝 **Setup Instructions**: 
1. คัดลอก `.env.example` เป็น `.env.local`
2. แก้ไขค่าใน `.env.local` ให้เป็นของจริง
3. ตรวจสอบว่า `.env.local` อยู่ใน `.gitignore`
4. **ห้าม commit .env.local ขึ้น git เด็ดขาด!**

```bash
# คำสั่งสำหรับ setup
cp .env.example .env.local
# แก้ไข .env.local ด้วย editor
code .env.local
```

### API Configuration

แก้ไขใน `api-config.ts`:

```typescript
export const API_CONFIG = {
  // Base URLs
  INTERNAL_BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  BACKEND_BASE_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api.rmutl.ac.th',
  DIFY_BASE_URL: process.env.NEXT_PUBLIC_DIFY_URL || 'https://api.dify.ai/v1',
  
  // Request settings
  REQUEST_TIMEOUT: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
} as const;
```

## 🔧 การพัฒนา

### Mock APIs

สำหรับการพัฒนา มี Mock APIs ให้ใช้:

```typescript
// Mock users
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@rmutl.ac.th',
    name: 'ผศ.ดร.เกรียงศักดิ์ ศรีอุปถัมภ์',
    password: 'password123',
    role: 'admin',
    userDify: 'dify-kriangsak-123'
  },
  {
    id: '2', 
    email: 'user@rmutl.ac.th',
    name: 'ผู้ใช้ทั่วไป',
    password: 'password123',
    role: 'user',
    userDify: 'dify-user-456'
  }
];
```

### การเพิ่ม Endpoint ใหม่

1. เพิ่มใน `API_ENDPOINTS` ใน `api-config.ts`:

```typescript
export const API_ENDPOINTS = {
  // เพิ่ม endpoint ใหม่
  USERS: {
    LIST: `${API_CONFIG.BACKEND_BASE_URL}/users`,
    CREATE: `${API_CONFIG.BACKEND_BASE_URL}/users`,
    UPDATE: `${API_CONFIG.BACKEND_BASE_URL}/users/{id}`,
    DELETE: `${API_CONFIG.BACKEND_BASE_URL}/users/{id}`,
  },
} as const;
```

2. เพิ่ม Service ใน `api-services.ts`:

```typescript
export class UserService {
  static async getUsers(token: string): Promise<ApiResponse<User[]>> {
    return await backendApi.get<User[]>(API_ENDPOINTS.USERS.LIST, { token });
  }
  
  static async createUser(userData: CreateUserRequest, token: string): Promise<ApiResponse<User>> {
    return await backendApi.post<User>(API_ENDPOINTS.USERS.CREATE, userData, { token });
  }
}
```

3. เพิ่ม Hook ใน `api-hooks.ts`:

```typescript
export function useUsers(token?: string) {
  const apiCall = useCallback(() => {
    if (!token) throw new Error('Token required');
    return UserService.getUsers(token);
  }, [token]);

  return useApi<User[]>(apiCall, { immediate: !!token });
}
```

## 🏗️ สถาปัตยกรรม

### 1. Configuration Layer (`api-config.ts`)
- ตั้งค่า URLs, headers, timeouts
- จัดการ environment variables
- กำหนด endpoints ทั้งหมด

### 2. HTTP Client Layer (`api-client.ts`)
- จัดการ HTTP requests
- Retry logic
- Error handling
- Timeout management

### 3. Service Layer (`api-services.ts`)
- Business logic
- Data transformation
- API call orchestration

### 4. React Integration (`api-hooks.ts`)
- Custom hooks สำหรับ React
- State management
- Loading และ error states

### 5. Main Export (`index.ts`)
- รวบรวม exports ทั้งหมด
- Convenience functions
- Quick setup

## 🔒 Security

### Headers

```typescript
export const API_HEADERS = {
  DEFAULT: {
    'Content-Type': 'application/json',
  },
  AUTH: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer {token}', // จะถูกแทนที่อัตโนมัติ
  },
  DIFY: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.DIFY_API_KEY}`,
  },
} as const;
```

### Token Management

- ใช้ httpOnly cookies สำหรับ session
- JWT tokens สำหรับ API authentication
- Automatic token refresh

## 🧪 การทดสอบ

### Health Check

```typescript
import { getApiStatus } from '@/lib/config';

const status = await getApiStatus();
console.log('API Status:', status);
```

### Mock Testing

```typescript
// ใช้ mock APIs สำหรับการทดสอบ
const response = await AuthService.mockLogin({
  email: 'admin@rmutl.ac.th',
  password: 'password123'
});
```

## 📊 Monitoring และ Logging

### API Call Logging

```typescript
// อัตโนมัติ log ทุก API call
logApiCall('POST', '/api/auth/login', { email: 'user@example.com' });
logApiResponse('POST', '/api/auth/login', 200, { success: true });
```

### Error Handling

```typescript
export const API_ERRORS = {
  NETWORK_ERROR: 'Network connection failed',
  TIMEOUT: 'Request timeout',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Invalid data provided',
} as const;
```

## 🎯 Dify Development Guide

### การสร้าง Dify Application

#### 1. วิธีการสร้าง Application
```
1. เข้าไปที่ Dify Studio
2. เลือก "Create from Template" (แนะนำสำหรับผู้เริ่มต้น)
3. หรือเลือก "Create from Blank" 
4. หรือ "Import DSL File" (จากไฟล์ YAML)
```

#### 2. ประเภท Application และการใช้งาน

| ประเภท | Interface | API Endpoint | การใช้งาน |
|--------|-----------|--------------|----------|
| **Chatbot** | Chat-based | `/chat-messages` | สนทนาแบบหลายรอบ |
| **Text Generator** | Form + Results | `/completion-messages` | งานสร้างข้อความ |
| **Agent** | Chat + Tools | `/chat-messages` | ใช้เครื่องมือและตัดสินใจ |
| **Chatflow** | Workflow + Chat | `/chat-messages` | สนทนาซับซ้อนแบบ workflow |
| **Workflow** | Single-round | `/workflows/run` | งานประมวลผลแบบครั้งเดียว |

#### 3. Dify DSL (Domain Specific Language)
```yaml
# ตัวอย่าง DSL file
version: 0.1.2
kind: app
metadata:
  title: "RMUTL ChatBot"
  description: "AI Assistant for RMUTL"
  author: "RMUTL Team"
specification:
  type: chatbot
  model:
    provider: openai
    name: gpt-4
    parameters:
      temperature: 0.7
      max_tokens: 2000
```

#### 4. การใช้ API Key
```typescript
// ตั้งค่า API Key จาก environment variables
const API_KEY = process.env.DIFY_API_KEY;

// ⚠️ อย่าเก็บ API Key ใน code โดยตรง!
// ✅ ใช้ environment variables แทน

// Headers สำหรับ Dify API
const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};
```

### การ Deploy และ Management

#### 5. Best Practices สำหรับ Dify

**Security:**
- 🚨 **ไม่เก็บ API Key ใน code หรือ repository**
- ✅ เก็บ API Key ไว้ที่ server-side เท่านั้น
- ✅ ใช้ environment variables สำหรับ sensitive data
- ✅ ตั้งค่า rate limiting ตามความเหมาะสม
- ✅ เพิ่ม `.env.local` ใน `.gitignore`

**Performance:**
- ใช้ streaming mode สำหรับ response ที่ยาว
- Cache responses ที่เหมาะสม
- Monitor usage และ costs อย่างสม่ำเสมอ

**Development:**
- ใช้ template เป็นจุดเริ่มต้น
- Test applications ก่อน deploy
- Version control DSL files

#### 6. การ Troubleshooting

**ปัญหาที่พบบ่อย:**
```typescript
// 1. Authorization Error (401)
if (response.status === 401) {
  console.error('Invalid API Key');
}

// 2. Rate Limit (429)
if (response.status === 429) {
  console.error('Rate limit exceeded');
}

// 3. Model Error (400)
if (response.status === 400) {
  console.error('Invalid request parameters');
}
```

**การ Debug:**
```typescript
// Enable detailed logging
const response = await DifyService.sendMessage({
  query: 'test',
  user: 'debug-user',
  // เพิ่ม conversation_id เพื่อ track การสนทนา
  conversation_id: 'debug-conversation-123'
});

console.log('Dify Response:', response);
```

## 🔄 Updates และ Maintenance

### การอัพเดท Backend URL

แก้ไขใน `.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=https://new-api.rmutl.ac.th
```

### การเพิ่ม Authentication Method

1. เพิ่มใน `AuthService`
2. เพิ่ม interfaces ใหม่
3. อัพเดท mock data (ถ้าจำเป็น)

### การเปลี่ยน Dify Configuration

แก้ไขใน `api-config.ts` หรือ environment variables

## 📚 Dify Resources และ Learning

### Official Documentation
- **Main Docs**: https://docs.dify.ai/
- **API Reference**: https://docs.dify.ai/api-reference
- **GitHub**: https://github.com/langgenius/dify
- **Community**: 180,000+ developers, 59,000+ end users

### การใช้งานตามสถานการณ์

#### For Startups
- Rapid prototyping AI ideas
- Build MVP และ secure funding
- ใช้ templates เพื่อเริ่มต้นเร็ว

#### For Enterprise  
- Internal LLM gateway
- Centralized AI governance
- Separate prompts from business logic

#### For Developers
- Practice prompt engineering
- Explore agent technologies
- RESTful APIs ready to use

### Integration Examples

#### 1. Simple Chat Integration
```typescript
import { DifyService } from '@/lib/config';

const handleChat = async (message: string, userId: string) => {
  try {
    const response = await DifyService.sendMessage({
      query: message,
      user: userId,
      response_mode: 'streaming'
    });
    
    return response;
  } catch (error) {
    console.error('Dify chat error:', error);
    throw error;
  }
};
```

#### 2. Agent with Tools
```typescript
const handleAgentTask = async (task: string, userId: string) => {
  const response = await DifyService.sendMessage({
    query: task,
    user: userId,
    inputs: {
      // Agent-specific inputs
      task_type: 'analysis',
      context: 'academic_research'
    }
  });
  
  return response;
};
```

#### 3. Workflow Automation
```typescript
const runWorkflow = async (inputData: any) => {
  const response = await fetch('/v1/workflows/run', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${DIFY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      inputs: inputData,
      user: 'workflow-user'
    })
  });
  
  return response.json();
};
```

---

## 📞 Support

หากมีปัญหาหรือข้อสงสัย:
1. ตรวจสอบ console logs
2. ดู API status ผ่าน `getApiStatus()`
3. ทดสอบด้วย mock APIs
4. ติดต่อทีมพัฒนา
