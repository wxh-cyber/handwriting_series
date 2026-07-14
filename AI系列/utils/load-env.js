//从node中导入fs和path模块
const fs = require('node:fs');
const path = require('node:path');

/**
 * @function normalizeValue
 * @param {string} rawValue 
 * @returns {string}
 * @description
 *  1. 去除首尾的双引号或单引号
 *  2. 去除首尾的空格
 */
function normalizeValue(rawValue) {
  //去除首尾空格
  const trimmed = rawValue.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    //去除首尾的双引号或单引号
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

/**
 * @function loadEnvFile
 * @param {*} filePath 
 * @returns {boolean}
 * @description
 *      读取.env文件内容
 */
function loadEnvFile(filePath = path.join(__dirname, '..', '.env')) {
  // 拼接文件路径，应该是当前所在目录的上一级目录下的.env文件
  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    return false;
  }

  // 读取.env文件内容
  const content = fs.readFileSync(filePath, 'utf8');
  // 按行分割内容
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    //如果是注释行或空行，则跳过
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    //获取到=的索引
    const separatorIndex = trimmed.indexOf('=');
    //如果不存在=，则跳过
    if (separatorIndex === -1) {
      continue;
    }

    //获取到对应的key和value
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = normalizeValue(trimmed.slice(separatorIndex + 1));

    //如果key为空，或者key已经存在于process.env中，则跳过
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      continue;
    }

    //将key和value添加到process.env中
    process.env[key] = value;
  }

  //返回true
  return true;
}

/**
 * @module load-env
 */
module.exports = {
  loadEnvFile,
};
