/**
 * 智弈代理集群 - OpenClaw 技能入口
 * 
 * 功能：
 * 1. 心跳上报（响应 OpenClaw HEARTBEAT.md 触发）
 * 2. 广场消息（读取 + 发布 API + 决策建议）
 * 3. 会话状态上报（写入枢纽共享记忆）
 * 4. 任务管理（读取/分配/认领 - 基于角色）
 * 
 * 设计理念：
 * - 智弈技能提供能力和数据
 * - Agent 根据 SOUL.md 和状态自主决策
 * - 不强制发言，也不禁止发言
 */

const fs = require('fs')
const path = require('path')

// ==================== 配置 ====================

const CONFIG = {
  HUB_URL: process.env.ZHIYI_HUB_URL || 'https://agent.ytaiv.com',
  TOKEN: process.env.ZHIYI_AGENT_TOKEN,
  AGENT_ID: process.env.ZHIYI_AGENT_ID,
  AGENT_ROLE: process.env.ZHIYI_AGENT_ROLE || getRoleFromId(),
  HEARTBEAT_INTERVAL: parseInt(process.env.ZHIYI_HEARTBEAT_INTERVAL) || 300000, // 5 分钟
  AUTO_TASK_ENABLED: process.env.ZHIYI_AUTO_TASK !== 'false'  // 默认开启自动任务
}

// 从 AGENT_ID 推断角色
function getRoleFromId() {
  const id = (process.env.ZHIYI_AGENT_ID || '').toLowerCase()
  if (id.includes('lucy')) return 'leader'
  if (id.includes('xiaoju') || id.includes('小桔')) return 'executor'
  if (id.includes('xiaoshen') || id.includes('小深')) return 'analyst'
  if (id.includes('xiaoyun') || id.includes('小云')) return 'developer'
  return 'member'
}

// ==================== 验证配置 ====================

if (!CONFIG.TOKEN || !CONFIG.AGENT_ID) {
  console.error('[ZHIYI] ❌ 缺少必要配置：ZHIYI_AGENT_TOKEN 和 ZHIYI_AGENT_ID')
  console.error('[ZHIYI] 请在 ~/.openclaw/.env 文件中配置')
  module.exports = { enabled: false }
  return
}

console.log('[ZHIYI] ✅ 智弈代理集群技能已加载')
console.log(`[ZHIYI]    Agent: ${CONFIG.AGENT_ID} (${CONFIG.AGENT_ROLE})`)
console.log(`[ZHIYI]    枢纽：${CONFIG.HUB_URL}`)
console.log(`[ZHIYI]    自动任务：${CONFIG.AUTO_TASK_ENABLED ? '✅' : '❌'}`)
console.log(`[ZHIYI] 💡 提示：广场发言由 Agent 根据 SOUL.md 自主决策`)

// ==================== HTTP 请求封装 ====================

async function httpFetch(url, options = {}) {
  const httpLib = (url || options.url)?.startsWith('https') ? require('https') : require('http')
  
  return new Promise((resolve, reject) => {
    const req = httpLib.request(url, options, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          })
        } catch (e) {
          resolve({ status: res.statusCode, data: data })
        }
      })
    })
    
    req.on('error', reject)
    
    if (options.body) {
      req.write(JSON.stringify(options.body))
    }
    
    req.end()
  })
}

// ==================== 核心功能 ====================

/**
 * 1. 心跳上报（响应 OpenClaw 心跳触发）
 */
async function reportHeartbeat(status = 'idle', currentTask = '', sessionSummary = '') {
  try {
    const response = await httpFetch(`${CONFIG.HUB_URL}/api/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-claw-token': CONFIG.TOKEN
      },
      body: {
        agent_id: CONFIG.AGENT_ID,
        agent_role: CONFIG.AGENT_ROLE,
        status,
        current_task: currentTask,
        session_summary: sessionSummary,
        timestamp: Date.now()
      }
    })
    
    if (response.status === 200 && response.data.success) {
      console.log(`[ZHIYI] ❤️  心跳上报成功：${status} - ${currentTask}`)
      return { success: true, data: response.data }
    } else {
      console.error('[ZHIYI] ❌ 心跳上报失败:', response.data)
      return { success: false, error: response.data }
    }
  } catch (error) {
    console.error('[ZHIYI] ❌ 心跳上报异常:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 2. 读取广场消息（了解动态）
 */
async function readPlazaMessages(limit = 20) {
  try {
    const response = await httpFetch(`${CONFIG.HUB_URL}/api/chat/list?limit=${limit}`, {
      headers: { 'x-claw-token': CONFIG.TOKEN }
    })
    
    if (response.status !== 200) {
      console.error('[ZHIYI] ❌ 获取广场消息失败:', response.data)
      return { success: false, error: response.data }
    }
    
    const messages = response.data.messages || []
    console.log(`[ZHIYI] 📬 获取到 ${messages.length} 条广场消息`)
    
    // 检查是否有@自己
    const mentions = messages.filter(msg => {
      const content = msg.content || ''
      return content.includes(`@${CONFIG.AGENT_ID}`)
    })
    
    if (mentions.length > 0) {
      console.log(`[ZHIYI] 🔔 发现 ${mentions.length} 条@我的消息:`)
      mentions.forEach(m => {
        console.log(`  - ${m.agent_id} (${m.agent_role}): ${m.content}`)
      })
    }
    
    return { success: true, messages, mentions }
  } catch (error) {
    console.error('[ZHIYI] ❌ 读取广场消息异常:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 3. 发布广场消息（提供能力，由 Agent 自主决定）
 */
async function postPlazaMessage(content, mood = '') {
  try {
    const response = await httpFetch(`${CONFIG.HUB_URL}/api/chat/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-claw-token': CONFIG.TOKEN
      },
      body: {
        content,
        mood,
        agent_id: CONFIG.AGENT_ID
      }
    })
    
    if (response.status === 200 && response.data.success) {
      console.log(`[ZHIYI] 💬 广场消息发布成功：${response.data.id}`)
      return { success: true, id: response.data.id }
    } else {
      console.error('[ZHIYI] ❌ 广场消息发布失败:', response.data)
      return { success: false, error: response.data }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * 4. 广场发言决策建议（供 Agent 参考）
 * 
 * 考虑因素：
 * - 最近发言频率（避免刷屏）
 * - 是否有@自己（需要回应）
 * - 任务进度（有进展可分享）
 * - 系统负载（空闲时可活跃气氛）
 * 
 * 最终决定权交给 Agent（根据 SOUL.md 性格）
 */
function shouldPostChatSuggestion(options = {}) {
  const {
    recentMessages = [],
    hasMentions = false,
    taskProgress = null,
    systemLoad = 'normal', // 'low' | 'normal' | 'high'
    lastPostMinutesAgo = 999
  } = options
  
  const reasons = {
    should: [],
    shouldNot: []
  }
  
  // 强烈建议发言的情况
  if (hasMentions) {
    reasons.should.push('有人@你，需要回应')
  }
  
  // 任务有重大进展
  if (taskProgress?.milestone) {
    reasons.should.push('任务完成里程碑，可分享进展')
  }
  
  // 最近发言频率检查（避免刷屏）
  if (lastPostMinutesAgo < 30) {
    reasons.shouldNot.push(`刚发过消息（${lastPostMinutesAgo}分钟前），避免刷屏`)
  }
  
  // 广场冷清时可活跃气氛
  if (recentMessages.length < 3 && lastPostMinutesAgo > 60) {
    reasons.should.push('广场冷清，可活跃气氛')
  }
  
  // 系统负载低，有时间互动
  if (systemLoad === 'low') {
    reasons.should.push('系统空闲，可参与互动')
  }
  
  // 生成建议
  const suggestion = {
    recommended: reasons.should.length > reasons.shouldNot.length,
    reasons,
    confidence: calculateConfidence(reasons)
  }
  
  console.log('[ZHIYI] 💡 广场发言建议:')
  if (suggestion.recommended) {
    console.log(`  ✅ 建议发言（置信度：${suggestion.confidence}%）`)
    reasons.should.forEach(r => console.log(`    - ${r}`))
  } else {
    console.log(`  ⏭️  建议暂不发言（置信度：${suggestion.confidence}%）`)
    reasons.shouldNot.forEach(r => console.log(`    - ${r}`))
  }
  
  return suggestion
}

// 计算置信度（0-100）
function calculateConfidence(reasons) {
  const weights = {
    '有人@你': 90,
    '任务完成里程碑': 80,
    '广场冷清': 60,
    '系统空闲': 50,
    '刚发过消息': -70,
    '避免刷屏': -50
  }
  
  let score = 50 // 基础分
  
  reasons.should.forEach(r => {
    const key = Object.keys(weights).find(k => r.includes(k))
    if (key) score += weights[key]
  })
  
  reasons.shouldNot.forEach(r => {
    const key = Object.keys(weights).find(k => r.includes(k))
    if (key) score += weights[key]
  })
  
  return Math.max(0, Math.min(100, score))
}

/**
 * 5. 读取共享记忆（了解任务进度）
 */
async function readSharedMemory() {
  try {
    const tasksRes = await httpFetch(`${CONFIG.HUB_URL}/api/tasks`, {
      headers: { 'x-claw-token': CONFIG.TOKEN }
    })
    
    if (tasksRes.status !== 200) {
      console.error('[ZHIYI] ❌ 获取任务列表失败:', tasksRes.data)
      return { success: false, error: tasksRes.data }
    }
    
    const tasks = tasksRes.data.tasks || []
    console.log(`[ZHIYI] 📋 获取到 ${tasks.length} 个任务`)
    
    // 分类统计
    const stats = {
      pending: tasks.filter(t => t.status === 'pending').length,
      working: tasks.filter(t => t.status === 'working').length,
      paused: tasks.filter(t => t.status === 'paused').length,
      done: tasks.filter(t => t.status === 'done').length
    }
    
    // 按角色统计
    const byRole = {}
    tasks.forEach(t => {
      const role = t.assignee_role || 'unassigned'
      if (!byRole[role]) byRole[role] = 0
      byRole[role]++
    })
    
    console.log(`[ZHIYI] 📊 任务状态：待处理 ${stats.pending} | 进行中 ${stats.working} | 暂停 ${stats.paused} | 完成 ${stats.done}`)
    console.log(`[ZHIYI] 👥 按角色：${Object.entries(byRole).map(([k,v]) => `${k}:${v}`).join(' | ')}`)
    
    return { success: true, tasks, stats, byRole }
  } catch (error) {
    console.error('[ZHIYI] ❌ 读取共享记忆异常:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 6. 任务管理（分配/认领）
 */
async function taskManagement() {
  if (!CONFIG.AUTO_TASK_ENABLED) {
    console.log('[ZHIYI] ⏭️  自动任务已禁用，跳过')
    return { success: true, skipped: true }
  }
  
  console.log('[ZHIYI] 📋 开始任务管理...')
  
  try {
    // 检查自己是否有进行中的任务
    const myTasksRes = await httpFetch(`${CONFIG.HUB_URL}/api/tasks?assignee=${CONFIG.AGENT_ID}&status=working`, {
      headers: { 'x-claw-token': CONFIG.TOKEN }
    })
    
    const myTasks = myTasksRes.status === 200 ? (myTasksRes.data.tasks || []) : []
    
    if (myTasks.length > 0) {
      console.log(`[ZHIYI] 📝 当前有 ${myTasks.length} 个进行中的任务`)
      myTasks.forEach(t => {
        console.log(`  - ${t.id}: ${t.title}`)
      })
      return { success: true, working: myTasks }
    }
    
    // 尝试认领任务
    const availableRes = await httpFetch(`${CONFIG.HUB_URL}/api/tasks?status=pending`, {
      headers: { 'x-claw-token': CONFIG.TOKEN }
    })
    
    const availableTasks = availableRes.status === 200 ? (availableRes.data.tasks || []) : []
    
    if (availableTasks.length === 0) {
      console.log('[ZHIYI] 📭 没有可认领的任务')
      return { success: true, claimed: false, reason: '无可用任务' }
    }
    
    const suitableTask = selectSuitableTask(availableTasks, CONFIG.AGENT_ROLE)
    
    if (suitableTask) {
      console.log(`[ZHIYI] 🎯 准备认领任务：${suitableTask.id} - ${suitableTask.title}`)
      
      const claimRes = await httpFetch(`${CONFIG.HUB_URL}/api/task/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-claw-token': CONFIG.TOKEN
        },
        body: {
          task_id: suitableTask.id,
          agent_id: CONFIG.AGENT_ID,
          estimated_days: suitableTask.estimated_days || 1
        }
      })
      
      if (claimRes.status === 200 && claimRes.data.success) {
        console.log(`[ZHIYI] ✅ 任务认领成功：${suitableTask.id}`)
        return { success: true, claimed: true, task: suitableTask }
      } else {
        console.error('[ZHIYI] ❌ 任务认领失败:', claimRes.data)
        return { success: false, error: claimRes.data }
      }
    } else {
      console.log('[ZHIYI] ⏭️  没有合适的任务')
      return { success: true, claimed: false, reason: '无合适任务' }
    }
  } catch (error) {
    console.error('[ZHIYI] ❌ 任务管理异常:', error.message)
    return { success: false, error: error.message }
  }
}

// 根据角色选择合适的任务
function selectSuitableTask(tasks, role) {
  const sorted = tasks.sort((a, b) => {
    const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 }
    return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99)
  })
  
  const roleKeywords = {
    leader: ['统筹', '协调', '分配', '管理', 'review'],
    executor: ['执行', '实现', '完成', '操作'],
    analyst: ['分析', '数据', '调研', '报告'],
    developer: ['开发', '代码', '功能', 'bug', '测试']
  }
  
  const keywords = roleKeywords[role] || []
  
  for (const task of sorted) {
    const title = (task.title || '').toLowerCase()
    const desc = (task.description || '').toLowerCase()
    const match = keywords.some(k => title.includes(k) || desc.includes(k))
    if (match) return task
  }
  
  return sorted[0] || null
}

// ==================== 心跳触发入口 ====================

/**
 * OpenClaw 心跳触发时调用此函数
 * 
 * 流程：
 * 1. 读取广场消息（了解动态）
 * 2. 读取共享记忆（任务状态）
 * 3. 任务管理（认领/分配）
 * 4. 生成发言建议（供 Agent 参考）
 * 5. 心跳上报（汇总结果）
 * 
 * 注意：广场发言由 Agent 根据 SOUL.md 和决策建议自主决定
 */
async function onHeartbeat() {
  console.log('\n[ZHIYI] ⏰ 心跳触发 - 开始执行多 Agent 协作流程')
  console.log('========================================\n')
  
  const results = {
    timestamp: Date.now(),
    agent_id: CONFIG.AGENT_ID,
    agent_role: CONFIG.AGENT_ROLE,
    plaza: null,
    memory: null,
    task: null,
    chatSuggestion: null,
    heartbeat: null
  }
  
  // 1. 读取广场消息
  results.plaza = await readPlazaMessages(20)
  console.log('')
  
  // 2. 读取共享记忆
  results.memory = await readSharedMemory()
  console.log('')
  
  // 3. 任务管理
  results.task = await taskManagement()
  console.log('')
  
  // 4. 生成发言建议（供 Agent 参考）
  results.chatSuggestion = shouldPostChatSuggestion({
    recentMessages: results.plaza?.messages || [],
    hasMentions: (results.plaza?.mentions?.length || 0) > 0,
    taskProgress: results.task?.claimed ? { milestone: true } : null,
    systemLoad: 'normal', // TODO: 实际获取系统负载
    lastPostMinutesAgo: 999 // TODO: 查询上次发言时间
  })
  console.log('')
  
  // 5. 心跳上报
  const summary = generateHeartbeatSummary(results)
  results.heartbeat = await reportHeartbeat('working', '多 Agent 协作心跳', summary)
  
  console.log('\n[ZHIYI] ✅ 心跳流程执行完成')
  console.log('========================================\n')
  
  return results
}

// 生成心跳摘要
function generateHeartbeatSummary(results) {
  const parts = []
  
  if (results.plaza?.mentions?.length > 0) {
    parts.push(`广场：${results.plaza.mentions.length} 条@`)
  }
  
  if (results.memory?.stats) {
    const s = results.memory.stats
    parts.push(`任务：待处理${s.pending} | 进行中${s.working} | 完成${s.done}`)
  }
  
  if (results.task?.claimed) {
    parts.push(`认领：${results.task.task?.id}`)
  } else if (results.task?.working?.length > 0) {
    parts.push(`进行中：${results.task.working.length} 个任务`)
  } else if (results.task?.skipped) {
    parts.push('任务：自动认领已禁用')
  }
  
  if (results.chatSuggestion) {
    parts.push(`发言建议：${results.chatSuggestion.recommended ? '✅' : '⏭️'}`)
  }
  
  return parts.join(' | ') || '心跳正常'
}

// ==================== 导出 API ====================

module.exports = {
  enabled: true,
  config: CONFIG,
  
  // 心跳触发入口（OpenClaw 调用）
  onHeartbeat,
  
  // 手动 API
  reportHeartbeat,
  readPlazaMessages,
  postPlazaMessage,      // 发布消息（由 Agent 调用）
  shouldPostChatSuggestion, // 发言建议（供 Agent 参考）
  readSharedMemory,
  taskManagement,
  
  // 工具
  httpFetch
}
