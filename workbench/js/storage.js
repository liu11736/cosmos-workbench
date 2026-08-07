/**
 * 存储模块 - IndexedDB持久化 + localStorage同步缓存层
 *
 * 架构说明：
 * - IndexedDB: 主持久存储，数据量大、不会被普通缓存清理删除
 * - localStorage: 同步缓存层，保持API同步调用不变，现有代码无需改动
 * - navigator.storage.persist(): 请求持久化存储权限，进一步防止数据被清除
 * - 启动时: 从IndexedDB恢复数据到localStorage（如果localStorage被清空）
 * - 写入时: 双写（localStorage即时返回 + IndexedDB异步落盘）
 */
const Storage = {
  _prefix: 'wb_',
  _dbName: 'CosmosWorkbench',
  _storeName: 'kv',
  _db: null,
  _migrated: false,

  /**
   * 初始化存储：请求持久化权限，打开IndexedDB，恢复数据
   * 必须在App.init()之前调用
   */
  async init() {
    // 1. 请求持久化存储权限（防止浏览器自动清理）
    if (navigator.storage && navigator.storage.persist) {
      try {
        const isPersisted = await navigator.storage.persist();
        console.log('[Storage] 持久化存储:', isPersisted ? '已启用' : '未启用（浏览器决定）');
      } catch (e) {
        console.warn('[Storage] 持久化请求失败:', e);
      }
    }

    // 2. 打开IndexedDB
    try {
      this._db = await this._openDB();
      // 3. 从IndexedDB恢复数据到localStorage（如果localStorage被清空）
      await this._restoreFromIDB();
      this._migrated = true;
      console.log('[Storage] 初始化完成，IndexedDB已就绪');
    } catch (e) {
      console.error('[Storage] IndexedDB初始化失败，回退到localStorage:', e);
    }
  },

  /**
   * 打开IndexedDB数据库
   */
  _openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this._storeName)) {
          db.createObjectStore(this._storeName);
        }
      };
    });
  },

  /**
   * 从IndexedDB恢复数据到localStorage
   * 场景：用户清理了浏览器缓存，localStorage被清空，但IndexedDB可能还在
   */
  async _restoreFromIDB() {
    if (!this._db) return;
    try {
      const allKeys = await this._idbGetAllKeys();
      let restored = 0;
      for (const key of allKeys) {
        const localStorageKey = key; // key already has wb_ prefix
        // 只恢复localStorage中不存在的数据
        if (localStorage.getItem(localStorageKey) === null) {
          const value = await this._idbGet(key);
          if (value !== undefined) {
            localStorage.setItem(localStorageKey, JSON.stringify(value));
            restored++;
          }
        }
      }
      if (restored > 0) {
        console.log(`[Storage] 从IndexedDB恢复了 ${restored} 条数据到localStorage`);
      }
    } catch (e) {
      console.warn('[Storage] 恢复数据失败:', e);
    }
  },

  /**
   * IndexedDB: 获取单个key的值
   */
  _idbGet(key) {
    return new Promise((resolve, reject) => {
      if (!this._db) return resolve(undefined);
      const tx = this._db.transaction(this._storeName, 'readonly');
      const store = tx.objectStore(this._storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * IndexedDB: 写入key-value
   */
  _idbSet(key, value) {
    return new Promise((resolve, reject) => {
      if (!this._db) return resolve();
      const tx = this._db.transaction(this._storeName, 'readwrite');
      const store = tx.objectStore(this._storeName);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * IndexedDB: 删除key
   */
  _idbDelete(key) {
    return new Promise((resolve, reject) => {
      if (!this._db) return resolve();
      const tx = this._db.transaction(this._storeName, 'readwrite');
      const store = tx.objectStore(this._storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * IndexedDB: 获取所有key
   */
  _idbGetAllKeys() {
    return new Promise((resolve, reject) => {
      if (!this._db) return resolve([]);
      const tx = this._db.transaction(this._storeName, 'readonly');
      const store = tx.objectStore(this._storeName);
      const req = store.getAllKeys();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  /**
   * IndexedDB: 获取所有key-value对
   */
  _idbGetAll() {
    return new Promise((resolve, reject) => {
      if (!this._db) return resolve([]);
      const tx = this._db.transaction(this._storeName, 'readonly');
      const store = tx.objectStore(this._storeName);
      const req = store.openCursor();
      const result = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          result.push({ key: cursor.key, value: cursor.value });
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      req.onerror = () => reject(req.error);
    });
  },

  // ===== 同步API（保持与原localStorage版本完全兼容） =====

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this._prefix + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.error('Storage.get error:', key, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      const fullKey = this._prefix + key;
      const jsonStr = JSON.stringify(value);
      // 1. 同步写入localStorage（即时返回，保证后续读取一致性）
      localStorage.setItem(fullKey, jsonStr);
      // 2. 异步写入IndexedDB（持久化，不阻塞主线程）
      this._idbSet(fullKey, value).catch(e => {
        console.warn('[Storage] IndexedDB写入失败:', key, e);
      });
      // 3. 通知同步模块（如果存在）
      if (typeof SyncManager !== 'undefined' && SyncManager._initialized) {
        SyncManager.onDataChange(key);
      }
      return true;
    } catch (e) {
      console.error('Storage.set error:', key, e);
      return false;
    }
  },

  remove(key) {
    try {
      const fullKey = this._prefix + key;
      localStorage.removeItem(fullKey);
      this._idbDelete(fullKey).catch(e => {
        console.warn('[Storage] IndexedDB删除失败:', key, e);
      });
      return true;
    } catch (e) {
      console.error('Storage.remove error:', key, e);
      return false;
    }
  },

  // ===== 数据导出/导入（用于备份和同步） =====

  /**
   * 导出所有数据为JSON对象
   */
  async exportAll() {
    // 优先从IndexedDB导出（最完整的数据源）
    const idbData = await this._idbGetAll();
    const result = {};
    for (const item of idbData) {
      // 去掉wb_前缀，用原始key
      const cleanKey = item.key.replace(/^wb_/, '');
      result[cleanKey] = item.value;
    }
    // 补充localStorage中有但IndexedDB中暂未写入的数据
    for (let i = 0; i < localStorage.length; i++) {
      const fullKey = localStorage.key(i);
      if (fullKey && fullKey.startsWith(this._prefix)) {
        const cleanKey = fullKey.replace(this._prefix, '');
        if (!(cleanKey in result)) {
          try {
            result[cleanKey] = JSON.parse(localStorage.getItem(fullKey));
          } catch (e) { /* skip invalid */ }
        }
      }
    }
    return result;
  },

  /**
   * 导出为JSON字符串
   */
  async exportJSON() {
    const data = await this.exportAll();
    return JSON.stringify({
      _meta: {
        app: 'CosmosWorkbench',
        version: '1.0',
        exportTime: new Date().toISOString(),
        keyCount: Object.keys(data).length
      },
      data: data
    }, null, 2);
  },

  /**
   * 从JSON对象导入数据（合并模式，不覆盖未在JSON中的数据）
   * @param {Object} jsonObj - { data: { key: value, ... } } 或直接 { key: value }
   * @param {boolean} merge - true=合并, false=完全替换
   */
  async importFromJSON(jsonObj, merge = true) {
    const data = jsonObj.data || jsonObj;
    if (!data || typeof data !== 'object') {
      throw new Error('无效的JSON数据格式');
    }

    if (!merge) {
      // 完全替换模式：先清空
      await this.clearAll();
    }

    let count = 0;
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value);
      count++;
    }
    console.log(`[Storage] 导入完成，共 ${count} 条数据`);
    return count;
  },

  /**
   * 清空所有数据（谨慎使用）
   */
  async clearAll() {
    // 清空localStorage中wb_前缀的数据
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this._prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));

    // 清空IndexedDB
    if (this._db) {
      return new Promise((resolve) => {
        const tx = this._db.transaction(this._storeName, 'readwrite');
        const store = tx.objectStore(this._storeName);
        const req = store.clear();
        req.onsuccess = () => {
          console.log('[Storage] 所有数据已清空');
          resolve();
        };
        req.onerror = () => resolve();
      });
    }
  },

  // ===== 工具方法 =====

  uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  today() {
    return this.formatDate(new Date());
  },

  formatDate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  },

  getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  },

  getWeekDates(year, week) {
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = jan1.getDay() || 7;
    const monday = new Date(jan1);
    monday.setDate(jan1.getDate() - dayOfWeek + 1 + (week - 1) * 7);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  },

  getWeekYear(date) {
    const d = new Date(date);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return d.getFullYear();
  }
};

// Toast 提示
function showToast(msg, duration = 2000) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}
