// 集中管理所有 mock 数据，便于后续替换为真实接口（opencode 后端）

// 当前任务
export const currentProject = {
  title: '电商网站用户认证模块开发',
  status: '进行中',
  updatedAt: '2 分钟前',
  summary: '登录接口返回 500 错误，帮我分析原因并修复',
}

// 会话总数（侧栏「查看全部会话」用）
export const totalSessions = 8

// 会话列表（tone 用于状态点配色）
export const sessions = [
  {
    id: 'auth',
    title: '电商网站用户认证模块开发',
    status: '进行中',
    tone: 'progress',
    time: '2 分钟前',
    summary: '登录接口返回 500 错误，帮我分析原因并修复',
    active: true,
  },
  {
    id: 'chart',
    title: '数据可视化图表组件优化',
    status: '工具输出',
    tone: 'tool',
    time: '10:24',
    summary: '图表组件性能优化与交互细节调整',
  },
  {
    id: 'pay',
    title: '支付系统对接与测试',
    status: '规则/记忆',
    tone: 'rule',
    time: '3 天前',
    summary: '支付回调、订单状态同步与测试用例',
  },
]

// 上下文工作台指标
export const metrics = [
  { label: '总片段数', value: '12', unit: '项', icon: 'layers', tone: 'violet' },
  { label: 'Tokens', value: '8,532', icon: 'zap', tone: 'blue' },
  { label: '已选中', value: '7', unit: '/12', icon: 'check', tone: 'green' },
]

// 类型筛选
export const filters = [
  { label: '全部', count: 24, active: true },
  { label: '文件', count: 6 },
  { label: '对话', count: 12 },
  { label: '工具输出', count: 4 },
  { label: '规则/记忆', count: 2 },
]

// 上下文卡片
export const contextCards = [
  {
    id: 'c1',
    type: '问题分析',
    title: '登录接口返回 500 错误',
    body: '从错误日志中可以看到，问题出现在 auth_service.py 的第 45 行，可能是密码加密比较逻辑导致。',
    time: '今天 10:24',
    source: '对话',
    state: '已应用',
    priority: '高',
  },
  {
    id: 'c2',
    type: '修复方案',
    title: '密码验证逻辑已修复',
    body: '使用 passlib 的 CryptContext.verify 对明文密码与 hashed_password 进行比较，替代原来的字符串比较。',
    time: '今天 10:20',
    source: '文件',
    state: '已选中',
    priority: '高',
  },
  {
    id: 'c3',
    type: '工具输出',
    title: 'pytest tests/test_auth.py',
    body: '2 failed, 3 passed。失败用例集中在旧版密码校验路径，修复后需要重新运行认证模块测试。',
    time: '今天 10:23',
    source: '工具',
    state: '预览',
    priority: '中',
  },
  {
    id: 'c4',
    type: '旧假设',
    title: '数据库连接异常',
    body: '早期推测登录失败可能来自数据库连接或用户查询逻辑，但后续日志显示不是主要原因。',
    time: '昨天 15:30',
    source: '对话',
    state: '隐藏',
    priority: '低',
  },
]

// 本轮已应用上下文
export const appliedContext = ['错误日志', 'auth_service.py', '密码校验修复', 'pytest 输出']

// 聊天消息（assistant 可选 heading / codeBlock，由数据驱动渲染）
export const chatMessages = [
  {
    id: 'm1',
    role: 'user',
    time: '10:15',
    text: '实现用户登录功能，支持邮箱和密码登录。',
  },
  {
    id: 'm2',
    role: 'assistant',
    time: '10:16',
    text: '我会先搭建登录接口、用户查询逻辑和密码校验流程，并补充基础测试。',
  },
  {
    id: 'm3',
    role: 'user',
    time: '10:24',
    text: '登录接口返回 500 错误，帮我分析原因并修复。',
  },
  {
    id: 'm4',
    role: 'assistant',
    time: '10:25',
    heading: '错误原因分析',
    text: '根据当前上下文，500 错误不是数据库连接导致，而是登录校验中直接比较了明文密码和 hashed_password。应改为使用 CryptContext.verify，并保留测试输出作为下一轮验证依据。',
    codeBlock: {
      file: '/backend/services/auth_service.py',
      language: 'python',
      code: `+ pwd_context = CryptContext(schemes=['bcrypt'])
+ if pwd_context.verify(password, user.hashed_password):
+     return user
+ raise ValueError('invalid password')`,
    },
  },
]
