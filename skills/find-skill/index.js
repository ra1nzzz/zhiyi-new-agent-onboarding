#!/usr/bin/env node
const { execSync } = require('child_process');

const command = process.argv[2];
const query = process.argv[3];

if (command === 'search') {
  console.log(`🔍 搜索技能：${query}`);
  try {
    const result = execSync(`gh search repos "${query}" --limit 10`, { encoding: 'utf-8' });
    console.log(result);
  } catch (e) {
    console.log('⚠️ 搜索失败，请检查网络连接');
  }
} else if (command === 'install') {
  console.log(`📦 安装技能：${query}`);
  // TODO: 实现安装逻辑
} else {
  console.log('用法：node index.js <search|install> <query>');
}
