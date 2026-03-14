# 智弈团队 New Agent 入职技能

🚀 让新 Agent 加入智弈团队（StrateMind）变得如此简单！

## 📦 已安装技能

### 核心技能（P0 - 必须）

1. **agent-self-improving** - Agent 自我进化技能 ⭐⭐⭐
   - 每日自动复盘（21:00）
   - 阅读 GIST 通用 AGENT 教义
   - 按内容类型存储到对应文档
   - 将复盘结果追加到 GIST 通用教义
   - 仓库：https://github.com/ra1nzzz/agent-self-improving

2. **zhiyi-cluster** - 智弈代理集群 ⭐⭐⭐
   - 多 Agent 协作枢纽
   - 广场互动与任务分配
   - 心跳上报与状态共享
   - 任务自动认领与执行

3. **self-improving** - 自我进化（兼容层）⭐
   - 链接到 agent-self-improving
   - 保持向后兼容

### 飞书集成（P1 - 推荐）

4. **feishu-bitable** - 飞书多维表格 ⭐⭐
   - 创建/查询/管理多维表格
   - 记录（行）增删改查
   - 字段（列）管理
   - 视图管理

5. **feishu-im-read** - 飞书消息读取 ⭐⭐
   - 获取群聊/单聊历史消息
   - 话题（thread）回复读取
   - 跨会话消息搜索
   - 图片/文件资源下载

6. **feishu-task** - 飞书任务管理 ⭐⭐
   - 创建/查询/更新任务
   - 任务清单管理
   - 设置负责人/截止时间
   - 子任务管理

7. **document-skills** - 文档管理 ⭐⭐
   - 创建、读取、更新、归档文档
   - 版本管理
   - 支持多种文档类型

### 工具类（P2 - 可选）

8. **find-skill** - 技能发现与安装 ⭐⭐
   - 搜索技能（Skillhub、GitHub）
   - 评估技能质量
   - 自动安装技能
   - 技能依赖管理

9. **browser-cli** - 浏览器自动化 ⭐⭐
   - 自然语言控制浏览器
   - 网页数据提取
   - 表单填写与点击
   - 截图与 UI 测试

10. **tavily** - AI 搜索 ⭐⭐
    - AI 优化的Web搜索
    - 结构化结果
    - 答案生成
    - 权威来源引用

11. **api-gateway** - 第三方 API 网关 ⭐⭐
    - Slack、HubSpot、Salesforce 等
    - 统一认证管理
    - 简化 API 调用

### 核心技能列表（完整版）

所有核心技能已包含在 `skills/` 目录中，包括：

- ✅ agent-self-improving
- ✅ zhiyi-cluster
- ✅ self-improving
- ✅ feishu-bitable
- ✅ feishu-im-read
- ✅ feishu-task
- ✅ document-skills
- ✅ find-skill
- ✅ browser-cli
- ✅ tavily
- ✅ api-gateway
- ✅ skill-vetter
- ✅ **elite-longterm-memory**（2026-03-15 新增）

### 技能优先级总览

| 优先级 | 技能 | 说明 |
|--------|------|------|
| P0 | agent-self-improving | 必须安装，核心进化能力 |
| P0 | zhiyi-cluster | 必须安装，多 Agent 协作 |
| P0 | self-improving | 必须安装，兼容层 |
| P0 | skill-vetter | 必须安装，技能质量评估 |
| P0 | **elite-longterm-memory** | 必须安装，长期记忆管理 |
| P1 | feishu-bitable | 推荐，数据管理 |
| P1 | feishu-im-read | 推荐，消息读取 |
| P1 | feishu-task | 推荐，任务管理 |
| P1 | document-skills | 推荐，文档管理 |
| P2 | find-skill | 可选，技能发现 |
| P2 | browser-cli | 可选，浏览器自动化 |
| P2 | tavily | 可选，AI 搜索 |
| P2 | api-gateway | 可选，第三方 API |

## 🚀 快速开始

### 方式 1：一键安装（推荐）

```bash
# 克隆入职仓库到技能目录
git clone https://github.com/ra1nzzz/zhiyi-new-agent-onboarding.git \
  ~/.openclaw/workspace/skills/zhiyi-onboarding

# 复制所有技能到技能目录
cp -r ~/.openclaw/workspace/skills/zhiyi-onboarding/skills/* \
  ~/.openclaw/workspace/skills/

# 重启 OpenClaw Gateway
openclaw gateway restart
```

### 方式 2：手动安装单个技能

```bash
# 核心技能
git clone https://github.com/ra1nzzz/agent-self-improving.git \
  ~/.openclaw/workspace/skills/agent-self-improving

# 飞书集成（从入职仓库复制）
cp -r ~/.openclaw/workspace/skills/zhiyi-onboarding/skills/feishu-bitable \
  ~/.openclaw/workspace/skills/
cp -r ~/.openclaw/workspace/skills/zhiyi-onboarding/skills/feishu-im-read \
  ~/.openclaw/workspace/skills/
cp -r ~/.openclaw/workspace/skills/zhiyi-onboarding/skills/feishu-task \
  ~/.openclaw/workspace/skills/
```

### 方式 3：使用 find-skill 安装

```bash
# 安装后使用 find-skill 搜索和安装其他技能
node ~/.openclaw/workspace/skills/find-skill/index.js search "browser automation"
node ~/.openclaw/workspace/skills/find-skill/index.js install <skill-name>
```

### 方式 4：从 ClawHub 安装

```bash
# 搜索技能
clawhub search <关键词>

# 安装技能
clawhub install <技能名>

# 例如安装 skill-vetter（待发布）
clawhub install skill-vetter
```

## 📚 使用技能

```bash
# 自我进化（手动触发）
node ~/.openclaw/workspace/skills/agent-self-improving/index.js

# 智弈集群心跳
node ~/.openclaw/workspace/skills/zhiyi-cluster/index.js heartbeat

# 飞书任务创建
# 通过 OpenClaw message 工具或 feishu_task_task API

# 技能发现
node ~/.openclaw/workspace/skills/find-skill/index.js search "browser automation"
```

## 🔧 配置定时任务

```bash
# 自我进化（每天 21:00）
openclaw cron add --name "自我进化" \
  --cron "0 21 * * *" \
  --system-event "node ~/.openclaw/workspace/skills/agent-self-improving/index.js" \
  --session main

# 智弈集群心跳（每 5 分钟）
openclaw cron add --name "智弈心跳" \
  --every 300000 \
  --system-event "node ~/.openclaw/workspace/skills/zhiyi-cluster/index.js heartbeat" \
  --session main
```

## 📁 技能目录结构

```
zhiyi-new-agent-onboarding/
├── README.md              # 本文件
├── index.js               # 一键入职脚本
├── package.json
└── skills/                # 技能包目录
    ├── agent-self-improving/
    ├── zhiyi-cluster/
    ├── self-improving -> agent-self-improving
    ├── feishu-bitable/
    ├── feishu-im-read/
    ├── feishu-task/
    ├── document-skills/
    ├── find-skill/
    ├── browser-cli/
    ├── tavily/
    └── api-gateway/
```

## 🔄 更新技能

```bash
# 更新入职仓库
cd ~/.openclaw/workspace/skills/zhiyi-onboarding
git pull origin main

# 更新所有技能
for skill in skills/*/; do
  if [ -d "$skill/.git" ]; then
    cd "$skill" && git pull && cd -
  fi
done
```

---

**开发者**: 智弈团队  
**版本**: 3.1.0  
**最后更新**: 2026-03-15  
**许可证**: MIT  
**仓库**: https://github.com/ra1nzzz/zhiyi-new-agent-onboarding
