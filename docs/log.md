1. 服务端修改到什么程度？

核心服务端逻辑已写入源码并成功编译进新 exe：

- 新版 exe 已替换到 C:\Users\LYin\.opencode\bin\opencode.exe
- 旧 exe 已保留两份备份
- 新构建服务已在 4097 验证可访问
- 但正式的 4096 服务目前未重新启动；启动后，前端才能实际使用新版筛选逻辑

所以：代码、编译、替换都完成了；还差把新版 exe 作为 4096 后端正常拉起并做最终对话验收。

2. 具体怎么改、改了哪里？

服务端关键改动在：

src/model/opencode/packages/opencode/src/session/prompt.ts

新增/接入了 selectedCardContext()。流程是：

1. 前端发送当前用户消息时，在一个 ignored 文本 part 里保存标记：

   {
   "contextpilot.context-part-ids": ["part_1", "part_2"]
   }

2. 这个数组只包含“当前被选中的卡片”所关联的历史 part.id。
3. 服务端构造模型上下文时，读取这份标记：
    - 始终保留当前轮对话；
    - 对历史对话，只保留 part.id 出现在数组里的内容；
    - 未选中卡片关联的 part 不会进入传给模型的 messages。

也就是说，part 表仍保存完整历史；并不是删除未选中 part，而是在服务端真正调用模型前过滤它们。

前端关联逻辑主要在：

- src/model/chatAdapter.js
    - 生成 contextpilot.context-part-ids
    - 将总结卡片关联到真实 OpenCode part.id
    - 补全、校验卡片和 part 的关系

- src/App.vue
    - 新生成或内容更新的卡片默认 selected: true
    - 保存卡片的选中状态和关联 part

- docs/context-card-context-linkage.md
    - 完整的关联链路和测试说明

3. 如何编译为 exe 作为后端？

在项目根目录执行：

cd C:\Users\LYin\Projects\contextpilot\src\model\opencode
bun install --frozen-lockfile

cd packages\opencode
bun run build -- --single --skip-install --skip-embed-web-ui

生成文件：

src\model\opencode\packages\opencode\dist\opencode-windows-x64\bin\opencode.exe

若还需要 OpenCode 自带 Web UI，把最后的 --skip-embed-web-ui 去掉即可，但会明显更慢、更占内存。

替换时建议：

# 先备份
Copy-Item `
    'C:\Users\LYin\.opencode\bin\opencode.exe' `
'C:\Users\LYin\.opencode\bin\opencode.exe.backup'

# 再复制新文件
Copy-Item `
    '...\dist\opencode-windows-x64\bin\opencode.exe' `
'C:\Users\LYin\.opencode\bin\opencode.exe' -Force

# 启动后端
& 'C:\Users\LYin\.opencode\bin\opencode.exe' serve --port 4096 --hostname 127.0.0.1

本次操作与当前状态也记录在：docs/opencode-executable-update-20260722.md:1。