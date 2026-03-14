#!/usr/bin/env node
/**
 * 文档管理技能
 * 功能：创建、读取、更新、归档文档
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG = {
  workspaceDir: path.join(os.homedir(), '.openclaw', 'workspace'),
  files: {
    soul: 'SOUL.md',
    memory: 'MEMORY.md',
    tools: 'TOOLS.md',
    doctrine: 'AGENT_DOCTRINE.md',
    dailyMemory: (date) => `memory/${date}.md`
  }
};

function log(msg) {
  console.log(msg);
}

function createDocument(type, options = {}) {
  const date = options.date || new Date().toISOString().split('T')[0];
  let filePath;
  
  switch(type) {
    case 'daily-memory':
      filePath = path.join(CONFIG.workspaceDir, CONFIG.files.dailyMemory(date));
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, `# ${date} 每日记忆\n\n## 今日活动\n\n## 经验总结\n\n## 待办事项\n`, 'utf-8');
      break;
    default:
      log(`❌ 不支持的文档类型：${type}`);
      return false;
  }
  
  log(`✅ 文档已创建：${filePath}`);
  return true;
}

function readDocument(type) {
  const filePath = path.join(CONFIG.workspaceDir, CONFIG.files[type] || type);
  
  if (!fs.existsSync(filePath)) {
    log(`❌ 文档不存在：${filePath}`);
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  log(`✅ 文档已读取 (${content.length} 字节)`);
  return content;
}

function updateDocument(type, content) {
  const filePath = path.join(CONFIG.workspaceDir, CONFIG.files[type] || type);
  
  if (!fs.existsSync(filePath)) {
    log(`❌ 文档不存在：${filePath}`);
    return false;
  }
  
  fs.writeFileSync(filePath, content, 'utf-8');
  log(`✅ 文档已更新：${filePath}`);
  return true;
}

function archiveDocument(type, date) {
  log(`📁 归档 ${type} (${date}) - 待实现`);
  return true;
}

// 主函数
const [, , command, ...args] = process.argv;

switch(command) {
  case 'create':
    const type = args.find(a => a.startsWith('--type='))?.split('=')[1] || 'daily-memory';
    const date = args.find(a => a.startsWith('--date='))?.split('=')[1];
    createDocument(type, { date });
    break;
  case 'read':
    const readType = args.find(a => a.startsWith('--type='))?.split('=')[1];
    readDocument(readType || 'soul');
    break;
  case 'update':
    const updateType = args.find(a => a.startsWith('--type='))?.split('=')[1];
    const content = args.find(a => a.startsWith('--content='))?.split('=')[1] || '';
    updateDocument(updateType, content);
    break;
  case 'archive':
    const archiveType = args.find(a => a.startsWith('--type='))?.split('=')[1];
    const archiveDate = args.find(a => a.startsWith('--date='))?.split('=')[1];
    archiveDocument(archiveType, archiveDate);
    break;
  default:
    log(`
文档管理技能

用法：node index.js <command> [options]

命令:
  create    创建文档
  read      读取文档
  update    更新文档
  archive   归档文档

选项:
  --type=<type>     文档类型 (soul, memory, tools, doctrine, daily-memory)
  --date=<date>     日期 (YYYY-MM-DD)
  --content=<text>  内容

示例:
  node index.js create --type=daily-memory --date=2026-03-15
  node index.js read --type=soul
  node index.js update --type=memory --content="..."
`);
}
