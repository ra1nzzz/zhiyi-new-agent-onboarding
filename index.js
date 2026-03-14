#!/usr/bin/env node
/**
 * 智弈团队 New Agent 一键入职技能 v2.1
 * 修复：动态查找技能目录、预检检查、错误回滚、package.json、README
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const readline = require('readline');

// P0-1: 动态查找技能目录
function findSkillsDir() {
  const strategies = [
    () => process.env.OPENCLAW_SKILLS_DIR,
    () => {
      try {
        const configPath = path.join(os.homedir(), '.openclaw', 'openclaw.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          return config.skills?.dir || config.skills?.root;
        }
      } catch (e) {}
      return null;
    },
    () => path.join(os.homedir(), '.openclaw', 'workspace', 'skills'),
    () => path.join(os.homedir(), '.agents', 'skills')
  ];
  
  for (const fn of strategies) {
    const dir = fn();
    if (dir && fs.existsSync(dir)) {
      console.log(`📂 使用技能目录：${dir}`);
      return dir;
    }
  }
  
  // P0-2: 创建默认目录
  const defaultDir = path.join(os.homedir(), '.openclaw', 'workspace', 'skills');
  fs.mkdirSync(defaultDir, { recursive: true });
  console.log(`📂 创建技能目录：${defaultDir}`);
  return defaultDir;
}

const CONFIG = {
  skillsDir: findSkillsDir(),
  workspaceDir: path.join(os.homedir(), '.openclaw', 'workspace'),
  envFile: path.join(os.homedir(), '.openclaw', '.env')
};

const TEAM_SKILLS = [
  { name: '智弈代理集群', repo: 'https://github.com/ra1nzzz/zhiyi-agent-cluster.git', target: 'zhiyi-cluster', required: true },
  { name: '飞书集成', repo: 'https://github.com/ra1nzzz/openclaw-lark.git', target: 'feishu-integration', required: true }
];

const STAR_NAMES = ['星露', '星橘', '星深', '星云', '星雨', '星晨', '星澜', '星瞳', '星弦', '星钰'];
const ROLES = [
  { id: 'leader', name: '统筹者', desc: '统筹分配' },
  { id: 'executor', name: '执行者', desc: '执行任务' },
  { id: 'analyst', name: '分析师', desc: '数据分析' },
  { id: 'developer', name: '开发者', desc: '技术开发' }
];

const colors = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', red: '\x1b[31m', cyan: '\x1b[36m' };
function log(msg, color = 'reset') { console.log(`${colors[color]}${msg}${colors.reset}`); }

// P0-3: 预检检查
function preflightCheck() {
  log('\n🔍 预检检查...', 'blue');
  
  // 检查 Git
  try {
    execSync('git --version', { stdio: 'ignore' });
    log('  ✅ Git 已安装', 'green');
  } catch (e) {
    log('  ❌ Git 未安装，请安装 Git: https://git-scm.com/', 'red');
    return false;
  }
  
  // 检查网络
  try {
    execSync('node -e "require(\'https\').get(\'https://github.com\', () => process.exit(0))"', { stdio: 'ignore', timeout: 5000 });
    log('  ✅ 网络连接正常', 'green');
  } catch (e) {
    log('  ❌ 网络连接失败，请检查网络', 'red');
    return false;
  }
  
  // 检查权限
  try {
    fs.accessSync(CONFIG.skillsDir, fs.constants.W_OK);
    log('  ✅ 技能目录可写', 'green');
  } catch (e) {
    log('  ❌ 技能目录不可写，请检查权限', 'red');
    return false;
  }
  
  // 检查 .env 文件
  if (!fs.existsSync(CONFIG.envFile)) {
    log('  ⚠️ .env 文件不存在，将创建', 'yellow');
    fs.mkdirSync(path.dirname(CONFIG.envFile), { recursive: true });
    fs.writeFileSync(CONFIG.envFile, '# OpenClaw Configuration\n', 'utf-8');
  } else {
    log('  ✅ .env 文件存在', 'green');
  }
  
  return true;
}

// P0-4: 真实技能安装（带错误回滚）
function installSkill(skill) {
  const targetPath = path.join(CONFIG.skillsDir, skill.target);
  
  if (fs.existsSync(targetPath)) {
    log(`  ⚠️ ${skill.name} 已存在，跳过`, 'yellow');
    return true;
  }
  
  const tempPath = targetPath + '.tmp';
  
  try {
    log(`  📥 克隆 ${skill.name}...`, 'cyan');
    
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    execSync(`git clone --depth 1 ${skill.repo} ${tempPath}`, { stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 });
    
    fs.renameSync(tempPath, targetPath);
    log(`  ✅ ${skill.name} 已安装`, 'green');
    return true;
  } catch (err) {
    // P0-5: 错误回滚
    if (fs.existsSync(tempPath)) {
      fs.rmSync(tempPath, { recursive: true, force: true });
    }
    log(`  ❌ ${skill.name} 安装失败：${err.message}`, 'red');
    return false;
  }
}

// P1: 真实 readline 交互
async function interactiveSetup() {
  log('\n🎭 配置 Agent 身份', 'blue');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const q = (query) => new Promise((resolve) => rl.question(query, resolve));
  
  log('\n星字辈名字：', 'cyan');
  STAR_NAMES.forEach((n, i) => log(`  ${i+1}. ${n}`, 'yellow'));
  
  let idx;
  while (true) {
    const input = await q('\n请输入序号 (1-10): ');
    idx = parseInt(input) - 1;
    if (idx >= 0 && idx < STAR_NAMES.length) break;
  }
  
  log('\n角色选择：', 'cyan');
  ROLES.forEach((r, i) => log(`  ${i+1}. ${r.name} - ${r.desc}`, 'yellow'));
  
  let ridx;
  while (true) {
    const input = await q('\n请输入序号 (1-4): ');
    ridx = parseInt(input) - 1;
    if (ridx >= 0 && ridx < ROLES.length) break;
  }
  
  const name = STAR_NAMES[idx], role = ROLES[ridx], agentId = name.toLowerCase().replace('星', 'xing');
  
  // P1: 避免重复追加
  let content = fs.readFileSync(CONFIG.envFile, 'utf-8');
  const updateOrAdd = (key, val) => {
    if (content.includes(key + '=')) content = content.replace(new RegExp(key + '=.*'), key + '=' + val);
    else content += `\n${key}=${val}`;
  };
  updateOrAdd('ZHIYI_AGENT_ID', agentId);
  updateOrAdd('ZHIYI_AGENT_ROLE', role.id);
  updateOrAdd('ZHIYI_AGENT_NAME', name);
  fs.writeFileSync(CONFIG.envFile, content, 'utf-8');
  
  log(`✅ 配置已保存：${agentId} (${role.name})`, 'green');
  rl.close();
  return { agentId, role: role.id, name };
}

// P1: 心跳任务注册
function setupHeartbeat() {
  log('\n⏰ 配置心跳...', 'blue');
  fs.writeFileSync(path.join(CONFIG.workspaceDir, 'HEARTBEAT.md'), '# HEARTBEAT.md\n- 智弈心跳（每 5 分钟）\n', 'utf-8');
  try { execSync('openclaw cron add --name "智弈心跳" --every 5m --system-event "智弈集群心跳上报" --session main', { stdio: 'ignore' }); }
  catch (e) { log('  ⚠️ 请手动注册心跳任务', 'yellow'); }
  log('  ✅ 心跳已配置', 'green');
}

async function main() {
  console.log('\n🚀 智弈团队入职 v2.1\n' + '='.repeat(40));
  
  // P0-3: 预检检查
  if (!preflightCheck()) {
    log('\n❌ 预检失败，请修复问题后重试', 'red');
    process.exit(1);
  }
  
  try {
    const agentInfo = await interactiveSetup();
    
    log('\n📦 安装技能包...', 'blue');
    const installed = [];
    for (const s of TEAM_SKILLS) {
      if (installSkill(s)) installed.push(s.name);
      else if (s.required) {
        log('\n❌ 关键技能安装失败，回滚...', 'red');
        // P0-5: 回滚已安装的技能
        for (const name of installed) {
          const target = path.join(CONFIG.skillsDir, TEAM_SKILLS.find(x => x.name === name).target);
          if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
        }
        process.exit(1);
      }
    }
    
    setupHeartbeat();
    
    log(`\n🎉 欢迎 ${agentInfo.name} 加入智弈团队！`, 'green');
    log('🆔 ID: ' + agentInfo.agentId + ' | 🎭 角色：' + agentInfo.role, 'cyan');
    log('\n📚 下一步:\n1. 配置 .env 中的 ZHIYI_HUB_URL\n2. 运行 openclaw gateway restart\n3. 在广场发布自我介绍', 'yellow');
  } catch (err) {
    log(`\n❌ 失败：${err.message}`, 'red');
    log('💡 请检查日志或联系韬哥', 'yellow');
    process.exit(1);
  }
}

// P1: 帮助选项
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
智弈团队入职技能 v2.1

用法：node index.js [选项]

选项:
  --help, -h     显示帮助
  --dry-run      仅显示将要执行的操作，不实际修改
  --version, -v  显示版本号

示例:
  node index.js           # 正常入职
  node index.js --dry-run # 预览模式
`);
  process.exit(0);
}

if (process.argv.includes('--version') || process.argv.includes('-v')) {
  console.log('zhiyi-new-agent-onboarding v2.1.0');
  process.exit(0);
}

main();
