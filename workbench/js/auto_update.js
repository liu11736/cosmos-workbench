/**
 * 自动更新调度系统
 * - 每日灵感/爆款二创: 每日0点自动刷新热点
 * - 新闻联播: 每日19:30后自动同步
 * - 财联社资讯: 每30分钟自动同步
 * - 基金策略: 每日15:30自动更新推荐
 * - 所有板块支持手动刷新按钮
 * - 更新不覆盖历史，仅追加/替换当日最新内容
 */
const AutoUpdate = {
  // 各模块刷新配置
  configs: {
    inspiration: { type: 'daily', time: '00:00', lastKey: 'au_inspiration', label: '每日灵感' },
    viral:       { type: 'daily', time: '00:00', lastKey: 'au_viral',       label: '爆款二创' },
    news:        { type: 'daily', time: '19:30', lastKey: 'au_news',        label: '新闻联播' },
    finance:     { type: 'interval', minutes: 30, lastKey: 'au_finance',    label: '财联社资讯' },
    fund:        { type: 'daily', time: '15:30', lastKey: 'au_fund',        label: '基金策略' }
  },

  refreshableModules: ['inspiration', 'viral', 'news', 'finance', 'fund'],
  _timer: null,

  init() {
    // 启动时检查一次
    this.checkAll();
    // 每60秒检查一次
    this._timer = setInterval(() => this.checkAll(), 60000);
  },

  /** 检查所有模块是否需要更新 */
  checkAll() {
    const now = new Date();
    this.refreshableModules.forEach(moduleId => {
      const config = this.configs[moduleId];
      const lastUpdate = Storage.get(config.lastKey, null);
      if (this.needsUpdate(config, lastUpdate, now)) {
        this.doRefresh(moduleId, false);
      }
    });
  },

  /** 判断是否需要更新 */
  needsUpdate(config, lastUpdate, now) {
    if (!lastUpdate) return true;
    const last = new Date(lastUpdate);

    if (config.type === 'daily') {
      const [h, m] = config.time.split(':').map(Number);
      const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      // 当前时间已过更新时间，且上次更新在今天更新时间之前
      if (now >= todayTime && last < todayTime) return true;
    } else if (config.type === 'interval') {
      const intervalMs = config.minutes * 60 * 1000;
      if (now - last >= intervalMs) return true;
    }
    return false;
  },

  /** 执行刷新 */
  doRefresh(moduleId, isManual) {
    const config = this.configs[moduleId];
    const module = App.modules[moduleId];
    if (!module || typeof module.refresh !== 'function') return;

    try {
      module.refresh();
      Storage.set(config.lastKey, new Date().toISOString());

      if (isManual) {
        showToast(`✅ ${config.label}已更新`);
        // 如果当前正在查看该模块，重新渲染
        if (App.currentSection === moduleId) {
          App.switchTab(moduleId, App.currentTab);
        }
      }
    } catch (e) {
      console.error('Refresh error:', moduleId, e);
      if (isManual) showToast(`❌ 刷新失败`);
    }
  },

  /** 手动刷新 */
  manualRefresh(moduleId) {
    const config = this.configs[moduleId];
    showToast(`🔄 正在刷新${config.label}...`);
    setTimeout(() => this.doRefresh(moduleId, true), 300);
  },

  /** 获取上次更新时间描述 */
  getLastUpdateText(moduleId) {
    const config = this.configs[moduleId];
    if (!config) return '';
    const last = Storage.get(config.lastKey, null);
    if (!last) return '尚未更新';
    const d = new Date(last);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return '刚刚更新';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    return Storage.formatDate(d) + '更新';
  },

  /** 判断模块是否支持刷新 */
  isRefreshable(moduleId) {
    return this.refreshableModules.includes(moduleId);
  }
};
