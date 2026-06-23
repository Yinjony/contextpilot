# <font style="color:rgb(0, 0, 0);">3 Formative Study</font>
<font style="color:rgb(0, 0, 0);">为理解长程 LLM Coding Agent 使用中的上下文调控问题，我们开展了一项形成性研究。该研究旨在识别用户在真实任务中遇到的上下文失效、现有修复策略，以及需要被支持的上下文调控需求，并将这些发现转化为后续系统设计原则。</font>

### <font style="color:rgb(0, 0, 0);">3.1 Participants</font>
<font style="color:rgb(0, 0, 0);">我们招募了 12 名具有 LLM Coding Agent 或 AI coding assistant 使用经验的参与者。所有参与者均累计使用 AI 辅助编程工具超过 10 小时，其中部分参与者超过 50 小时。参与者使用过 Cursor、GitHub Copilot Chat、Claude Code、ChatGPT、OpenCode 和 Codex CLI 等工具，常见任务包括网页开发、bug 修复、脚本编写、代码重构、界面实现以及课程或研究项目开发。为覆盖不同使用情境，参与者包括计算机相关专业学生、具有软件开发经验的用户，以及使用 AI coding 完成网页原型的设计背景用户。这样的样本构成有助于我们理解上下文调控问题如何在不同编程经验和任务类型中出现。</font>

| <font style="color:rgb(0, 0, 0);">ID</font> | <font style="color:rgb(0, 0, 0);">Gender</font> | <font style="color:rgb(0, 0, 0);">Drawing experience</font> | <font style="color:rgb(0, 0, 0);">Major</font> |
| --- | --- | --- | --- |
| <font style="color:rgb(0, 0, 0);">P1</font> | <font style="color:rgb(0, 0, 0);">男</font> | <font style="color:rgb(0, 0, 0);">在科</font> | <font style="color:rgb(0, 0, 0);">计算机科学</font> |
| <font style="color:rgb(0, 0, 0);">P2</font> | <font style="color:rgb(0, 0, 0);">女</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |
| <font style="color:rgb(0, 0, 0);">P3</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |  |
| <font style="color:rgb(0, 0, 0);">P4</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |
| <font style="color:rgb(0, 0, 0);">P5</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |
| <font style="color:rgb(0, 0, 0);">P6</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |
| <font style="color:rgb(0, 0, 0);">P7</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |
| <font style="color:rgb(0, 0, 0);">P8</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |
| <font style="color:rgb(0, 0, 0);">P9</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |
| <font style="color:rgb(0, 0, 0);">P10</font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> | <font style="color:rgb(0, 0, 0);"></font> |


### <font style="color:rgb(0, 0, 0);">3.2 Procedure</font>
<font style="color:rgb(0, 0, 0);">每次研究约 60–75 分钟，采用半结构化访谈、关键事件回顾和上下文标注任务相结合的方式进行。研究开始时，我们首先收集参与者的编程经验、常用 AI coding 工具、使用频率和典型任务类型。随后，我们邀请参与者回忆一次长程 Coding Agent 使用经历，尤其是他们认为 Agent 被历史对话、旧需求、错误调试路径或冲突约束影响的案例。</font>

<font style="color:rgb(0, 0, 0);">在关键事件回顾中，我们重点追问任务如何开始、上下文如何逐渐变复杂、Agent 在什么阶段出现偏移、用户如何判断问题与历史上下文有关，以及他们采取了哪些修复策略。为了避免访谈停留在抽象意见层面，我们还设计了一个上下文标注任务。参与者需要阅读一段经过脱敏或模拟的长程 Coding Agent 对话，并标注哪些信息应继续影响 Agent，哪些信息已经过期、错误、冲突或不确定。最后，我们向参与者展示若干低保真设计探针，包括上下文概览、关键信息标注、保留/排除操作和发送前预览等，询问这些机制在其实际经历中是否有帮助，以及可能带来哪些负担或风险。</font>

### <font style="color:rgb(0, 0, 0);">3.3 Data Analysis</font>
### <font style="color:rgb(0, 0, 0);">3.4 Findings</font>
### <font style="color:rgb(0, 0, 0);">3.5 Design Implications</font>












# <font style="color:rgb(0, 0, 0);">一、Formative Study 的核心定位</font>
**<font style="color:rgb(0, 0, 0);">一项用于理解长程 Coding Agent 使用中上下文调控问题的形成性研究。</font>**

1. <font style="color:rgb(0, 0, 0);">用户在长程 Coding Agent 任务中，遇到哪些上下文失控现象？</font>
2. <font style="color:rgb(0, 0, 0);">用户当前如何判断、修复、绕开这些问题？</font>
3. <font style="color:rgb(0, 0, 0);">用户真正需要调控的上下文对象和操作方式是什么？</font>

## <font style="color:rgb(0, 0, 0);">Study Goal 1：识别上下文失效类型</font>
<font style="color:rgb(0, 0, 0);">需要确认用户真实使用中是否会遇到这些问题：</font>

| <font style="color:rgb(0, 0, 0);">类型</font> | <font style="color:rgb(0, 0, 0);">你要确认的问题</font> |
| --- | --- |
| <font style="color:rgb(0, 0, 0);">旧需求污染</font> | <font style="color:rgb(0, 0, 0);">Agent 是否继续沿用已经过期的需求？</font> |
| <font style="color:rgb(0, 0, 0);">错误路径继承</font> | <font style="color:rgb(0, 0, 0);">Agent 是否持续基于早期错误判断行动？</font> |
| <font style="color:rgb(0, 0, 0);">多任务混杂</font> | <font style="color:rgb(0, 0, 0);">Agent 是否无法区分当前任务主次？</font> |
| <font style="color:rgb(0, 0, 0);">约束冲突</font> | <font style="color:rgb(0, 0, 0);">Agent 是否混淆新旧要求的优先级？</font> |
| <font style="color:rgb(0, 0, 0);">上下文不可见</font> | <font style="color:rgb(0, 0, 0);">用户是否不知道 Agent 为什么这么回答？</font> |
| <font style="color:rgb(0, 0, 0);">重开成本高</font> | <font style="color:rgb(0, 0, 0);">用户是否为了干净上下文而被迫重开会话？</font> |
| <font style="color:rgb(0, 0, 0);">分支探索困难</font> | <font style="color:rgb(0, 0, 0);">用户是否难以比较或回到不同方案路径？</font> |


## <font style="color:rgb(0, 0, 0);">Study Goal 2：理解用户当前的修复策略</font>
<font style="color:rgb(0, 0, 0);">  
</font>**<font style="color:rgb(0, 0, 0);">用户为什么采用这些策略？它们在什么情况下有效？什么时候会失败？失败后用户怎么补救？</font>**

## <font style="color:rgb(0, 0, 0);">Study Goal 3：提炼用户需要调控的“上下文对象”</font>
<font style="color:rgb(0, 0, 0);">需要从访谈中提炼出用户真正想操作的对象，例如：</font>

| <font style="color:rgb(0, 0, 0);">上下文对象</font> | <font style="color:rgb(0, 0, 0);">用户可能想做的事</font> |
| --- | --- |
| <font style="color:rgb(0, 0, 0);">当前有效需求</font> | <font style="color:rgb(0, 0, 0);">保留、强化、置顶</font> |
| <font style="color:rgb(0, 0, 0);">已废弃需求</font> | <font style="color:rgb(0, 0, 0);">排除、降权</font> |
| <font style="color:rgb(0, 0, 0);">错误调试路径</font> | <font style="color:rgb(0, 0, 0);">隔离、标记为无效</font> |
| <font style="color:rgb(0, 0, 0);">关键报错信息</font> | <font style="color:rgb(0, 0, 0);">保留、重新引用</font> |
| <font style="color:rgb(0, 0, 0);">用户最新修正</font> | <font style="color:rgb(0, 0, 0);">提高优先级</font> |
| <font style="color:rgb(0, 0, 0);">多个方案路径</font> | <font style="color:rgb(0, 0, 0);">分开保存、比较</font> |
| <font style="color:rgb(0, 0, 0);">项目规则</font> | <font style="color:rgb(0, 0, 0);">长期保留</font> |
| <font style="color:rgb(0, 0, 0);">临时尝试</font> | <font style="color:rgb(0, 0, 0);">只在当前路径中保留</font> |
| <font style="color:rgb(0, 0, 0);">Agent 错误假设</font> | <font style="color:rgb(0, 0, 0);">标记、阻止继续继承</font> |


# <font style="color:rgb(0, 0, 0);">三、建议采用的研究方法</font>
**<font style="color:rgb(0, 0, 0);">半结构化访谈 + 关键事件回顾 + 上下文标注任务 + 设计探针反馈</font>**

<font style="color:rgb(0, 0, 0);">不要只做普通访谈。普通访谈容易得到很泛的答案，比如“我希望 AI 更聪明”“我希望可以删除上下文”。你需要让用户围绕具体经历展开。</font>

---

## <font style="color:rgb(0, 0, 0);">方法 1：半结构化访谈</font>
<font style="color:rgb(0, 0, 0);">用于了解用户背景、常用工具、使用频率和整体经验。</font>

<font style="color:rgb(0, 0, 0);">重点收集：</font>

+ <font style="color:rgb(0, 0, 0);">用户使用哪些 Coding Agent；</font>
+ <font style="color:rgb(0, 0, 0);">使用时长和任务类型；</font>
+ <font style="color:rgb(0, 0, 0);">是否做过长程任务；</font>
+ <font style="color:rgb(0, 0, 0);">是否遇到 Agent 被历史内容影响；</font>
+ <font style="color:rgb(0, 0, 0);">是否有重开会话、总结、复制上下文的经验；</font>
+ <font style="color:rgb(0, 0, 0);">用户如何判断 Agent 当前“记住了什么”。</font>

---

## <font style="color:rgb(0, 0, 0);">方法 2：关键事件回顾 Critical Incident</font>
<font style="color:rgb(0, 0, 0);">让用户回忆一次具体经历：</font>

<font style="color:rgb(0, 0, 0);">最近一次你觉得 Coding Agent 被旧上下文、错误方向或历史内容影响，是在什么任务中发生的？</font>

<font style="color:rgb(0, 0, 0);">你要追问：</font>

+ <font style="color:rgb(0, 0, 0);">当时任务目标是什么？</font>
+ <font style="color:rgb(0, 0, 0);">上下文是怎么变复杂的？</font>
+ <font style="color:rgb(0, 0, 0);">Agent 出现了什么偏移？</font>
+ <font style="color:rgb(0, 0, 0);">你怎么发现问题的？</font>
+ <font style="color:rgb(0, 0, 0);">你怎么修复？</font>
+ <font style="color:rgb(0, 0, 0);">修复过程花了多久？</font>
+ <font style="color:rgb(0, 0, 0);">最后是否成功？</font>
+ <font style="color:rgb(0, 0, 0);">如果有工具可以帮你，你希望它做什么？</font>

---

## <font style="color:rgb(0, 0, 0);">方法 3：上下文标注任务</font>
<font style="color:rgb(0, 0, 0);">你可以让用户拿一段真实或模拟的长程 Coding Agent 对话，要求他们标注：</font>

| <font style="color:rgb(0, 0, 0);">标注类型</font> | <font style="color:rgb(0, 0, 0);">含义</font> |
| --- | --- |
| <font style="color:rgb(0, 0, 0);">Keep</font> | <font style="color:rgb(0, 0, 0);">后续仍然应该影响 Agent</font> |
| <font style="color:rgb(0, 0, 0);">Outdated</font> | <font style="color:rgb(0, 0, 0);">已经过期，不应继续影响</font> |
| <font style="color:rgb(0, 0, 0);">Wrong Path</font> | <font style="color:rgb(0, 0, 0);">错误探索路径</font> |
| <font style="color:rgb(0, 0, 0);">Conflict</font> | <font style="color:rgb(0, 0, 0);">与后续需求冲突</font> |
| <font style="color:rgb(0, 0, 0);">Important Error</font> | <font style="color:rgb(0, 0, 0);">关键报错，应保留</font> |
| <font style="color:rgb(0, 0, 0);">User Correction</font> | <font style="color:rgb(0, 0, 0);">用户修正，应提高优先级</font> |
| <font style="color:rgb(0, 0, 0);">Unclear</font> | <font style="color:rgb(0, 0, 0);">不确定 Agent 是否还在参考</font> |


<font style="color:rgb(0, 0, 0);">这个任务不是测试用户能力，而是观察：</font>

+ <font style="color:rgb(0, 0, 0);">用户如何理解上下文；</font>
+ <font style="color:rgb(0, 0, 0);">哪些内容难以判断；</font>
+ <font style="color:rgb(0, 0, 0);">用户想以什么粒度操作；</font>
+ <font style="color:rgb(0, 0, 0);">用户害怕删除什么；</font>
+ <font style="color:rgb(0, 0, 0);">用户希望系统自动做什么、手动做什么。</font>

---

## <font style="color:rgb(0, 0, 0);">方法 4：设计探针反馈 Design Probe</font>
<font style="color:rgb(0, 0, 0);">在访谈后半段，可以给用户看一些非常低保真的概念，不需要完整系统。</font>

<font style="color:rgb(0, 0, 0);">例如：</font>

+ <font style="color:rgb(0, 0, 0);">上下文概览面板；</font>
+ <font style="color:rgb(0, 0, 0);">关键历史摘要；</font>
+ <font style="color:rgb(0, 0, 0);">保留 / 排除开关；</font>
+ <font style="color:rgb(0, 0, 0);">“不再参考此段”按钮；</font>
+ <font style="color:rgb(0, 0, 0);">当前 active context 预览；</font>
+ <font style="color:rgb(0, 0, 0);">冲突信息提示；</font>
+ <font style="color:rgb(0, 0, 0);">多路径保存；</font>
+ <font style="color:rgb(0, 0, 0);">“最新需求优先”标记。</font>

<font style="color:rgb(0, 0, 0);">这个功能在你刚才描述的案例中是否有帮助？  
</font><font style="color:rgb(0, 0, 0);">它会在哪一步帮到你？  
</font><font style="color:rgb(0, 0, 0);">它会增加负担吗？  
</font><font style="color:rgb(0, 0, 0);">你会担心误删或误操作吗？  
</font><font style="color:rgb(0, 0, 0);">哪些操作必须由你决定，哪些可以交给系统自动处理？</font>

---

# <font style="color:rgb(0, 0, 0);">四、参与者怎么招募</font>
## <font style="color:rgb(0, 0, 0);">推荐人数</font>
<font style="color:rgb(0, 0, 0);">建议第一轮招募：</font>

**<font style="color:rgb(0, 0, 0);">10–12 名参与者</font>**

<font style="color:rgb(0, 0, 0);">如果你资源充足，可以做到 12–15 名。形成性研究不需要大量样本，但需要信息密度高。</font>

---

## <font style="color:rgb(0, 0, 0);">参与者标准</font>
<font style="color:rgb(0, 0, 0);">建议筛选标准：</font>

| <font style="color:rgb(0, 0, 0);">条件</font> | <font style="color:rgb(0, 0, 0);">建议标准</font> |
| --- | --- |
| <font style="color:rgb(0, 0, 0);">使用经验</font> | <font style="color:rgb(0, 0, 0);">使用 Coding Agent / AI coding assistant 累计超过 10 小时</font> |
| <font style="color:rgb(0, 0, 0);">工具经验</font> | <font style="color:rgb(0, 0, 0);">使用过 Cursor、GitHub Copilot Chat、Claude Code、Codex CLI、OpenCode、Windsurf、ChatGPT coding workflow 等</font> |
| <font style="color:rgb(0, 0, 0);">任务经验</font> | <font style="color:rgb(0, 0, 0);">至少完成过一次超过 30 分钟或 15 轮以上的 AI 辅助编码任务</font> |
| <font style="color:rgb(0, 0, 0);">任务类型</font> | <font style="color:rgb(0, 0, 0);">bug 修复、网页开发、重构、数据处理、脚本开发、设计转代码均可</font> |
| <font style="color:rgb(0, 0, 0);">用户类型</font> | <font style="color:rgb(0, 0, 0);">程序员、CS 学生、设计师转 AI coding、研究人员均可</font> |


<font style="color:rgb(0, 0, 0);">目标用户应是有较长时间 Agent 使用经验者，初步标准可以是累计使用时长超过 10 小时，并可进一步区分 10–50 小时与 50 小时以上两组。</font>

## <font style="color:rgb(0, 0, 0);">五、一次访谈的完整流程</font>
<font style="color:rgb(0, 0, 0);">建议每位参与者</font><font style="color:rgb(0, 0, 0);"> </font>**<font style="color:rgb(0, 0, 0);">60–75 分钟</font>**<font style="color:rgb(0, 0, 0);">。</font>

## <font style="color:rgb(0, 0, 0);">0. 研究说明与同意书 5 分钟</font>
<font style="color:rgb(0, 0, 0);">说明：</font>

+ <font style="color:rgb(0, 0, 0);">研究不是测试用户编程能力；</font>
+ <font style="color:rgb(0, 0, 0);">不要求展示敏感代码；</font>
+ <font style="color:rgb(0, 0, 0);">可以使用匿名或脱敏案例；</font>
+ <font style="color:rgb(0, 0, 0);">访谈会录音转写；</font>
+ <font style="color:rgb(0, 0, 0);">用户可以随时跳过问题。</font>

---

## <font style="color:rgb(0, 0, 0);">1. 背景问卷 5 分钟</font>
<font style="color:rgb(0, 0, 0);">收集基本信息：</font>

+ <font style="color:rgb(0, 0, 0);">编程经验；</font>
+ <font style="color:rgb(0, 0, 0);">AI coding 工具使用经验；</font>
+ <font style="color:rgb(0, 0, 0);">最常用工具；</font>
+ <font style="color:rgb(0, 0, 0);">平均使用频率；</font>
+ <font style="color:rgb(0, 0, 0);">是否做过长程任务；</font>
+ <font style="color:rgb(0, 0, 0);">最常见任务类型。</font>

<font style="color:rgb(0, 0, 0);">可以用简单表格或问卷。</font>

---

## <font style="color:rgb(0, 0, 0);">2. 使用习惯访谈 10 分钟</font>
<font style="color:rgb(0, 0, 0);">问题示例：</font>

1. <font style="color:rgb(0, 0, 0);">你平时用哪些 AI coding 工具？</font>
2. <font style="color:rgb(0, 0, 0);">你通常让 Agent 做什么类型的任务？</font>
3. <font style="color:rgb(0, 0, 0);">你一般会在一个对话里持续做多久？</font>
4. <font style="color:rgb(0, 0, 0);">你会让 Agent 记住项目背景或规则吗？</font>
5. <font style="color:rgb(0, 0, 0);">你什么时候会选择重开会话？</font>

---

## <font style="color:rgb(0, 0, 0);">3. 关键事件回顾 20 分钟</font>
<font style="color:rgb(0, 0, 0);">核心问题：</font>

1. <font style="color:rgb(0, 0, 0);">请回忆一次 Agent 被历史上下文影响、导致结果偏移的经历。</font>
2. <font style="color:rgb(0, 0, 0);">当时任务原本是什么？</font>
3. <font style="color:rgb(0, 0, 0);">中间发生了哪些需求变化、调试路径或方案切换？</font>
4. <font style="color:rgb(0, 0, 0);">Agent 的错误表现是什么？</font>
5. <font style="color:rgb(0, 0, 0);">你怎么判断它是被历史影响了？</font>
6. <font style="color:rgb(0, 0, 0);">你当时怎么修复？</font>
7. <font style="color:rgb(0, 0, 0);">哪一步最费时间？</font>
8. <font style="color:rgb(0, 0, 0);">你最后有没有重开会话？</font>
9. <font style="color:rgb(0, 0, 0);">如果没有重开，你如何让它“回到正确方向”？</font>
10. <font style="color:rgb(0, 0, 0);">你觉得当时最想控制的历史内容是什么？</font>

---

## <font style="color:rgb(0, 0, 0);">4. 上下文标注任务 15 分钟</font>
<font style="color:rgb(0, 0, 0);">给用户一段长程 Coding Agent 对话，可以是：</font>

+ <font style="color:rgb(0, 0, 0);">用户自己的脱敏对话；</font>
+ <font style="color:rgb(0, 0, 0);">你准备的模拟对话；</font>
+ <font style="color:rgb(0, 0, 0);">研究用标准材料。</font>

<font style="color:rgb(0, 0, 0);">让用户标注：</font>

+ <font style="color:rgb(0, 0, 0);">哪些应该继续保留；</font>
+ <font style="color:rgb(0, 0, 0);">哪些应该不再影响 Agent；</font>
+ <font style="color:rgb(0, 0, 0);">哪些是错误路径；</font>
+ <font style="color:rgb(0, 0, 0);">哪些是关键约束；</font>
+ <font style="color:rgb(0, 0, 0);">哪些和后续需求冲突；</font>
+ <font style="color:rgb(0, 0, 0);">哪些用户不确定。</font>

<font style="color:rgb(0, 0, 0);">观察并追问：</font>

1. **<font style="color:rgb(0, 0, 0);background-color:#FBDE28;">你为什么标记这里？</font>**
2. **<font style="color:rgb(0, 0, 0);background-color:#FBDE28;">你会删除它、隐藏它，还是只是降低优先级？</font>**
3. **<font style="color:rgb(0, 0, 0);background-color:#FBDE28;">你希望 Agent 以后完全不参考它吗？</font>**
4. **<font style="color:rgb(0, 0, 0);background-color:#FBDE28;">你觉得系统能自动判断吗？</font>**
5. **<font style="color:rgb(0, 0, 0);background-color:#FBDE28;">哪些判断必须由你来做？</font>**

---

## <font style="color:rgb(0, 0, 0);">5. 设计探针反馈 10–15 分钟</font>
<font style="color:rgb(0, 0, 0);">展示低保真概念图或功能描述。</font>

<font style="color:rgb(0, 0, 0);">可以问：</font>

1. <font style="color:rgb(0, 0, 0);">如果有一个上下文面板，你最想看到什么？</font>
2. <font style="color:rgb(0, 0, 0);">你希望系统自动整理，还是你手动选择？</font>
3. <font style="color:rgb(0, 0, 0);">你希望能对历史内容做哪些操作？</font>
4. <font style="color:rgb(0, 0, 0);">“保留 / 排除 / 标记为过期 / 预览下一轮上下文”这些操作哪个最有用？</font>
5. <font style="color:rgb(0, 0, 0);">哪些操作会让你觉得负担变大？</font>
6. <font style="color:rgb(0, 0, 0);">你会担心误删上下文吗？</font>
7. <font style="color:rgb(0, 0, 0);">你希望系统怎么解释它为什么保留某些内容？</font>

---

## <font style="color:rgb(0, 0, 0);">6. 总结问题 5 分钟</font>
<font style="color:rgb(0, 0, 0);">最后问：</font>

1. <font style="color:rgb(0, 0, 0);">你觉得一个好用的上下文调控工具最应该解决什么？</font>
2. <font style="color:rgb(0, 0, 0);">你什么时候会愿意使用它？</font>
3. <font style="color:rgb(0, 0, 0);">你什么时候不会使用它？</font>
4. <font style="color:rgb(0, 0, 0);">如果只能保留三个功能，你会选哪三个？</font>

---

# <font style="color:rgb(0, 0, 0);">六、你需要准备哪些材料</font>
## <font style="color:rgb(0, 0, 0);">1. 招募问卷</font>
<font style="color:rgb(0, 0, 0);">包括：</font>

+ <font style="color:rgb(0, 0, 0);">工具使用经验；</font>
+ <font style="color:rgb(0, 0, 0);">使用时长；</font>
+ <font style="color:rgb(0, 0, 0);">典型任务；</font>
+ <font style="color:rgb(0, 0, 0);">是否愿意回忆或展示脱敏案例；</font>
+ <font style="color:rgb(0, 0, 0);">是否做过长程 AI coding 任务。</font>

---

## <font style="color:rgb(0, 0, 0);">2. 访谈提纲</font>
<font style="color:rgb(0, 0, 0);">按上面的流程整理成正式 interview protocol。</font>

---

## <font style="color:rgb(0, 0, 0);">3. 上下文标注材料</font>
<font style="color:rgb(0, 0, 0);">建议准备 2 套：</font>

### <font style="color:rgb(0, 0, 0);">材料 A：需求变更案例</font>
<font style="color:rgb(0, 0, 0);">例如：</font>

+ <font style="color:rgb(0, 0, 0);">一开始要求 React；</font>
+ <font style="color:rgb(0, 0, 0);">中途改 Vue；</font>
+ <font style="color:rgb(0, 0, 0);">Agent 后续仍沿用 React 思路。</font>

<font style="color:rgb(0, 0, 0);">用于观察旧需求污染。</font>

### <font style="color:rgb(0, 0, 0);">材料 B：错误调试路径案例</font>
<font style="color:rgb(0, 0, 0);">例如：</font>

+ <font style="color:rgb(0, 0, 0);">Agent 一开始误判 bug 来自 UI；</font>
+ <font style="color:rgb(0, 0, 0);">后来发现其实是数据初始化；</font>
+ <font style="color:rgb(0, 0, 0);">但后续仍围绕 UI 修改。</font>

<font style="color:rgb(0, 0, 0);">用于观察错误路径继承。</font>

### <font style="color:rgb(0, 0, 0);">材料 C：多任务混杂案例</font>
<font style="color:rgb(0, 0, 0);">例如：</font>

+ <font style="color:rgb(0, 0, 0);">用户同时要求修 bug、改样式、重构；</font>
+ <font style="color:rgb(0, 0, 0);">Agent 后续无法区分当前目标。</font>

<font style="color:rgb(0, 0, 0);">用于观察上下文聚焦问题。</font>

---

## <font style="color:rgb(0, 0, 0);">4. 低保真设计探针</font>
<font style="color:rgb(0, 0, 0);">可以是简单线框图或文字卡片，不需要做完整产品。</font>

<font style="color:rgb(0, 0, 0);">建议准备 6 张卡片：</font>

1. <font style="color:rgb(0, 0, 0);">上下文概览；</font>
2. <font style="color:rgb(0, 0, 0);">关键约束列表；</font>
3. <font style="color:rgb(0, 0, 0);">历史片段保留 / 排除；</font>
4. <font style="color:rgb(0, 0, 0);">错误路径标记；</font>
5. <font style="color:rgb(0, 0, 0);">下一轮上下文预览；</font>
6. <font style="color:rgb(0, 0, 0);">多路径保存 / 回退。</font>

---

# <font style="color:rgb(0, 0, 0);">七、你要得到什么结果</font>
<font style="color:rgb(0, 0, 0);">Formative Study 结束后，你至少要产出 5 类结果。</font>

---

## <font style="color:rgb(0, 0, 0);">结果 1：上下文失效分类 Taxonomy of Context Breakdowns</font>
<font style="color:rgb(0, 0, 0);">例如：</font>

| <font style="color:rgb(0, 0, 0);">类型</font> | <font style="color:rgb(0, 0, 0);">描述</font> | <font style="color:rgb(0, 0, 0);">典型触发条件</font> | <font style="color:rgb(0, 0, 0);">用户影响</font> |
| --- | --- | --- | --- |
| <font style="color:rgb(0, 0, 0);">旧需求污染</font> | <font style="color:rgb(0, 0, 0);">旧需求继续影响 Agent</font> | <font style="color:rgb(0, 0, 0);">需求变更后未显式清理</font> | <font style="color:rgb(0, 0, 0);">反复纠正</font> |
| <font style="color:rgb(0, 0, 0);">错误路径继承</font> | <font style="color:rgb(0, 0, 0);">错误假设被继续使用</font> | <font style="color:rgb(0, 0, 0);">调试路径较长</font> | <font style="color:rgb(0, 0, 0);">修复成本增加</font> |
| <font style="color:rgb(0, 0, 0);">约束冲突</font> | <font style="color:rgb(0, 0, 0);">新旧约束混杂</font> | <font style="color:rgb(0, 0, 0);">用户多次修改目标</font> | <font style="color:rgb(0, 0, 0);">Agent 折中或误解</font> |
| <font style="color:rgb(0, 0, 0);">多任务混杂</font> | <font style="color:rgb(0, 0, 0);">目标无法聚焦</font> | <font style="color:rgb(0, 0, 0);">一个会话做多个任务</font> | <font style="color:rgb(0, 0, 0);">输出发散</font> |
| <font style="color:rgb(0, 0, 0);">上下文不可见</font> | <font style="color:rgb(0, 0, 0);">用户不知道 Agent 参考什么</font> | <font style="color:rgb(0, 0, 0);">长对话、压缩、记忆机制</font> | <font style="color:rgb(0, 0, 0);">控制感下降</font> |
| <font style="color:rgb(0, 0, 0);">重开成本高</font> | <font style="color:rgb(0, 0, 0);">干净会话丢失有效信息</font> | <font style="color:rgb(0, 0, 0);">上下文污染严重</font> | <font style="color:rgb(0, 0, 0);">手动搬运成本高</font> |


---

## <font style="color:rgb(0, 0, 0);">结果 2：用户修复策略分类 Taxonomy of Repair Strategies</font>
<font style="color:rgb(0, 0, 0);">例如：</font>

| <font style="color:rgb(0, 0, 0);">策略</font> | <font style="color:rgb(0, 0, 0);">优点</font> | <font style="color:rgb(0, 0, 0);">局限</font> |
| --- | --- | --- |
| <font style="color:rgb(0, 0, 0);">反复 prompt 纠正</font> | <font style="color:rgb(0, 0, 0);">快速、自然</font> | <font style="color:rgb(0, 0, 0);">错误上下文仍存在</font> |
| <font style="color:rgb(0, 0, 0);">新开会话</font> | <font style="color:rgb(0, 0, 0);">上下文干净</font> | <font style="color:rgb(0, 0, 0);">有效信息丢失</font> |
| <font style="color:rgb(0, 0, 0);">要求总结</font> | <font style="color:rgb(0, 0, 0);">降低搬运成本</font> | <font style="color:rgb(0, 0, 0);">总结可能不准</font> |
| <font style="color:rgb(0, 0, 0);">手动复制关键信息</font> | <font style="color:rgb(0, 0, 0);">可控</font> | <font style="color:rgb(0, 0, 0);">认知负担高</font> |
| <font style="color:rgb(0, 0, 0);">修改 rules 文件</font> | <font style="color:rgb(0, 0, 0);">稳定</font> | <font style="color:rgb(0, 0, 0);">不适合临时变化</font> |
| <font style="color:rgb(0, 0, 0);">清空上下文</font> | <font style="color:rgb(0, 0, 0);">彻底</font> | <font style="color:rgb(0, 0, 0);">过于粗粒度</font> |


---

## <font style="color:rgb(0, 0, 0);">结果 3：上下文调控对象 Context Objects</font>
<font style="color:rgb(0, 0, 0);">你要明确用户希望调控的到底是什么。</font>

<font style="color:rgb(0, 0, 0);">例如：</font>

| <font style="color:rgb(0, 0, 0);">对象</font> | <font style="color:rgb(0, 0, 0);">用户操作需求</font> |
| --- | --- |
| <font style="color:rgb(0, 0, 0);">当前需求</font> | <font style="color:rgb(0, 0, 0);">保留、强化</font> |
| <font style="color:rgb(0, 0, 0);">旧需求</font> | <font style="color:rgb(0, 0, 0);">排除、降权</font> |
| <font style="color:rgb(0, 0, 0);">错误路径</font> | <font style="color:rgb(0, 0, 0);">标记无效、隔离</font> |
| <font style="color:rgb(0, 0, 0);">关键报错</font> | <font style="color:rgb(0, 0, 0);">保留、引用</font> |
| <font style="color:rgb(0, 0, 0);">用户修正</font> | <font style="color:rgb(0, 0, 0);">提高优先级</font> |
| <font style="color:rgb(0, 0, 0);">项目规则</font> | <font style="color:rgb(0, 0, 0);">长期保留</font> |
| <font style="color:rgb(0, 0, 0);">方案分支</font> | <font style="color:rgb(0, 0, 0);">分开管理</font> |
| <font style="color:rgb(0, 0, 0);">临时尝试</font> | <font style="color:rgb(0, 0, 0);">局部保留</font> |


---

## <font style="color:rgb(0, 0, 0);">结果 4：设计原则 Design Implications</font>
<font style="color:rgb(0, 0, 0);">建议最后形成 4–6 条设计原则。</font>

<font style="color:rgb(0, 0, 0);">例如：</font>

### <font style="color:rgb(0, 0, 0);">DP1：Make effective context visible</font>
<font style="color:rgb(0, 0, 0);">系统应帮助用户看到或理解 Agent 当前可能依据的关键历史，而不只是展示完整聊天记录。</font>

### <font style="color:rgb(0, 0, 0);">DP2：Support lightweight context steering</font>
<font style="color:rgb(0, 0, 0);">系统应允许用户用低成本方式保留、排除、标记或调整历史信息，而不是依赖反复 prompt 纠正。</font>

### <font style="color:rgb(0, 0, 0);">DP3：Preserve useful continuity while reducing pollution</font>
<font style="color:rgb(0, 0, 0);">系统应帮助用户在清理错误上下文时保留仍然有效的需求、报错和项目背景。</font>

### <font style="color:rgb(0, 0, 0);">DP4：Support uncertainty and reversibility</font>
<font style="color:rgb(0, 0, 0);">用户可能不确定某段上下文是否应该删除，因此系统应支持可撤销、暂时隐藏、降低优先级等低风险操作。</font>

### <font style="color:rgb(0, 0, 0);">DP5：Balance automation and user agency</font>
<font style="color:rgb(0, 0, 0);">系统可以自动整理和推荐，但关键判断应允许用户确认，避免用户失去控制感。</font>

<font style="color:rgb(0, 0, 0);">你已有材料中也曾把 visibility、granularity、branchability 和 configurability 作为潜在设计原则，这可以作为初始框架，但不要在研究前过早固定。</font>

---

## <font style="color:rgb(0, 0, 0);">结果 5：系统功能需求 System Requirements</font>
<font style="color:rgb(0, 0, 0);">形成性研究最终要服务系统设计。</font>

<font style="color:rgb(0, 0, 0);">你可以把结果转化为功能需求：</font>

| <font style="color:rgb(0, 0, 0);">研究发现</font> | <font style="color:rgb(0, 0, 0);">系统需求</font> |
| --- | --- |
| <font style="color:rgb(0, 0, 0);">用户不知道 Agent 参考什么</font> | <font style="color:rgb(0, 0, 0);">提供上下文概览或 active context preview</font> |
| <font style="color:rgb(0, 0, 0);">用户反复纠正旧需求</font> | <font style="color:rgb(0, 0, 0);">支持标记旧需求为不再参考</font> |
| <font style="color:rgb(0, 0, 0);">用户担心误删有效信息</font> | <font style="color:rgb(0, 0, 0);">支持可撤销、临时排除</font> |
| <font style="color:rgb(0, 0, 0);">用户需要保留关键报错</font> | <font style="color:rgb(0, 0, 0);">支持 pin / keep</font> |
| <font style="color:rgb(0, 0, 0);">用户难以处理多路径</font> | <font style="color:rgb(0, 0, 0);">支持路径分离或任务阶段整理</font> |
| <font style="color:rgb(0, 0, 0);">用户不愿管理太细</font> | <font style="color:rgb(0, 0, 0);">提供 AI 自动摘要和推荐，但保留用户确认</font> |


---

# <font style="color:rgb(0, 0, 0);">八、数据分析怎么做</font>
<font style="color:rgb(0, 0, 0);">建议采用</font><font style="color:rgb(0, 0, 0);"> </font>**<font style="color:rgb(0, 0, 0);">thematic analysis / open coding + affinity diagramming</font>**<font style="color:rgb(0, 0, 0);">。</font>

## <font style="color:rgb(0, 0, 0);">第一步：转写和整理</font>
<font style="color:rgb(0, 0, 0);">每个访谈形成：</font>

+ <font style="color:rgb(0, 0, 0);">录音转写；</font>
+ <font style="color:rgb(0, 0, 0);">关键事件摘要；</font>
+ <font style="color:rgb(0, 0, 0);">用户使用工具背景；</font>
+ <font style="color:rgb(0, 0, 0);">上下文标注记录；</font>
+ <font style="color:rgb(0, 0, 0);">设计探针反馈。</font>

---

## <font style="color:rgb(0, 0, 0);">第二步：开放编码</font>
<font style="color:rgb(0, 0, 0);">初始编码可以包括：</font>

| <font style="color:rgb(0, 0, 0);">编码类别</font> | <font style="color:rgb(0, 0, 0);">示例代码</font> |
| --- | --- |
| <font style="color:rgb(0, 0, 0);">Breakdown</font> | <font style="color:rgb(0, 0, 0);">old requirement pollution, wrong path inheritance</font> |
| <font style="color:rgb(0, 0, 0);">Trigger</font> | <font style="color:rgb(0, 0, 0);">requirement change, long debugging, multi-tasking</font> |
| <font style="color:rgb(0, 0, 0);">User Strategy</font> | <font style="color:rgb(0, 0, 0);">reprompt, restart, summarize, copy context</font> |
| <font style="color:rgb(0, 0, 0);">Mental Model</font> | <font style="color:rgb(0, 0, 0);">“AI remembers everything”, “recent messages matter most”</font> |
| <font style="color:rgb(0, 0, 0);">Desired Control</font> | <font style="color:rgb(0, 0, 0);">remove, keep, pin, summarize, preview</font> |
| <font style="color:rgb(0, 0, 0);">Burden</font> | <font style="color:rgb(0, 0, 0);">too much reading, fear of deleting, uncertainty</font> |
| <font style="color:rgb(0, 0, 0);">Trust / Control</font> | <font style="color:rgb(0, 0, 0);">predictable, out of control, recoverable</font> |


---

## <font style="color:rgb(0, 0, 0);">第三步：聚类</font>
<font style="color:rgb(0, 0, 0);">把编码聚成主题，例如：</font>

1. <font style="color:rgb(0, 0, 0);">用户感知上下文污染，但难以定位来源；</font>
2. <font style="color:rgb(0, 0, 0);">用户依赖 prompt 修复，但修复方式不稳定；</font>
3. <font style="color:rgb(0, 0, 0);">重开会话是常见但高成本的恢复策略；</font>
4. <font style="color:rgb(0, 0, 0);">用户想控制上下文，但不想承担完整管理负担；</font>
5. <font style="color:rgb(0, 0, 0);">用户需要的是可恢复、可撤销、低风险的上下文调控。</font>

---

## <font style="color:rgb(0, 0, 0);">第四步：产出设计原则</font>
<font style="color:rgb(0, 0, 0);">每个设计原则都要由数据支持。</font>

<font style="color:rgb(0, 0, 0);">例如：</font>

<font style="color:rgb(0, 0, 0);">多位参与者表示不敢直接删除历史，因为担心丢失有用信息。  
</font><font style="color:rgb(0, 0, 0);">因此 DP4：系统应支持可撤销的上下文隐藏或降权，而不是永久删除。</font>

---

# <font style="color:rgb(0, 0, 0);">九、从参与者视角，他们会经历什么</font>
<font style="color:rgb(0, 0, 0);">你可以这样理解参与者流程：</font>

1. <font style="color:rgb(0, 0, 0);">先介绍自己怎么用 Coding Agent；</font>
2. <font style="color:rgb(0, 0, 0);">回忆一次 Agent 被历史带偏的经历；</font>
3. <font style="color:rgb(0, 0, 0);">解释自己当时如何修复；</font>
4. <font style="color:rgb(0, 0, 0);">看一段长对话，标出哪些历史还该保留、哪些不该影响后续；</font>
5. <font style="color:rgb(0, 0, 0);">看几个低保真设计想法，说哪些对他们有用，哪些会增加负担；</font>
6. <font style="color:rgb(0, 0, 0);">最后总结他们理想中的上下文控制方式。</font>

<font style="color:rgb(0, 0, 0);">这样参与者不会觉得自己在“评审你的系统”，而是在帮助你理解真实使用问题。</font>

---

# <font style="color:rgb(0, 0, 0);">十、从指导老师视角，你这项研究要避免什么</font>
## <font style="color:rgb(0, 0, 0);">1. 不要把 Formative Study 做成“功能投票”</font>
<font style="color:rgb(0, 0, 0);">不要问：</font>

<font style="color:rgb(0, 0, 0);">你想不想要删除功能？  
</font><font style="color:rgb(0, 0, 0);">你想不想要分支功能？  
</font><font style="color:rgb(0, 0, 0);">你想不想要上下文面板？</font>

<font style="color:rgb(0, 0, 0);">这会得到很浅的答案。</font>

<font style="color:rgb(0, 0, 0);">你应该问：</font>

<font style="color:rgb(0, 0, 0);">你在哪个具体任务中需要排除历史信息？  
</font><font style="color:rgb(0, 0, 0);">如果不能排除，你怎么处理？  
</font><font style="color:rgb(0, 0, 0);">你怎么判断那段信息不该再影响 Agent？  
</font><font style="color:rgb(0, 0, 0);">你愿意自己判断，还是希望系统推荐？</font>

---

## <font style="color:rgb(0, 0, 0);">2. 不要过早假设“区块化”是答案</font>
<font style="color:rgb(0, 0, 0);">现在你的研究核心是</font><font style="color:rgb(0, 0, 0);"> </font>**<font style="color:rgb(0, 0, 0);">context steering</font>**<font style="color:rgb(0, 0, 0);">，不是 block-based editor。</font>

<font style="color:rgb(0, 0, 0);">所以访谈中不要一直强调 block、分段、拖拽。你可以观察用户是否自然需要：</font>

+ <font style="color:rgb(0, 0, 0);">阶段；</font>
+ <font style="color:rgb(0, 0, 0);">片段；</font>
+ <font style="color:rgb(0, 0, 0);">任务路径；</font>
+ <font style="color:rgb(0, 0, 0);">关键约束；</font>
+ <font style="color:rgb(0, 0, 0);">错误链条；</font>
+ <font style="color:rgb(0, 0, 0);">当前有效上下文。</font>

<font style="color:rgb(0, 0, 0);">如果用户确实以这些方式理解上下文，再把它转化成系统结构。</font>

---

## <font style="color:rgb(0, 0, 0);">3. 不要只招募程序员</font>
<font style="color:rgb(0, 0, 0);">你的核心场景是 Coding Agent，但用户不一定都要是专业开发者。可以包括：</font>

+ <font style="color:rgb(0, 0, 0);">CS 学生；</font>
+ <font style="color:rgb(0, 0, 0);">设计师用 AI coding 做网页；</font>
+ <font style="color:rgb(0, 0, 0);">研究人员写脚本；</font>
+ <font style="color:rgb(0, 0, 0);">产品/交互设计学生用 Agent 搭原型。</font>

<font style="color:rgb(0, 0, 0);">但他们必须有一定 AI coding 使用经验，否则访谈会变成工具入门问题。</font>

---

## <font style="color:rgb(0, 0, 0);">4. 不要只收集“失败案例”</font>
<font style="color:rgb(0, 0, 0);">也要问用户什么时候觉得自己成功控制住了 Agent。</font>

<font style="color:rgb(0, 0, 0);">因为你的系统不只要解决 breakdown，也要理解成功的 control strategy。</font>

<font style="color:rgb(0, 0, 0);">可以问：</font>

<font style="color:rgb(0, 0, 0);">有没有一次你觉得成功把 Agent 从错误方向拉回来了？  
</font><font style="color:rgb(0, 0, 0);">你做对了什么？  
</font><font style="color:rgb(0, 0, 0);">这个经验能否被系统支持？</font>

---

# <font style="color:rgb(0, 0, 0);">十一、最终你应该得到的结构</font>
<font style="color:rgb(0, 0, 0);">Formative Study 完成后，论文里可以这样写结果结构：</font>

## <font style="color:rgb(0, 0, 0);">4 Formative Study</font>
### <font style="color:rgb(0, 0, 0);">4.1 Participants and Procedure</font>
<font style="color:rgb(0, 0, 0);">介绍参与者、工具经验、访谈流程。</font>

### <font style="color:rgb(0, 0, 0);">4.2 Data Collection and Analysis</font>
<font style="color:rgb(0, 0, 0);">介绍访谈、上下文标注、设计探针，以及编码分析方法。</font>

### <font style="color:rgb(0, 0, 0);">4.3 Findings</font>
**<font style="color:rgb(0, 0, 0);">Finding 1：Users experience context breakdowns as loss of task direction</font>**<font style="color:rgb(0, 0, 0);">  
</font><font style="color:rgb(0, 0, 0);">用户不是简单觉得 Agent 出错，而是觉得任务方向被旧信息带偏。</font>

**<font style="color:rgb(0, 0, 0);">Finding 2：Users repair context through indirect and costly strategies</font>**<font style="color:rgb(0, 0, 0);">  
</font><font style="color:rgb(0, 0, 0);">用户主要靠 prompt、新会话、总结和手动搬运，但这些方式不稳定。</font>

**<font style="color:rgb(0, 0, 0);">Finding 3：Users need to steer influence, not simply delete history</font>**<font style="color:rgb(0, 0, 0);">  
</font><font style="color:rgb(0, 0, 0);">用户想调控的是历史信息对后续行为的影响，而不只是删除聊天记录。</font>

**<font style="color:rgb(0, 0, 0);">Finding 4：Users want automation, but not full automation</font>**<font style="color:rgb(0, 0, 0);">  
</font><font style="color:rgb(0, 0, 0);">用户希望系统帮助整理，但关键决策仍要可见、可撤销、可确认。</font>

### <font style="color:rgb(0, 0, 0);">4.4 Design Implications</font>
+ <font style="color:rgb(0, 0, 0);">DI1：Expose task-relevant context states；</font>
+ <font style="color:rgb(0, 0, 0);">DI2：Support lightweight include / exclude / downgrade operations；</font>
+ <font style="color:rgb(0, 0, 0);">DI3：Preserve continuity while removing pollution；</font>
+ <font style="color:rgb(0, 0, 0);">DI4：Provide reversible and previewable context changes；</font>
+ <font style="color:rgb(0, 0, 0);">DI5：Balance system recommendation with user confirmation。</font>

---

# <font style="color:rgb(0, 0, 0);">十二、最推荐你的实际执行方案</font>
<font style="color:rgb(0, 0, 0);">你现在可以这样开始：</font>

1. **<font style="color:rgb(0, 0, 0);">先准备访谈提纲</font>**<font style="color:rgb(0, 0, 0);">：围绕使用背景、关键事件、修复策略、上下文标注、设计探针。</font>
2. **<font style="color:rgb(0, 0, 0);">准备 2–3 个模拟长对话材料</font>**<font style="color:rgb(0, 0, 0);">：需求变更、错误调试、多任务混杂。</font>
3. **<font style="color:rgb(0, 0, 0);">招募 10–12 位有 AI coding 经验的用户</font>**<font style="color:rgb(0, 0, 0);">。</font>
4. **<font style="color:rgb(0, 0, 0);">每人 60–75 分钟访谈</font>**<font style="color:rgb(0, 0, 0);">。</font>
5. **<font style="color:rgb(0, 0, 0);">对访谈转写做开放编码</font>**<font style="color:rgb(0, 0, 0);">。</font>
6. **<font style="color:rgb(0, 0, 0);">总结上下文失效类型、修复策略、调控对象和设计原则</font>**<font style="color:rgb(0, 0, 0);">。</font>
7. **<font style="color:rgb(0, 0, 0);">把这些结果转化为系统功能需求</font>**<font style="color:rgb(0, 0, 0);">。</font>

<font style="color:rgb(0, 0, 0);">最关键的是，Formative Study 的产出一定要能回答：</font>

**<font style="color:rgb(0, 0, 0);">为什么你的系统应该这样设计？</font>**

<font style="color:rgb(0, 0, 0);">而不是只回答：</font>

<font style="color:rgb(0, 0, 0);">用户说他们想要什么。</font>

- [ ] 

<font style="color:rgb(0, 0, 0);">  
</font>

