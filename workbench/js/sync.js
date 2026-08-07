/**
 * 云端同步模块 - 实现PC端和手机端双向数据同步
 *
 * 工作原理：
 * 1. 数据变更时 debounce 5秒后自动 push 到云端
 * 2. 应用启动时自动 pull 云端数据并合并
 * 3. 手动同步按钮：先 pull 再 push
 *
 * 云端存储：支持配置任意兼容 jsonbin.io 风格的 JSON 存储服务
 * - GET endpoint: 返回 { data: { ... } }
 * - PUT endpoint: 接收 { data: { ... } } 并存储
 *
 * 合并策略：
 * - 云端有本地没有的 key：导入
 * - 本地有云端没有的 key：保留（下次 push 时上传）
 * - 两端都有：深度合并对象（按日期键合并），非对象取云端较新值
 */
const SyncManager = {
  _initialized: false,
  _endpoint: '',
  _token: '',
  _spaceId: '',
  _autoSync: true,
  _lastSync: 0,
  _syncTimer: null,
  _deviceId: '',
  _isSyncing: false,
  _online: true,

  init() {
    this._endpoint = Storage.get('sync_endpoint', '');
    this._token = Storage.get('sync_token', '');
    this._spaceId = Storage.get('sync_space', '');
    this._autoSync = Storage.get('sync_auto', true);
    this._lastSync = Storage.get('sync_last', 0);
    this._deviceId = this._getDeviceId();
    this._initialized = true;

    // 监听网络状态，网络恢复后自动同步
    window.addEventListener('online', () => {
      this._online = true;
      console.log('[Sync] 网络已恢复，触发自动同步');
      if (this._endpoint) {
        this.sync(true).catch(e => console.warn('[Sync] 恢复后同步失败:', e));
      }
    });
    window.addEventListener('offline', () => {
      this._online = false;
      console.log('[Sync] 网络已断开');
    });
    this._online = navigator.onLine;

    // 启动后自动拉取云端数据（延迟2秒，等应用完全初始化）
    if (this._endpoint) {
      setTimeout(() => {
        this.sync(true).catch(e => console.warn('[Sync] 自动同步失败:', e));
      }, 2000);
    }

    // 定时自动同步（每5分钟）
    if (this._endpoint && this._autoSync) {
      setInterval(() => {
        if (this._endpoint && !this._isSyncing) {
          this.sync(true).catch(e => console.warn('[Sync] 定时同步失败:', e));
        }
      }, 5 * 60 * 1000);
    }
  },

  /**
   * 配置云端同步端点和同步空间
   * @param {string} endpoint - 云端存储端点URL
   * @param {string} token - 访问密钥
   * @param {boolean} autoSync - 是否自动同步
   * @param {string} spaceId - 同步空间标识（两台设备输入相同标识即配对同步）
   */
  configure(endpoint, token, autoSync, spaceId) {
    this._endpoint = (endpoint || '').trim();
    this._token = (token || '').trim();
    if (autoSync !== undefined) this._autoSync = autoSync;
    if (spaceId !== undefined) this._spaceId = (spaceId || '').trim();

    Storage.set('sync_endpoint', this._endpoint);
    Storage.set('sync_token', this._token);
    Storage.set('sync_auto', this._autoSync);
    Storage.set('sync_space', this._spaceId);
  },

  /**
   * 获取同步配置
   */
  getConfig() {
    return {
      endpoint: this._endpoint,
      token: this._token ? '已设置' : '',
      spaceId: this._spaceId,
      autoSync: this._autoSync,
      lastSync: this._lastSync,
      deviceId: this._deviceId,
      online: this._online
    };
  },

  /**
   * 获取设备唯一标识
   */
  _getDeviceId() {
    let id = Storage.get('device_id', '');
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
      Storage.set('device_id', id);
    }
    return id;
  },

  /**
   * 数据变更通知（由 Storage.set 调用）
   * debounce 5秒后自动 push
   */
  onDataChange(key) {
    if (!this._initialized || !this._endpoint || !this._autoSync) return;
    // 跳过同步配置本身的 key
    if (key.startsWith('sync_') || key === 'device_id') return;

    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this.push().catch(e => console.warn('[Sync] 自动push失败:', e));
    }, 5000);
  },

  /**
   * 推送本地数据到云端
   */
  async push() {
    if (!this._endpoint) {
      showToast('未配置同步端点', 2000);
      return false;
    }
    if (this._isSyncing) return false;

    this._isSyncing = true;
    try {
      const data = await Storage.exportAll();
      // 移除同步配置数据，避免循环
      delete data.sync_endpoint;
      delete data.sync_token;
      delete data.device_id;

      const payload = {
        device: this._deviceId,
        timestamp: Date.now(),
        data: data
      };

      const headers = { 'Content-Type': 'application/json' };
      if (this._token) headers['X-Master-Key'] = this._token;

      const response = await fetch(this._endpoint, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this._lastSync = Date.now();
      Storage.set('sync_last', this._lastSync);
      console.log('[Sync] Push成功，共', Object.keys(data).length, '条数据');
      return true;
    } catch (e) {
      console.error('[Sync] Push失败:', e);
      showToast('同步推送失败: ' + e.message, 3000);
      return false;
    } finally {
      this._isSyncing = false;
    }
  },

  /**
   * 拉取云端数据
   */
  async pull() {
    if (!this._endpoint) return null;

    const headers = {};
    if (this._token) headers['X-Master-Key'] = this._token;

    const response = await fetch(this._endpoint, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    // jsonbin.io wraps in { record: ... }, 兼容多种格式
    const payload = result.record || result.data || result;
    if (!payload || !payload.data) return null;
    return payload;
  },

  /**
   * 合并云端数据到本地
   * 策略：深度合并，保留本地独有的key，云端独有的key导入，冲突时取较新值
   */
  async merge(cloudPayload) {
    if (!cloudPayload || !cloudPayload.data) return { added: 0, updated: 0 };

    const cloudData = cloudPayload.data;
    const cloudTimestamp = cloudPayload.timestamp || 0;
    const localData = await Storage.exportAll();

    let added = 0, updated = 0;

    for (const [key, cloudValue] of Object.entries(cloudData)) {
      // 跳过同步配置 key
      if (key.startsWith('sync_') || key === 'device_id') continue;

      const localValue = localData[key];

      if (localValue === undefined || localValue === null) {
        // 本地没有此 key，直接导入
        Storage.set(key, cloudValue);
        added++;
      } else {
        // 两端都有，尝试深度合并
        const merged = this._deepMerge(localValue, cloudValue, cloudTimestamp);
        // 只有合并结果与本地不同时才写入
        if (JSON.stringify(merged) !== JSON.stringify(localValue)) {
          Storage.set(key, merged);
          updated++;
        }
      }
    }

    console.log(`[Sync] 合并完成: 新增 ${added} 条, 更新 ${updated} 条`);
    return { added, updated };
  },

  /**
   * 深度合并两个值
   * - 两个对象：按 key 合并，每个 key 取较新值
   * - 两个数组：取较新的（云端 timestamp > lastSync 则取云端）
   * - 其他类型：取云端值（如果云端更新）
   */
  _deepMerge(localValue, cloudValue, cloudTimestamp) {
    // 如果不是对象/数组，直接比较时间戳
    if (typeof localValue !== 'object' || typeof cloudValue !== 'object' ||
        localValue === null || cloudValue === null) {
      // 云端比上次同步时间新，说明有更新
      return cloudTimestamp > this._lastSync ? cloudValue : localValue;
    }

    // 两个数组
    if (Array.isArray(localValue) && Array.isArray(cloudValue)) {
      return cloudTimestamp > this._lastSync ? cloudValue : localValue;
    }

    // 两个对象：逐 key 合并
    const result = JSON.parse(JSON.stringify(localValue)); // 深拷贝本地
    for (const [k, v] of Object.entries(cloudValue)) {
      if (k in result) {
        // 递归合并
        result[k] = this._deepMerge(result[k], v, cloudTimestamp);
      } else {
        // 本地没有此 key，导入
        result[k] = v;
      }
    }
    return result;
  },

  /**
   * 完整同步：先 pull 合并，再 push
   * @param {boolean} silent - 是否静默执行（不显示toast）
   */
  async sync(silent = false) {
    if (!this._endpoint) {
      if (!silent) showToast('请先配置同步端点', 2000);
      return false;
    }
    if (this._isSyncing) {
      if (!silent) showToast('正在同步中...', 1000);
      return false;
    }

    if (!silent) showToast('正在同步数据...', 1500);

    try {
      // 1. 拉取云端数据
      const cloudPayload = await this.pull();
      // 2. 合并到本地
      if (cloudPayload) {
        const result = await this.merge(cloudPayload);
        if (!silent && (result.added > 0 || result.updated > 0)) {
          showToast(`同步成功: 新增${result.added}条, 更新${result.updated}条`, 2500);
        } else if (!silent) {
          showToast('已是最新数据', 1500);
        }
      }
      // 3. 推送本地数据到云端
      await this.push();
      if (!silent) showToast('数据同步完成 ✓', 2000);
      return true;
    } catch (e) {
      console.error('[Sync] 同步失败:', e);
      if (!silent) showToast('同步失败: ' + e.message, 3000);
      return false;
    }
  },

  /**
   * 强制同步：网络波动时一键触发，带重试机制
   * 跳过 debounce，立即执行 pull→merge→push，失败自动重试2次
   */
  async forceSync() {
    if (!this._endpoint) {
      showToast('请先在数据管理中配置同步空间', 2500);
      return false;
    }
    if (!navigator.onLine) {
      showToast('当前无网络连接，请检查网络后重试', 2500);
      return false;
    }
    // 如果正在同步，等待当前完成
    if (this._isSyncing) {
      showToast('正在同步中，请稍候...', 1500);
      // 等待最多10秒
      for (let i = 0; i < 20 && this._isSyncing; i++) {
        await new Promise(r => setTimeout(r, 500));
      }
      if (this._isSyncing) return false;
    }

    showToast('🔄 正在强制同步数据...', 2000);
    let lastError = null;
    // 最多重试3次
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const ok = await this.sync(false);
        if (ok) {
          console.log(`[Sync] 强制同步成功（第${attempt}次尝试）`);
          return true;
        }
      } catch (e) {
        lastError = e;
        console.warn(`[Sync] 第${attempt}次同步失败:`, e.message);
        if (attempt < 3) {
          showToast(`同步失败，重试中(${attempt}/3)...`, 1500);
          await new Promise(r => setTimeout(r, 1500));
        }
      }
    }
    showToast('同步失败: ' + (lastError ? lastError.message : '未知错误') + '，请检查网络和配置', 3500);
    return false;
  },

  /**
   * 获取上次同步状态
   */
  getStatus() {
    if (!this._endpoint) return { status: '未配置同步空间', color: '#999', detail: '点击配置' };
    if (!this._online) return { status: '离线', color: '#F44336', detail: '网络已断开' };
    if (this._isSyncing) return { status: '同步中...', color: '#FF9800', detail: '请稍候' };
    if (this._lastSync) {
      const ago = this._formatTimeAgo(this._lastSync);
      return { status: '已同步 · ' + ago, color: '#4CAF50', detail: ago };
    }
    return { status: '待同步', color: '#FF9800', detail: '点击同步' };
  },

  _formatTimeAgo(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + '分钟前';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + '小时前';
    const days = Math.floor(hours / 24);
    return days + '天前';
  }
};
