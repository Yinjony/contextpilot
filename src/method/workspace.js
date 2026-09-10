export const totalSessions = 8

export const sessions = [
  {
    id: 'auth',
    title: 'E-commerce User Authentication Module',
    status: 'In Progress',
    tone: 'progress',
    time: '2 min ago',
    summary: 'The login endpoint returns a 500 error; analyze the cause and fix it.',
    messages: [
      {
        id: 'auth-m1',
        role: 'user',
        time: '10:15',
        text: 'Implement user login with email and password.',
      },
      {
        id: 'auth-m2',
        role: 'assistant',
        time: '10:16',
        text: 'I will set up the login endpoint, user lookup logic, password verification flow, and basic tests.',
      },
      {
        id: 'auth-m3',
        role: 'user',
        time: '10:24',
        text: 'The login endpoint returns a 500 error. Please analyze the cause and fix it.',
      },
      {
        id: 'auth-m4',
        role: 'assistant',
        time: '10:25',
        heading: 'Error Cause Analysis',
        text: 'The current context shows that the 500 error is not caused by the database connection. The login check compares the plain password directly with hashed_password. It should use CryptContext.verify, with test output kept as verification evidence for the next turn.',
        codeBlock: {
          file: 'backend/services/auth_service.py',
          language: 'python',
          code: `+ pwd_context = CryptContext(schemes=['bcrypt'])
+ if pwd_context.verify(password, user.hashed_password):
+     return user
+ raise ValueError('invalid password')`,
        },
      },
    ],
  },
  {
    id: 'chart',
    title: 'Data Visualization Chart Component Optimization',
    status: 'Tool Output',
    tone: 'tool',
    time: 'Yesterday',
    summary: 'Chart performance optimization and interaction details.',
    messages: [
      {
        id: 'chart-m1',
        role: 'user',
        time: 'Yesterday',
        text: 'The line chart becomes visibly sluggish with large datasets. Help me locate the bottleneck and propose an optimization plan.',
      },
      {
        id: 'chart-m2',
        role: 'assistant',
        time: 'Yesterday',
        heading: 'Performance Bottlenecks and Optimization Suggestions',
        text: 'The main bottleneck is rebuilding all SVG nodes on every redraw. Recommended changes: use Canvas rendering, enable downsampling for datasets above 1k points, and virtualize axis-region elements so only the visible range is rendered.',
      },
      {
        id: 'chart-m3',
        role: 'user',
        time: 'Yesterday',
        text: 'First implement Canvas plus downsampling, then observe whether interactions still drop frames.',
      },
    ],
  },
  {
    id: 'pay',
    title: 'Payment Integration and Testing',
    status: 'Rules / Memory',
    tone: 'rule',
    time: '3 days ago',
    summary: 'Payment callbacks, order-status sync, and test cases.',
    messages: [
      {
        id: 'pay-m1',
        role: 'user',
        time: '3 days ago',
        text: 'When integrating third-party payment callbacks, order status sometimes becomes inconsistent. How should we handle it?',
      },
      {
        id: 'pay-m2',
        role: 'assistant',
        time: '3 days ago',
        heading: 'Callback Idempotency and Status Reconciliation',
        text: 'Callbacks should include idempotency checks to prevent duplicate posting. Use the order query API as the source of truth for reconciliation, and add a scheduled compensation task for delayed callbacks to ensure eventual consistency.',
      },
    ],
  },
]

export const contextCards = [
  {
    id: 'c1',
    category: 'Issue Analysis',
    title: 'Login endpoint returns a 500 error',
    body: 'The error log points to line 45 in auth_service.py, likely caused by incorrect password-hash comparison logic.',
    time: 'Today 10:24',
    source: 'Chat',
    priority: 'High',
    selected: true,
  },
  {
    id: 'c2',
    category: 'Fix Plan',
    title: 'Password verification logic fixed',
    body: 'Use passlib CryptContext.verify to compare the plain password with hashed_password, replacing the previous string comparison.',
    time: 'Today 10:20',
    source: 'File',
    priority: 'High',
    selected: true,
  },
  {
    id: 'c3',
    category: 'Key Error',
    title: 'pytest tests/test_auth.py',
    body: '2 failed, 3 passed. The failures focus on the legacy password verification path, so the authentication tests should be rerun after the fix.',
    time: 'Today 10:23',
    source: 'Tool',
    priority: 'Medium',
    selected: true,
  },
  {
    id: 'c4',
    category: 'Old Assumption',
    title: 'Database connection issue',
    body: 'An early assumption linked the login failure to the database connection or user lookup logic, but later logs ruled this out as the main cause.',
    time: 'Yesterday 15:30',
    source: 'Chat',
    priority: 'Low',
    selected: false,
  },
  {
    id: 'c5',
    category: 'Fix Plan',
    title: 'Add password verification unit tests',
    body: 'Add boundary cases for the new CryptContext.verify path, including empty passwords, very long passwords, and malformed hash values.',
    time: 'Today 10:28',
    source: 'File',
    priority: 'Medium',
    selected: true,
  },
  {
    id: 'c6',
    category: 'Old Assumption',
    title: 'Frontend form validation missing',
    body: 'A previous hypothesis linked the 500 error to frontend request formatting, but investigation confirmed the request body was valid.',
    time: 'Today 09:50',
    source: 'Chat',
    priority: 'Low',
    selected: false,
  },
]
