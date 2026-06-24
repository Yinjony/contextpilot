// 集中管理所有 mock 数据，便于后续替换为真实接口（opencode 后端）

// 会话总数（侧栏「查看全部会话」用）
export const totalSessions = 8

// 会话列表（tone 用于状态点配色；每个会话自带 messages，切换会话即切换对话内容）
export const sessions = [
  {
    id: 'auth',
    title: '电商网站用户认证模块开发',
    status: '进行中',
    tone: 'progress',
    time: '2 分钟前',
    summary: '登录接口返回 500 错误，帮我分析原因并修复',
    messages: [
      {
        id: 'auth-m1',
        role: 'user',
        time: '10:15',
        text: '实现用户登录功能，支持邮箱和密码登录。',
      },
      {
        id: 'auth-m2',
        role: 'assistant',
        time: '10:16',
        text: '我会先搭建登录接口、用户查询逻辑和密码校验流程，并补充基础测试。',
      },
      {
        id: 'auth-m3',
        role: 'user',
        time: '10:24',
        text: '登录接口返回 500 错误，帮我分析原因并修复。',
      },
      {
        id: 'auth-m4',
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
    ],
  },
  {
    id: 'chart',
    title: '数据可视化图表组件优化',
    status: '工具输出',
    tone: 'tool',
    time: '昨天',
    summary: '图表组件性能优化与交互细节调整',
    messages: [
      {
        id: 'chart-m1',
        role: 'user',
        time: '昨天',
        text: '折线图在大数据量下渲染明显卡顿，帮我定位瓶颈并给出优化方案。',
      },
      {
        id: 'chart-m2',
        role: 'assistant',
        time: '昨天',
        heading: '性能瓶颈与优化建议',
        text: '主要瓶颈是每次重绘都重建全部 SVG 节点。建议：改用 Canvas 渲染、对超过 1k 的数据点启用降采样、并对坐标轴区域做虚拟化，仅渲染可视区间的元素。',
      },
      {
        id: 'chart-m3',
        role: 'user',
        time: '昨天',
        text: '先按 Canvas + 降采样落地，再观察交互是否还掉帧。',
      },
    ],
  },
  {
    id: 'pay',
    title: '支付系统对接与测试',
    status: '规则/记忆',
    tone: 'rule',
    time: '3 天前',
    summary: '支付回调、订单状态同步与测试用例',
    messages: [
      {
        id: 'pay-m1',
        role: 'user',
        time: '3 天前',
        text: '对接第三方支付回调，订单状态偶尔出现不同步，怎么处理？',
      },
      {
        id: 'pay-m2',
        role: 'assistant',
        time: '3 天前',
        heading: '回调幂等与状态对账',
        text: '回调要做幂等校验，避免重复入账；同时以订单查询接口为准做状态对账，并加一个定时补偿任务处理未及时到达的回调，保证最终一致。',
      },
    ],
  },
]

// 上下文卡片（category 为语义分类；selected 为是否默认选中）
export const contextCards = [
  {
    id: 'c1',
    category: '问题分析',
    title: '登录接口返回 500 错误',
    body: '从错误日志中可以看到，问题出现在 auth_service.py 的第 45 行，可能是密码加密比较逻辑导致。',
    time: '今天 10:24',
    source: '对话',
    priority: '高',
    selected: true,
  },
  {
    id: 'c2',
    category: '修复方案',
    title: '密码验证逻辑已修复',
    body: '使用 passlib 的 CryptContext.verify 对明文密码与 hashed_password 进行比较，替代原来的字符串比较。',
    time: '今天 10:20',
    source: '文件',
    priority: '高',
    selected: true,
  },
  {
    id: 'c3',
    category: '关键报错',
    title: 'pytest tests/test_auth.py',
    body: '2 failed, 3 passed。失败用例集中在旧版密码校验路径，修复后需要重新运行认证模块测试。',
    time: '今天 10:23',
    source: '工具',
    priority: '中',
    selected: true,
  },
  {
    id: 'c4',
    category: '旧假设',
    title: '数据库连接异常',
    body: '早期推测登录失败可能来自数据库连接或用户查询逻辑，但后续日志显示不是主要原因。',
    time: '昨天 15:30',
    source: '对话',
    priority: '低',
    selected: false,
  },
  {
    id: 'c5',
    category: '修复方案',
    title: '补充密码校验单元测试',
    body: '为新版 CryptContext.verify 校验路径补充边界用例：空密码、超长密码、hash 格式异常等情况。',
    time: '今天 10:28',
    source: '文件',
    priority: '中',
    selected: true,
  },
  {
    id: 'c6',
    category: '旧假设',
    title: '前端表单未做校验',
    body: '曾推测 500 错误可能与前端表单提交格式有关，排查后确认请求体正常，排除该方向。',
    time: '今天 09:50',
    source: '对话',
    priority: '低',
    selected: false,
  },
]
