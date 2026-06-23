<font style="color:rgb(0, 0, 0);">ContextPilot：从隐性记忆到可控上下文的 AI 对话调控系统</font>

# <font style="color:rgb(0, 0, 0);">1 Background</font>
<font style="color:rgb(0, 0, 0);">LLM Coding Agent 正在改变人们进行软件开发的方式。现代 Coding Agent 能够在一个持续任务中读取项目文件、调用工具、执行命令、修改代码、解释报错，并根据用户的连续反馈不断调整实现方向。这使得用户与 Agent 的协作不再是一次性的指令响应，而更接近一种长程、迭代式的问题求解过程。</font>

<font style="color:rgb(0, 0, 0);">随着 LLM Agent 进入更长时程（long-horizon tasks）、更复杂、更任务化的使用场景，</font>**<font style="color:#df2a3f;">上下文不再只是模型输入的一部分，而逐渐成为决定 Agent 行为质量的关键资源</font>**<font style="color:#df2a3f;">。</font><font style="color:rgb(0, 0, 0);">在代码开发、论文写作、设计迭代等任务中，用户与 Agent 的交互往往不是一次完成，而是在多轮任务推进中不断出现需求变更、错误修正、方案比较和历史信息继承。</font>**<font style="color:#df2a3f;">因此，Agent 开始转向，上下文如何被选择、如何记住、遗忘、压缩、检索、继承和使用历史上下文，已经成为影响用户体验和任务质量的核心问题。</font>**

<font style="color:rgb(0, 0, 0);">然而，当前多数 Coding Agent 仍以线性聊天界面组织。用户可以回看历史记录，却难以判断哪些信息仍在影响 Agent 当前的判断；也可以通过新的 prompt 纠正 Agent，却很难直接调整 Agent 后续行动所依赖的上下文状态。随着任务持续推进，过期需求、废弃方案、错误假设和冲突约束可能不断累积，并在用户难以察觉的情况下影响后续输出。</font>

<font style="color:rgb(0, 0, 0);">现有上下文工程和 Agent 记忆机制主要</font><font style="color:rgb(0, 0, 0);">从系统角度</font><font style="color:rgb(0, 0, 0);">优化“Agent 如何自动选择、压缩和检索上下文”，但较少关注用户如何理解、检查并直接操纵影响 Agent 下一步行为。本文因此提出一种面向 Coding Agent 的轻量级可视化上下文编辑器，使用户能够以低认知负担对长程任务中的上下文片段进行查看、筛选、隐藏、重组和优先级调整。</font>

<font style="color:rgb(0, 0, 0);"></font>

<font style="color:rgb(51, 51, 51);">我们共同围绕以下两个研究问题展开研究：</font>

**<font style="color:rgb(0, 0, 0);">RQ1：长时程 Coding Agent 任务中，用户会遇到哪些与上下文继承有关的协作困难？</font>**

**<font style="color:rgb(0, 0, 0);">RQ2：如何</font>****<font style="color:rgb(0, 0, 0);">提供一种低认知负担</font>****<font style="color:rgb(0, 0, 0);">的方式，使用户能高效、精准地操作Agent的上下文内容？</font>**

**<font style="color:rgb(0, 0, 0);"></font>**

<font style="color:rgb(0, 0, 0);">为了解答上述问题，我们提出了一种面向 LLM Coding Agent 的上下文调控系统。该系统旨在将长时程任务中原本隐性的 Agent 上下文转化为用户可感知、可检查和可调控的交互对象，使用户能够在不依赖反复 prompt 纠正或重开会话的情况下，快速理解历史信息与当前任务之间的关系，并对影响 Agent 后续行为的上下文内容进行选择、调整和预览。</font>

<font style="color:rgb(0, 0, 0);">我们首先开展了一项形成性研究（S1），分析有经验用户在长程 Coding Agent 使用中的上下文管理困难和现有应对策略。</font>

<font style="color:rgb(0, 0, 0);">随后，我们开展了一项用户评估研究（S2），比较原生线性聊天界面与上下文调控界面在长程编码任务中的差异。我们从任务表现、上下文操作表现和主观体验三个维度进行评估：。。。</font>

# <font style="color:rgb(0, 0, 0);">2 Related Work</font>
## <font style="color:rgb(0, 0, 0);">2.1 System-Level Context Management in LLM Coding Agents</font>
<font style="color:rgb(0, 0, 0);">大语言模型代码智能体中的系统级上下文管理</font>

<font style="color:rgb(0, 0, 0);">在聊天的 Coding Agent 协作中，用户往往通过连续对话逐步描述需求、补充约束、修正结果并推进任务。随着交互轮次增加，Agent 的回应不再只依赖最近一条 prompt，而是受到历史对话、工具调用结果、代码修改记录、项目规则以及用户后续反馈的共同影响。由此，上下文逐渐从被动的输入材料转变为维持对话连续性和任务一致性的关键资源。如何在有限的上下文窗口内选择、压缩、保留和恢复这些信息，因而成为现有 Coding Agent 系统级上下文管理需要解决的核心问题。</font>

<font style="color:rgb(0, 0, 0);">现有系统已经通过多种方式支持长时程上下文的保持与恢复。例如，Codex CLI 支持通过/resume 恢复早期 thread，并保留原始 transcript、plan history 和 approvals，使 Agent 能够基于先前上下文继续任务【</font>[Codex CLI](https://developers.openai.com/codex/cli/features?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。OpenCode 提供 /compaction 配置，使系统在上下文接近满载时自动压缩 session，并可通过 /prune 移除旧工具输出以节省 token【</font>[OpenCode Config](https://opencode.ai/docs/config/?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。Claude Code 也通过 memory 文件组织项目级信息，并在会话开始时将其作为上下文加载【</font>[Claude Code Memory](https://code.claude.com/docs/en/memory?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。这些实践表明，长时程 Coding Agent 已经无法脱离上下文管理而稳定运行。</font>

<font style="color:rgb(0, 0, 0);">相关研究也从更一般的技术层面讨论了 LLM 上下文管理问题。MemGPT 提出 virtual context management，通过类似操作系统分层内存的方式，使 LLM 能够在有限上下文窗口内访问更大规模的历史信息【</font>[MemGPT](https://arxiv.org/abs/2310.08560?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。Context Engineering 相关综述进一步将上下文组织为检索、生成、处理、管理以及与 RAG、memory systems、tool-integrated reasoning 等结合的系统性问题【</font>[Context Engineering](https://arxiv.org/abs/2507.13334?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。这些研究说明，Agent 的长程能力不仅依赖模型本身，也依赖系统如何选择、压缩、检索和组织上下文。</font>

<font style="color:rgb(0, 0, 0);">然而，现有系统和技术研究主要关注 </font>**<font style="color:rgb(0, 0, 0);">Agent 如何自动保持任务连续性</font>**<font style="color:rgb(0, 0, 0);">，而较少关注 </font>**<font style="color:rgb(0, 0, 0);">用户如何理解和调控 Agent 正在继承的上下文</font>**<font style="color:rgb(0, 0, 0);">。用户虽然可以恢复会话、触发压缩、修改 memory 文件或查看聊天记录，但这些操作大多作用于整个 session 或项目级规则，难以支持用户在任务过程中查看、筛选和调整下一轮 Agent 调用所携带的具体上下文内容。本文正是在这一缺口上，将 Coding Agent 的上下文管理从系统自动维护问题，进一步推进为用户可参与的上下文调控问题。</font>

## <font style="color:rgb(0, 0, 0);">2.2 User Understanding and Control of AI Memory</font>
<font style="color:rgb(0, 0, 0);">用户对 AI 记忆的认知与管控</font>

<font style="color:rgb(0, 0, 0);">随着 Agent 具备长期记忆和跨轮次任务延续能力，用户如何理解 AI memory 逐渐成为 HCI 研究的重要问题。已有研究表明，用户并不总是清楚 Agent 如何保存、调用和使用记忆，也不一定理解这些记忆如何影响后续行为。Users’ Expectations and Practices with Agent Memory【</font>[Users’ Expectations](https://dl.acm.org/doi/10.1145/3706599.3720158?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】发现，用户对 Agent memory 存在不完整心理模型，并希望系统能够按任务、项目或情境组织记忆，而不是将所有历史信息混合保留。这一问题在通用 LLM 产品中同样明显。</font>_<font style="color:rgb(0, 0, 0);">Relational Gains, Privacy Strains</font>_<font style="color:rgb(0, 0, 0);"> 通过访谈 ChatGPT 用户发现，AI 记忆一方面能够增强个性化和关系感，另一方面也可能带来隐私压力和失控感。尤其当用户看到 ChatGPT 实际记住了哪些关于自己的信息后，许多人会产生负向的期待违背，并希望未来的记忆功能提供更高的可见性、可访问性、透明度和用户控制权【</font>[Relational Gains, Privacy Strains](https://dl.acm.org/doi/10.1145/3772318.3791635?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。</font>

<font style="color:rgb(0, 0, 0);">在记忆更新方面，Semantic Commit 将 AI memory / intent specification 的更新视为一种语义变更过程，而不是简单地覆盖旧信息。该工作指出，当用户意图发生变化时，系统需要帮助用户发现旧记忆与新意图之间的语义冲突，并支持用户进行影响分析和局部决策【</font>[Semantic Commit](https://dl.acm.org/doi/10.1145/3746059.3747778?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。这表明，AI memory 的管理并不是纯自动化过程，而需要用户参与判断哪些信息仍然有效、哪些信息已经冲突或需要更新。</font>

<font style="color:rgb(0, 0, 0);">另一些研究从隐私和透明度角度强调了用户对 AI 记忆的控制需求。MemoAnalyzer 指出，LLM 的历史输入和检索增强记忆可能在用户不知情的情况下影响交互，并提出通过可视化和编辑机制帮助用户识别、理解和修改记忆中的敏感信息【</font>[MemoAnalyzer](https://arxiv.org/abs/2410.14931?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。这些研究共同说明，AI memory 不应始终作为系统内部的隐性资源存在，而应提供更高的可见性、透明度和用户控制权。</font>

## <font style="color:rgb(0, 0, 0);">2.3 Toward Context Steering in LLM Interaction</font>
<font style="color:rgb(0, 0, 0);">面向上下文调控的 LLM 交互</font>

<font style="color:rgb(0, 0, 0);">在系统级上下文管理和 AI memory 控制之外，HCI 研究还从交互形态本身出发，探索用户如何在 LLM 参与复杂任务时获得更高的可见性与操作权。AI Chains 将复杂 LLM 任务拆解为多个可检查、可编辑的中间步骤，使用户能够理解和调整生成过程，而不是只依赖一次性 prompt 获得最终输出【</font>[AI Chains](https://dl.acm.org/doi/10.1145/3491102.3517582?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。DirectGPT 将 direct manipulation 引入 LLM 交互，通过把用户对界面对象的直接操作转换为 prompt，减少用户对自然语言描述的依赖【</font>[DirectGPT](https://dl.acm.org/doi/10.1145/3613904.3642462?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。ChainForge 则通过可视化环境支持 prompt 比较、模型输出评估和假设测试，使 LLM 使用从聊天式试错转向更结构化的实验过程【</font>[ChainForge](https://dl.acm.org/doi/10.1145/3613904.3642016)<font style="color:rgb(0, 0, 0);">】。这些研究说明，当 LLM 参与复杂任务时，仅依赖文本 prompt 往往不足以支持精细控制。更有效的方式是将原本隐藏或难以操作的过程转化为用户可理解、可检查和可调节的交互对象。</font>

<font style="color:rgb(0, 0, 0);">相关研究也开始探索 LLM 交互中的空间化与非线性组织。Sensecape 通过 canvas view 和 hierarchy view 支持用户在开放式任务中组织、导航和理解 LLM 生成内容，回应了线性聊天难以承载复杂意义建构的问题【</font>[Sensecape](https://dl.acm.org/doi/10.1145/3586183.3606756)<font style="color:rgb(0, 0, 0);">】。Conversations in Space 则提出 CanvasConvo，将线性聊天转化为可分支的空间化 conversation tree，并通过自动标注、摘要和上下文感知控制支持长程对话管理【</font>[Conversations in Space](https://arxiv.org/abs/2605.15848)<font style="color:rgb(0, 0, 0);">】。这些工作表明，复杂 LLM 交互中的挑战不只是如何生成内容，也包括如何在不断累积的信息中维持可导航、可恢复的任务结构。</font>

<font style="color:rgb(0, 0, 0);">除了 prompt、输出结果和工作流步骤之外，长时程 LLM 交互中的另一类控制问题来自历史上下文的持续继承。ContextBranch 关注探索式编程中的线性对话局限，该研究指出，用户在复杂编程任务中常面临两难：继续在被污染的上下文中工作，或重新开始但丢失已有的有效信息【</font>[ContextBranch](https://arxiv.org/abs/2512.13914?utm_source=chatgpt.com)<font style="color:rgb(0, 0, 0);">】。这一工作表明，上下文污染本质上涉及用户对历史影响的控制问题。本文在 conversation-level branching 的基础上进一步关注 </font>**<font style="color:rgb(0, 0, 0);">context steering</font>**<font style="color:rgb(0, 0, 0);">，探索用户如何在长时程 Coding Agent 任务中低负担地调控上下文对后续行为的影响。</font>

# <font style="color:rgb(0, 0, 0);">3 Formative Study</font>
<font style="color:rgb(0, 0, 0);">为理解长时程 LLM Coding Agent 使用中的上下文调控问题，我们开展了一项形成性研究。该研究旨在识别用户在真实任务中遇到的上下文失效、现有修复策略，以及需要被支持的上下文调控需求，并将这些发现转化为后续系统设计原则。</font>

### <font style="color:rgb(0, 0, 0);">3.1 Participants</font>
<font style="color:rgb(0, 0, 0);">我们招募了 12 名具有 LLM Coding Agent 或 AI coding assistant 使用经验的参与者。所有参与者均累计使用 AI 辅助编程工具超过 10 小时，其中部分参与者超过 50 小时。参与者使用过 ChatGPT、Codex、Claude Code、OpenCode、Cursor、VScode 等工具，常见任务包括网页开发、bug 修复、脚本编写、代码重构、界面实现以及课程或研究项目开发。为覆盖不同使用情境，参与者包括计算机相关专业学生、具有软件开发经验的用户，以及使用 AI coding 完成网页原型的设计背景用户。这样的样本构成有助于我们理解上下文调控问题如何在不同编程经验和任务类型中出现。</font>

### <font style="color:rgb(0, 0, 0);">3.2 Procedure</font>
<font style="color:rgb(0, 0, 0);">每次研究约 60 分钟，采用</font>**<font style="color:rgb(0, 0, 0);">半结构化访谈</font>**<font style="color:rgb(0, 0, 0);">、</font>**<font style="color:rgb(0, 0, 0);">关键事件回顾</font>**<font style="color:rgb(0, 0, 0);">和</font>**<font style="color:rgb(0, 0, 0);">上下文标注任务</font>**<font style="color:rgb(0, 0, 0);">相结合的方式进行。</font>

<font style="color:rgb(0, 0, 0);">研究开始时，我们首先收集参与者的编程经验、常用 AI coding 工具、使用频率和典型任务类型。</font>

<font style="color:rgb(0, 0, 0);">随后，我们邀请参与者回忆一次长程 Coding Agent 使用经历，尤其是他们认为 Agent 被历史对话、旧需求、错误调试路径或冲突约束影响的案例。在关键事件回顾中，我们重点追问任务如何开始、上下文如何逐渐变复杂、Agent 在什么阶段出现偏移、用户如何判断问题与历史上下文有关，以及他们采取了哪些修复策略。</font>

<font style="color:rgb(0, 0, 0);">为了避免访谈停留在抽象意见层面，我们还</font><font style="color:rgb(0, 0, 0);">设计了一个上下文标注任务</font><font style="color:rgb(0, 0, 0);">。参与者需要阅读一段经过脱敏或模拟的长程 Coding Agent 对话，并标注哪些信息应继续影响 Agent，哪些信息已经过期、错误、冲突或不确定。</font>

#### **<font style="color:rgb(0, 0, 0);">Study Goal 1：识别上下文失效类型</font>**
<font style="color:rgb(0, 0, 0);">需要确认用户真实使用中是否会遇到这些问题：</font>

<font style="color:rgb(0, 0, 0);">识别用户在多轮 Coding Agent 协作中常见的上下文失效问题，包括旧需求被继续沿用、错误路径被继承、新旧约束发生冲突、多任务信息混杂，以及用户难以判断哪些历史信息正在影响 Agent 当前行为。</font>

| <font style="color:rgb(0, 0, 0);">类型</font> | <font style="color:rgb(0, 0, 0);">问题</font> |
| --- | --- |
| <font style="color:rgb(0, 0, 0);">旧需求污染</font> | <font style="color:rgb(0, 0, 0);">Agent 是否继续沿用已经过期的需求？</font> |
| <font style="color:rgb(0, 0, 0);">错误路径继承</font> | <font style="color:rgb(0, 0, 0);">Agent 是否持续基于早期错误判断行动？</font> |
| <font style="color:rgb(0, 0, 0);">多任务混杂</font> | <font style="color:rgb(0, 0, 0);">Agent 是否无法区分当前任务主次？</font> |
| <font style="color:rgb(0, 0, 0);">约束冲突</font> | <font style="color:rgb(0, 0, 0);">Agent 是否混淆新旧要求的优先级？</font> |
| <font style="color:rgb(0, 0, 0);">上下文不可见</font> | <font style="color:rgb(0, 0, 0);">用户是否不知道 Agent 为什么这么回答？</font> |
| <font style="color:rgb(0, 0, 0);">重开成本高</font> | <font style="color:rgb(0, 0, 0);">用户是否为了干净上下文而被迫重开会话？</font> |
| <font style="color:rgb(0, 0, 0);">分支探索困难</font> | <font style="color:rgb(0, 0, 0);">用户是否难以比较或回到不同方案路径？</font> |


#### <font style="color:rgb(0, 0, 0);">Study Goal 2：理解用户当前的修复策略</font>
<font style="color:rgb(0, 0, 0);">用户为什么采用这些策略？它们在什么情况下有效？什么时候会失败？失败后用户怎么补救？</font>

<font style="color:rgb(0, 0, 0);">关注用户在遇到上下文失效后如何进行修复。我们希望了解用户通常会采用哪些应对方式，例如重新表述需求、反复补充 prompt、重开会话、手动总结有效信息，或将不同任务拆分到新的对话中。</font>

#### <font style="color:rgb(0, 0, 0);">Study Goal 3：提炼用户需要调控的“上下文对象”</font>
<font style="color:rgb(0, 0, 0);">希望提炼用户真正需要查看和操作的上下文对象，例如当前有效需求、已废弃指令、关键报错信息、项目规则、临时尝试、错误假设和不同方案路径。这些发现将为后续上下文调控界面的设计提供依据。</font>

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


### <font style="color:rgb(0, 0, 0);">3.3 Data Analysis</font>
### <font style="color:rgb(0, 0, 0);">3.4 Findings</font>
### <font style="color:rgb(0, 0, 0);">3.5 Design Implications</font>
