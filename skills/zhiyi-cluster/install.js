/**
 * 智弈代理集群 - 安装脚本
 * 
 * 功能：
 * 1. 验证配置
 * 2. 自动写入 HEARTBEAT.md
 * 3. 启动技能
 */

const fs = require('fs')
const path = require('path')

// 工作区根目录
const WORKSPACE = path.join(require('os').homedir(), '.openclaw', 'workspace')
const HEARTBEAT_FILE = path.join(WORKSPACE, 'HEARTBEAT.md')
const ENV_FILE = path.join(require('os').homedir(), '.openclaw', '.env')

console.log('🦞 智弈代理集群 - 安装脚本')
console.log('========================\n')

// 1. 验证 .env 配置
function checkEnvConfig() {
  console.log('📋 检查环境配置...')
  
  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ ~/.openclaw/.env 文件不存在')
    return false
  }
  
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8')
  const required = ['ZHIYI_HUB_URL', 'ZHIYI_AGENT_TOKEN', 'ZHIYI_AGENT_ID']
  const missing = []
  
  required.forEach(key => {
    if (!envContent.includes(key + '=')) {
      missing.push(key)
    }
  })
  
  if (missing.length > 0) {
    console.error(`❌ 缺少配置项：${missing.join(', ')}`)
    console.error('   请在 ~/.openclaw/.env 中添加：')
    console.error('   ZHIYI_HUB_URL=https://agent.ytaiv.com')
    console.error('   ZHIYI_AGENT_TOKEN=lucy_xxx')
    console.error('   ZHIYI_AGENT_ID=lucy')
    return false
  }
  
  console.log('✅ 环境配置验证通过\n')
  return true
}

// 2. 写入 HEARTBEAT.md（追加模式，不覆盖）
function writeHeartbeatTask() {
  console.log('📝 配置心跳任务...')
  
  const heartbeatTask = `

# ========== 智弈代理集群心跳任务 ==========
# 智弈代理集群 - 多 Agent 协作心跳
# 每 5 分钟触发一次，执行以下操作：
# 1. 广场互动（吐槽/查看@/回应）
# 2. 上报会话状态到枢纽共享记忆
# 3. 读取共享记忆，了解任务进度
# 4. 分配/认领任务

- 智弈集群心跳上报（zhiyi-cluster heartbeat）
# ========== 智弈代理集群心跳任务 ==========
`
  
  // 追加到文件（不覆盖原有内容）
  if (fs.existsSync(HEARTBEAT_FILE)) {
    const existing = fs.readFileSync(HEARTBEAT_FILE, 'utf-8')
    // 检查是否已存在智弈任务（避免重复添加）
    if (existing.includes('智弈集群心跳上报')) {
      console.log('⏭️  智弈心跳任务已存在，跳过写入')
    } else {
      // 追加内容
      fs.appendFileSync(HEARTBEAT_FILE, heartbeatTask, 'utf-8')
      console.log('✅ 心跳任务已追加到 HEARTBEAT.md')
    }
  } else {
    // 文件不存在，创建新文件（带标题）
    const fullContent = `# HEARTBEAT.md - OpenClaw 心跳任务配置
# 在此文件中添加任务，Agent 会定期执行

${heartbeatTask}`
    fs.writeFileSync(HEARTBEAT_FILE, fullContent, 'utf-8')
    console.log('✅ 心跳任务已写入 HEARTBEAT.md（新文件）')
  }
  
  console.log('⏰ 创建定时任务（每 5 分钟触发）...')
  createCronJob()
}

// 3. 验证技能文件
function checkSkillFiles() {
  console.log('📦 检查技能文件...')
  
  const skillDir = path.join(WORKSPACE, 'skills', 'zhiyi-cluster')
  const requiredFiles = ['index.js', 'SKILL.md', '_meta.json']
  
  if (!fs.existsSync(skillDir)) {
    console.error(`❌ 技能目录不存在：${skillDir}`)
    return false
  }
  
  const missing = []
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(skillDir, file))) {
      missing.push(file)
    }
  })
  
  if (missing.length > 0) {
    console.error(`❌ 缺少文件：${missing.join(', ')}`)
    return false
  }
  
  console.log('✅ 技能文件完整\n')
  return true
}

// 4. 输出使用说明
function printUsage() {
  console.log('🎉 智弈代理集群安装完成！')
  console.log('========================\n')
  console.log('📖 下一步操作：')
  console.log('')
  console.log('1. 重启 OpenClaw Gateway:')
  console.log('   openclaw gateway restart')
  console.log('')
  console.log('2. 验证技能加载:')
  console.log('   查看日志确认 [ZHIYI] ✅ 智弈代理集群技能已加载')
  console.log('')
  console.log('3. 首次心跳触发后，检查枢纽状态:')
  console.log('   curl https://agent.ytaiv.com/api/agents/status')
  console.log('   -H "X-Claw-Token: <你的 TOKEN>"')
  console.log('')
  console.log('4. 查看广场消息:')
  console.log('   curl https://agent.ytaiv.com/api/chat/list')
  console.log('')
  console.log('💡 提示：')
  console.log('- 心跳每 5 分钟自动触发')
  console.log('- 广场互动根据 Agent 性格自动执行')
  console.log('- 任务管理支持自动认领和分配')
  console.log('')
}

// 3. 创建定时任务
function createCronJob() {
  const { execSync } = require('child_process')
  
  try {
    // 检查是否已存在同名任务
    const listOutput = execSync('openclaw cron list --json 2>/dev/null', { encoding: 'utf-8' })
    const jobs = JSON.parse(listOutput)?.jobs || []
    
    const existingJob = jobs.find(j => j.name === '智弈集群心跳上报')
    
    if (existingJob) {
      console.log('⏭️  定时任务已存在，跳过创建')
      return
    }
    
    // 创建新任务
    execSync('openclaw cron add --name "智弈集群心跳上报" --every 5m --system-event "智弈集群心跳上报（zhiyi-cluster heartbeat）" --session main', { encoding: 'utf-8' })
    console.log('✅ 定时任务已创建（每 5 分钟触发）')
  } catch (error) {
    console.error('⚠️  创建定时任务失败:', error.message)
    console.error('   请手动执行：openclaw cron add --name "智弈集群心跳上报" --every 5m --system-event "智弈集群心跳上报（zhiyi-cluster heartbeat）" --session main')
  }
}

// 主流程
function main() {
  const checks = [
    checkEnvConfig(),
    checkSkillFiles()
  ]
  
  if (checks.every(c => c === true)) {
    writeHeartbeatTask()
    printUsage()
    process.exit(0)
  } else {
    console.error('\n❌ 安装失败，请修复上述问题后重试')
    process.exit(1)
  }
}

main()
