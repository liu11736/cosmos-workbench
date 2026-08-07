/**
 * 主应用 - 导航、路由、弹窗系统
 */
const App = {
  currentSection: 'daily',
  currentTab: null,
  modules: {},

  // 导航配置
  navConfig: [
    { id: 'daily', name: '每日打卡', icon: '✅', module: 'daily', defaultTab: 'daily-list' },
    { id: 'english', name: '四级英语单词', icon: '📖', module: 'english', defaultTab: 'vocabulary' },
    { id: 'inspiration', name: '每日灵感', icon: '💡', module: 'inspiration', defaultTab: 'hotspot' },
    { id: 'pets', name: '宠物管理', icon: '🐱', module: 'pets', defaultTab: 'overview' },
    { id: 'viral', name: '爆款二创', icon: '🔥', module: 'viral', defaultTab: 'hamster' },
    { id: 'recipe', name: '菜谱', icon: '🍳', module: 'recipe', defaultTab: 'recipe-list' },
    { id: 'news', name: '新闻联播', icon: '📺', module: 'news', defaultTab: 'replay' },
    { id: 'finance', name: '财联社资讯', icon: '📈', module: 'finance', defaultTab: 'macro' },
    { id: 'fund', name: '基金策略', icon: '📊', module: 'fund', defaultTab: 'daily-rec' }
  ],

  async init() {
    // 1. 初始化存储引擎（IndexedDB + localStorage 恢复）
    await Storage.init();

    // 2. 初始化各功能模块
    DailyModule.init();
    EnglishModule.init();
    PetsModule.init();
    InspirationModule.init();
    ViralModule.init();
    RecipeModule.init();
    NewsModule.init();
    FinanceModule.init();
    FundModule.init();

    this.modules = {
      daily: DailyModule,
      english: EnglishModule,
      pets: PetsModule,
      inspiration: InspirationModule,
      viral: ViralModule,
      recipe: RecipeModule,
      news: NewsModule,
      finance: FinanceModule,
      fund: FundModule
    };

    this.renderNav();
    this.renderFooterDate();
    this.bindGlobalEvents();

    // 3. 初始化云端同步（依赖Storage已就绪）
    SyncManager.init();

    // 4. 初始化PWA安装检测
    DataManager.init();

    // 更新侧边栏同步按钮状态（定时刷新）
    this.updateSyncButtonStatus();
    setInterval(() => this.updateSyncButtonStatus(), 60000);

    // 5. 初始化自动更新系统
    if (typeof AutoUpdate !== 'undefined') {
      AutoUpdate.init();
    }

    this.switchSection('daily');
  },

  renderNav() {
    const nav = document.getElementById('sidebarNav');
    nav.innerHTML = this.navConfig.map(item => `
      <div class="nav-item ${item.id === this.currentSection ? 'active' : ''}" data-section="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-text">${item.name}</span>
      </div>
    `).join('');

    nav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchSection(item.dataset.section);
      });
    });
  },

  renderFooterDate() {
    const now = new Date();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    document.getElementById('footerDate').textContent =
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${weekdays[now.getDay()]}`;
  },

  bindGlobalEvents() {
    // 电脑端：侧边栏收起/展开
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      if (!this.isMobile()) {
        document.getElementById('sidebar').classList.toggle('collapsed');
      }
    });

    // 移动端：汉堡按钮唤出/收起侧边栏
    const mobileBtn = document.getElementById('mobileMenuBtn');
    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        this.toggleMobileSidebar();
      });
    }

    // 移动端：点击遮罩层收起侧边栏
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        this.closeMobileSidebar();
      });
    }

    // 数据管理按钮
    const dataBtn = document.getElementById('sidebarDataBtn');
    if (dataBtn) {
      dataBtn.addEventListener('click', () => {
        DataManager.openPanel();
        this.closeMobileSidebar();
      });
    }

    // 一键同步按钮
    const syncBtn = document.getElementById('sidebarSyncBtn');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        await SyncManager.forceSync();
        this.updateSyncButtonStatus();
        this.closeMobileSidebar();
      });
    }

    // 窗口尺寸变化时，自动清理侧边栏状态
    window.addEventListener('resize', () => {
      if (this.isMobile()) {
        // 进入移动端：清除 collapsed，确保完全隐藏
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.remove('collapsed');
        this.closeMobileSidebar();
      } else {
        // 进入桌面端：清除移动端 open 状态
        this.closeMobileSidebar();
      }
    });
  },

  /** 检测是否为移动端（窄屏） */
  isMobile() {
    return window.innerWidth <= 768;
  },

  /** 切换移动端侧边栏 */
  toggleMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar.classList.contains('open')) {
      this.closeMobileSidebar();
    } else {
      sidebar.classList.add('open');
      overlay.classList.add('show');
    }
  },

  /** 收起移动端侧边栏 */
  closeMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
  },

  /** 更新侧边栏同步按钮的状态显示 */
  updateSyncButtonStatus() {
    const syncBtn = document.getElementById('sidebarSyncBtn');
    if (!syncBtn) return;
    const status = SyncManager.getStatus();
    const icon = syncBtn.querySelector('.sync-icon');
    if (icon) {
      if (status.color === '#4CAF50') icon.textContent = '✅';
      else if (status.color === '#FF9800') icon.textContent = '⏳';
      else if (status.color === '#F44336') icon.textContent = '⚠️';
      else icon.textContent = '☁️';
    }
    syncBtn.title = status.status;
  },

  switchSection(sectionId) {
    this.currentSection = sectionId;
    const config = this.navConfig.find(n => n.id === sectionId);
    if (!config) return;

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === sectionId);
    });

    document.getElementById('mainContent').setAttribute('data-section', sectionId);

    // 更新移动端头部栏标题
    const headerTitle = document.getElementById('mobileHeaderTitle');
    if (headerTitle) {
      headerTitle.textContent = config.name;
    }

    const sectionColors = {
      daily: '#FF6B35', english: '#2196F3', inspiration: '#9C27B0',
      pets: '#E91E63', viral: '#F44336', recipe: '#4CAF50',
      news: '#00BCD4', finance: '#3F51B5', fund: '#FF9800'
    };
    document.getElementById('sidebar').style.borderRightColor = sectionColors[sectionId] || '#6C5CE7';

    // 移动端切换板块后自动收起侧边栏
    if (this.isMobile()) {
      this.closeMobileSidebar();
    }

    this.renderSubTabs(config);
    this.switchTab(sectionId, config.defaultTab);
  },

  switchTab(sectionId, tabId) {
    this.currentTab = tabId;
    const config = this.navConfig.find(n => n.id === sectionId);
    if (!config) return;

    document.querySelectorAll('.sub-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });

    const container = document.getElementById('contentContainer');
    container.innerHTML = '';

    const module = this.modules[config.module];
    if (module && module.render) {
      module.render(tabId, container);
    }
  },

  renderSubTabs(config) {
    const bar = document.getElementById('subTabsBar');
    let tabs = [];

    const module = this.modules[config.module];
    if (module && module.getTabs) {
      tabs = module.getTabs();
    }

    const isRefreshable = (typeof AutoUpdate !== 'undefined') && AutoUpdate.isRefreshable(config.module);
    const lastUpdateText = isRefreshable ? AutoUpdate.getLastUpdateText(config.module) : '';

    bar.innerHTML = `
      <div class="sub-tabs-left">
        ${tabs.map(tab => `
          <div class="sub-tab ${tab.id === config.defaultTab ? 'active' : ''}" data-tab="${tab.id}">${tab.name}</div>
        `).join('')}
      </div>
      ${isRefreshable ? `
        <div class="sub-tabs-right">
          <span class="refresh-time-text">${lastUpdateText}</span>
          <button class="refresh-btn" id="refreshBtn" title="手动刷新">🔄 刷新</button>
        </div>
      ` : ''}
    `;

    bar.querySelectorAll('.sub-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(config.id, tab.dataset.tab);
      });
    });

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        AutoUpdate.manualRefresh(config.module);
      });
    }
  },

  // ===== 弹窗系统 =====
  showModal(title, bodyHTML, onConfirm, opts) {
    const overlay = document.getElementById('modalOverlay');
    const maxWidth = (opts && opts.maxWidth) || '560px';
    const confirmText = (opts && opts.confirmText) || '确认';
    const hideFooter = (opts && opts.hideFooter) || false;
    overlay.innerHTML = `
      <div class="modal" style="max-width:${maxWidth}">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" id="modalCloseBtn">&times;</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        ${hideFooter ? '' : `
        <div class="modal-footer">
          <button class="btn btn-outline" id="modalCancelBtn">取消</button>
          <button class="btn btn-primary" id="modalConfirmBtn">${confirmText}</button>
        </div>`}
      </div>
    `;
    overlay.classList.add('show');

    const close = () => {
      overlay.classList.remove('show');
      overlay.innerHTML = '';
    };

    document.getElementById('modalCloseBtn').addEventListener('click', close);
    if (!hideFooter) {
      document.getElementById('modalCancelBtn').addEventListener('click', close);
      document.getElementById('modalConfirmBtn').addEventListener('click', () => {
        const result = onConfirm ? onConfirm() : true;
        if (result !== false) close();
      });
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
  },

  closeModal() {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('show');
    overlay.innerHTML = '';
  },

  showConfirm(message, onConfirm) {
    const overlay = document.getElementById('modalOverlay');
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-body">
          <p style="text-align:center;font-size:15px;color:var(--text-main);padding:12px 0">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" id="confirmCancelBtn">取消</button>
          <button class="btn btn-primary" id="confirmOkBtn">确认</button>
        </div>
      </div>
    `;
    overlay.classList.add('show');

    const close = () => {
      overlay.classList.remove('show');
      overlay.innerHTML = '';
    };

    document.getElementById('confirmCancelBtn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.getElementById('confirmOkBtn').addEventListener('click', () => {
      close();
      if (onConfirm) onConfirm();
    });
  }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  App.init().catch(e => {
    console.error('应用启动失败:', e);
    // 即使出错也尝试初始化（降级模式）
    App.switchSection('daily');
  });
});
