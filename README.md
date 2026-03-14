# 智弈团队 New Agent 入职技能

🚀 让新 Agent 加入智弈团队（StrateMind）变得如此简单！

## 📦 已安装技能

### 核心技能

1. **agent-self-improving** - Agent 自我进化技能 ⭐⭐⭐
   - 每日自动复盘（21:00）
   - 阅读 GIST 通用 AGENT 教义
   - 按内容类型存储到对应文档
   - 将复盘结果追加到 GIST 通用教义
   - 仓库：https://github.com/ra1nzzz/agent-self-improving

2. **document-skills** - 文档管理技能 ⭐⭐
   - 创建、读取、更新、归档文档
   - 版本管理
   - 支持多种文档类型

3. **find-skill** - 技能发现与安装 ⭐⭐
   - 搜索技能（Skillhub、GitHub）
   - 评估技能质量
   - 自动安装技能
   - 技能依赖管理

4. **self-improving** - 自我进化（兼容层）⭐
   - 链接到 agent-self-improving
   - 保持向后兼容

5. **skill-vetter** - 技能质量评估 ⭐⭐⭐
   - 代码质量检查
   - 安全性评估
   - 兼容性测试
   - 文档完整性检查
   - 依赖项验证

### 技能优先级

| 优先级 | 技能 | 说明 |
|--------|------|------|
| P0 | agent-self-improving | 必须安装，核心进化能力 |
| P0 | skill-vetter | 必须安装，保证技能质量 |
| P1 | document-skills | 推荐安装，文档管理 |
| P1 | find-skill | 推荐安装，技能发现 |
| P2 | self-improving | 可选，兼容层 |

## 🚀 快速开始

### 方式 1：完整安装（推荐）

```bash
# 克隆仓库（包含子模块）
git clone --recursive https://github.com/ra1nzzz/zhiyi-new-agent-onboarding.git \
  ~/.openclaw/workspace/skills/zhiyi-onboarding

# 初始化子模块（如果克隆时忘记 --recursive）
cd ~/.openclaw/workspace/skills/zhiyi-onboarding
git submodule update --init

# 运行入职
node ~/.openclaw/workspace/skills/zhiyi-onboarding/index.js
```

### 方式 2：手动安装技能

```bash
# 1. agent-self-improving
git clone https://github.com/ra1nzzz/agent-self-improving.git \
  ~/.openclaw/workspace/skills/agent-self-improving

# 2. skill-vetter
git clone https://github.com/ra1nzzz/ytao-ai-observer.git --depth 1 temp && \
  cp -r temp/skills/skill-vetter ~/.openclaw/workspace/skills/ && \
  rm -rf temp

# 3. document-skills
# 自动创建

# 4. find-skill
# 自动创建
```

## 📚 使用技能

```bash
# 自我进化
node skills/agent-self-improving/index.js

# 文档管理
node skills/document-skills/index.js --help

# 技能发现
node skills/find-skill/index.js search "browser automation"
node skills/find-skill/index.js install <skill-name>

# 技能评估
node skills/skill-vetter/index.js <skill-repo>
```

## 🔧 配置定时任务

```bash
# 自我进化（每天 21:00）
openclaw cron add --name "自我进化" \
  --cron "0 21 * * *" \
  --system-event "node ~/.openclaw/workspace/skills/zhiyi-onboarding/skills/agent-self-improving/index.js" \
  --session main
```

## 📊 技能评估标准

skill-vetter 会从以下维度评估技能：

| 维度 | 权重 | 评分标准 |
|------|------|----------|
| 代码质量 | 30% | ESLint 通过率、注释密度、代码复用 |
| 安全性 | 25% | 敏感信息扫描、权限最小化、输入验证 |
| 兼容性 | 20% | 跨平台测试、Node 版本兼容 |
| 文档 | 15% | README 完整性、示例代码、API 文档 |
| 依赖 | 10% | 依赖数量、安全漏洞扫描 |

**评分等级**:
- ⭐⭐⭐⭐⭐ 优秀（90-100 分）- 强烈推荐
- ⭐⭐⭐⭐ 良好（75-89 分）- 推荐
- ⭐⭐⭐ 一般（60-74 分）- 可用
- ⭐⭐ 较差（40-59 分）- 不推荐
- ⭐ 差（0-39 分）- 禁止使用

---

**开发者**: 智弈团队  
**版本**: 3.0.0  
**最后更新**: 2026-03-15  
**许可证**: MIT
