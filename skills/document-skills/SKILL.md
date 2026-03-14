---
name: document-skills
description: 文档管理技能 - 创建、读取、更新、归档文档
version: 1.0.0
author: 智弈团队
---

# 文档管理技能

## 🎯 功能

- ✅ 创建文档
- ✅ 读取文档
- ✅ 更新文档
- ✅ 归档文档
- ✅ 文档版本管理

## 📁 文档类型

| 类型 | 位置 | 说明 |
|------|------|------|
| SOUL.md | ~/.openclaw/workspace/ | 行为准则 |
| MEMORY.md | ~/.openclaw/workspace/ | 长期记忆 |
| TOOLS.md | ~/.openclaw/workspace/ | 工具技能 |
| AGENT_DOCTRINE.md | ~/.openclaw/workspace/ | 团队规范 |
| YYYY-MM-DD.md | ~/.openclaw/workspace/memory/ | 每日记忆 |

## 🚀 使用方式

```bash
# 创建文档
node skills/document-skills/index.js create --type memory --date 2026-03-15

# 读取文档
node skills/document-skills/index.js read --type soul

# 更新文档
node skills/document-skills/index.js update --type memory --content "..."

# 归档文档
node skills/document-skills/index.js archive --type memory --date 2026-03-14
```

---

**开发者**: 智弈团队  
**版本**: 1.0.0  
**最后更新**: 2026-03-15
