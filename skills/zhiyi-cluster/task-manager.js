/**
 * 智弈代理集群 - OpenClaw 技能 - 任务管理模块
 *
 * 功能：
 * - 任务自动领取
 * - 优先级判断
 * - 任务执行跟踪
 * - 完成状态上报
 * - 暂停/恢复支持
 */

const CONFIG = require('./index').config

// 当前任务状态
let currentTask = null
let taskCheckInterval = null

/**
 * 获取可领取的任务
 * @param {string} priority - 优先级过滤
 * @returns {{success: boolean, tasks?: Array, error?: Object}}
 */
async function getAvailableTasks(priority = null) {
  try {
    const hubUrl = CONFIG.HUB_URL
    const token = CONFIG.TOKEN

    // 构建查询参数
    let url = `${hubUrl}/api/tasks?status=pending&assignee=unassigned`
    if (priority) {
      url += `&priority=${priority}`
    }

    const response = await fetch(url, {
      headers: { 'x-claw-token': token }
    })

    if (response.status === 200) {
      const tasks = response.data.tasks || []
      console.log(`[ZHIYI-TASK] 找到 ${tasks.length} 个可领取任务`)

      // 按优先级排序（P0 > P1 > P2 > P3）
      const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 }
      tasks.sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      })

      return { success: true, tasks }
    } else {
      console.error('[ZHIYI-TASK] 获取任务失败:', response.data)
      return { success: false, error: response.data }
    }
  } catch (error) {
    console.error('[ZHIYI-TASK] 获取任务异常:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 认领任务
 * @param {string} taskId - 任务ID
 * @param {number} estimatedDays - 预计天数
 * @returns {{success: boolean, task?: Object, error?: Object}}
 */
async function claimTask(taskId, estimatedDays = 1) {
  try {
    const hubUrl = CONFIG.HUB_URL
    const token = CONFIG.TOKEN
    const agentId = CONFIG.AGENT_ID

    // 如果有当前正在执行的任务，需要先处理
    if (currentTask && currentTask.status === 'working') {
      console.log(`[ZHIYI-TASK] 当前有正在执行的任务：${currentTask.id}`)

      // 新任务优先级更高，暂停当前任务
      const newTaskResponse = await fetch(`${hubUrl}/api/task/${taskId}`, {
        headers: { 'x-claw-token': token }
      })

      if (newTaskResponse.status === 200) {
        const newTask = newTaskResponse.data.task
        const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 }

        if (priorityOrder[newTask.priority] < priorityOrder[currentTask.priority]) {
          console.log(`[ZHIYI-TASK] 新任务优先级更高，暂停当前任务`)
          await pauseCurrentTask({ reason: '高优先级任务插队' })
        } else {
          console.log(`[ZHIYI-TASK] 当前任务优先级更高，拒绝认领新任务`)
          return { success: false, error: { message: '当前任务优先级更高' } }
        }
      }
    }

    const response = await fetch(`${hubUrl}/api/task/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-claw-token': token
      },
      body: {
        task_id: taskId,
        agent_id: agentId,
        estimated_days: estimatedDays
      }
    })

    if (response.status === 200) {
      currentTask = response.data.task
      currentTask.status = 'working'
      currentTask.started_at = Date.now()

      console.log(`[ZHIYI-TASK] ✅ 任务认领成功：${currentTask.id}`)
      console.log(`[ZHIYI-TASK] 任务标题：${currentTask.title}`)
      console.log(`[ZHIYI-TASK] 优先级：${currentTask.priority}`)

      return { success: true, task: currentTask }
    } else {
      console.error('[ZHIYI-TASK] ❌ 任务认领失败:', response.data)
      return { success: false, error: response.data }
    }
  } catch (error) {
    console.error('[ZHIYI-TASK] ❌ 任务认领异常:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 提交任务成果
 * @param {string} commitUrl - 提交链接
 * @param {string} description - 描述
 * @returns {{success: boolean, error?: Object}}
 */
async function submitTask(commitUrl, description = '') {
  if (!currentTask) {
    console.error('[ZHIYI-TASK] 没有正在执行的任务')
    return { success: false, error: { message: '没有正在执行的任务' } }
  }

  try {
    const hubUrl = CONFIG.HUB_URL
    const token = CONFIG.TOKEN
    const agentId = CONFIG.AGENT_ID

    const response = await fetch(`${hubUrl}/api/task/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-claw-token': token
      },
      body: {
        task_id: currentTask.id,
        agent_id: agentId,
        commit_url: commitUrl,
        description
      }
    })

    if (response.status === 200) {
      const completedTask = currentTask
      currentTask = null

      console.log(`[ZHIYI-TASK] ✅ 任务提交成功：${completedTask.id}`)

      // 检查是否有被暂停的任务需要恢复
      if (completedTask.paused_task_id) {
        console.log(`[ZHIYI-TASK] 检测到被暂停的任务：${completedTask.paused_task_id}`)
        await resumeTask(completedTask.paused_task_id)
      }

      return { success: true }
    } else {
      console.error('[ZHIYI-TASK] ❌ 任务提交失败:', response.data)
      return { success: false, error: response.data }
    }
  } catch (error) {
    console.error('[ZHIYI-TASK] ❌ 任务提交异常:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 暂停当前任务
 * @param {Object} checkpoint - 检查点数据
 * @returns {{success: boolean, error?: Object}}
 */
async function pauseCurrentTask(checkpoint = {}) {
  if (!currentTask) {
    console.error('[ZHIYI-TASK] 没有正在执行的任务')
    return { success: false, error: { message: '没有正在执行的任务' } }
  }

  try {
    const hubUrl = CONFIG.HUB_URL
    const token = CONFIG.TOKEN
    const agentId = CONFIG.AGENT_ID

    const response = await fetch(`${hubUrl}/api/task/${currentTask.id}/pause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-claw-token': token
      },
      body: {
        agent_id: agentId,
        checkpoint: {
          timestamp: Date.now(),
          ...checkpoint
        }
      }
    })

    if (response.status === 200) {
      currentTask.status = 'paused'
      currentTask.paused_at = Date.now()

      console.log(`[ZHIYI-TASK] ✅ 任务暂停成功：${currentTask.id}`)
      return { success: true }
    } else {
      console.error('[ZHIYI-TASK] ❌ 任务暂停失败:', response.data)
      return { success: false, error: response.data }
    }
  } catch (error) {
    console.error('[ZHIYI-TASK] ❌ 任务暂停异常:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 恢复任务
 * @param {string} taskId - 任务ID
 * @returns {{success: boolean, task?: Object, error?: Object}}
 */
async function resumeTask(taskId) {
  try {
    const hubUrl = CONFIG.HUB_URL
    const token = CONFIG.TOKEN
    const agentId = CONFIG.AGENT_ID

    const response = await fetch(`${hubUrl}/api/task/${taskId}/resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-claw-token': token
      },
      body: {
        agent_id: agentId
      }
    })

    if (response.status === 200) {
      const task = response.data.task
      currentTask = task
      currentTask.status = 'working'
      currentTask.resumed_at = Date.now()

      console.log(`[ZHIYI-TASK] ✅ 任务恢复成功：${task.id}`)
      console.log(`[ZHIYI-TASK] 继续执行：${task.title}`)

      return { success: true, task: currentTask }
    } else {
      console.error('[ZHIYI-TASK] ❌ 任务恢复失败:', response.data)
      return { success: false, error: response.data }
    }
  } catch (error) {
    console.error('[ZHIYI-TASK] ❌ 任务恢复异常:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 获取当前任务
 * @returns {Object|null} 当前任务
 */
function getCurrentTask() {
  return currentTask
}

/**
 * 更新任务进度
 * @param {string} progress - 进度描述
 */
function updateTaskProgress(progress) {
  if (currentTask) {
    currentTask.progress = progress
    currentTask.updated_at = Date.now()
    console.log(`[ZHIYI-TASK] 任务进度：${progress}`)
  }
}

/**
 * 启动自动任务检查
 * @param {number} interval - 检查间隔（毫秒）
 */
function startAutoTaskCheck(interval = 60000) {
  if (taskCheckInterval) {
    clearInterval(taskCheckInterval)
  }

  console.log(`[ZHIYI-TASK] ⏰ 启动自动任务检查（每 ${interval / 1000} 秒）`)

  taskCheckInterval = setInterval(async () => {
    // 如果没有当前任务，尝试领取
    if (!currentTask) {
      const result = await getAvailableTasks()

      if (result.success && result.tasks.length > 0) {
        // 自动领取第一个任务（优先级最高的）
        const task = result.tasks[0]
        console.log(`[ZHIYI-TASK] 自动领取任务：${task.id}`)
        // 注意：这里只是检查，实际领取需要用户触发
        console.log(`[ZHIYI-TASK] 请调用 claimTask() 认领任务`)
      }
    } else if (currentTask.status === 'paused') {
      // 检查是否可以恢复
      console.log(`[ZHIYI-TASK] 当前任务处于暂停状态：${currentTask.id}`)
    }
  }, interval)
}

/**
 * 停止自动任务检查
 */
function stopAutoTaskCheck() {
  if (taskCheckInterval) {
    clearInterval(taskCheckInterval)
    taskCheckInterval = null
    console.log('[ZHIYI-TASK] ⏸️  自动任务检查已停止')
  }
}

// 导出 API
module.exports = {
  // 任务管理
  getAvailableTasks,
  claimTask,
  submitTask,
  pauseCurrentTask,
  resumeTask,

  // 状态查询
  getCurrentTask,
  updateTaskProgress,

  // 自动检查
  startAutoTaskCheck,
  stopAutoTaskCheck
}