/**
 * 数据管理面板 - PWA安装 + 云端同步 + JSON备份/恢复
 *
 * 功能：
 * 1. PWA 安装按钮（检测浏览器安装提示，一键安装）
 * 2. 云端同步配置（端点URL、Token、自动同步开关、手动同步按钮）
 * 3. JSON 数据导出（下载全部数据为JSON文件）
 * 4. JSON 数据导入（上传JSON文件恢复数据）
 * 5. 存储状态显示（IndexedDB状态、数据条数）
 */
const DataManager = {
  _deferredPrompt: null,  // PWA安装提示事件
  _installBtnAvailable: false,

  init() {
    // 监听 PWA 安装提示事件
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this._deferredPrompt = e;
      this._installBtnAvailable = true;
      console.log('[PWA] 安装提示已就绪');
    });

    // 监听安装完成事件
    window.addEventListener('appinstalled', () => {
      this._deferredPrompt = null;
      this._installBtnAvailable = false;
      showToast('应用已安装到桌面 ✓', 2500);
      console.log('[PWA] 应用已安装');
    });

    // 检测是否已在PWA模式运行
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      console.log('[PWA] 以独立应用模式运行');
    }
  },

  /**
   * 打开数据管理面板
   */
  openPanel() {
    const syncStatus = SyncManager.getStatus();
    const syncConfig = SyncManager.getConfig();
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    const canInstall = this._installBtnAvailable;
    const isAndroid = /android/i.test(navigator.userAgent);
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    const bodyHTML = `
      <div class="data-mgr-panel">
        <!-- 快速同步 -->
        <div class="dm-section dm-quick-sync">
          <div class="dm-sync-status">
            <span class="dm-status-dot" style="background:${syncStatus.color}"></span>
            <span class="dm-sync-text">${syncStatus.status}</span>
          </div>
          <button class="btn btn-primary dm-full-btn dm-force-sync-btn" id="dmForceSync">
            🔄 一键强制同步
          </button>
          <p class="dm-hint">网络波动或数据不一致时，点击此按钮强制双向同步<br>电脑端和小米15手机端数据实时互通</p>
        </div>

        <!-- 小米手机安装指引（内置文字） -->
        <div class="dm-section dm-install-guide">
          <div class="dm-section-title">📱 安装为手机桌面应用</div>
          ${isPWA ? `
            <div class="dm-status-badge dm-status-success">✅ 当前已以独立应用模式运行</div>
            <p class="dm-hint">应用已安装，可从桌面图标直接启动</p>
          ` : canInstall ? `
            <button class="btn btn-primary dm-full-btn" id="dmInstallBtn">
              📲 一键添加到桌面
            </button>
            <p class="dm-hint">点击后选择"安装"，桌面将生成「宇宙边角办事处」独立图标</p>
          ` : `
            <div class="dm-install-steps">
              <div class="dm-step">
                <span class="dm-step-num">1</span>
                <div class="dm-step-body">
                  <b>打开浏览器访问工作台</b><br>
                  <span class="dm-step-detail">在小米15手机上打开浏览器（Chrome/Edge/小米浏览器），输入工作台网址访问页面</span>
                </div>
              </div>
              <div class="dm-step">
                <span class="dm-step-num">2</span>
                <div class="dm-step-body">
                  <b>点击浏览器右上角菜单</b><br>
                  <span class="dm-step-detail">点击浏览器右上角「⋮」三点菜单图标，展开菜单选项</span>
                </div>
              </div>
              <div class="dm-step">
                <span class="dm-step-num">3</span>
                <div class="dm-step-body">
                  <b>选择"添加到桌面"或"安装应用"</b><br>
                  <span class="dm-step-detail">在菜单中找到「添加到桌面」或「安装应用」选项并点击<br>小米浏览器：菜单 → 添加到桌面<br>Chrome：菜单 → 安装应用 / 添加到主屏幕<br>Edge：菜单 → 添加到手机 → 安装</span>
                </div>
              </div>
              <div class="dm-step">
                <span class="dm-step-num">4</span>
                <div class="dm-step-body">
                  <b>确认安装，桌面生成独立图标</b><br>
                  <span class="dm-step-detail">弹出确认框点击「添加/安装」，桌面将出现「宇宙边角办事处」应用图标</span>
                </div>
              </div>
              <div class="dm-step">
                <span class="dm-step-num">5</span>
                <div class="dm-step-body">
                  <b>点开图标，全屏启动</b><br>
                  <span class="dm-step-detail">点击桌面图标直接全屏启动工作台，无需打开浏览器，无地址栏干扰，接近原生App体验</span>
                </div>
              </div>
            </div>
          `}
        </div>

        <!-- 云端同步配置 -->
        <div class="dm-section">
          <div class="dm-section-title">☁️ 跨设备云端同步</div>
          <div class="dm-form-group">
            <label class="dm-form-label">同步空间标识（登录标识）</label>
            <input type="text" class="dm-input-field" id="dmSyncSpace"
              value="${syncConfig.spaceId || ''}"
              placeholder="例如：my-workbench-2026"
              autocomplete="off">
            <p class="dm-hint">电脑端和小米手机输入<b>相同的同步空间标识</b>，两端即自动配对同步</p>
          </div>
          <div class="dm-form-group">
            <label class="dm-form-label">云端存储端点 URL</label>
            <input type="text" class="dm-input-field" id="dmSyncEndpoint"
              value="${syncConfig.endpoint || ''}"
              placeholder="https://api.jsonbin.io/v3/b/your-bin-id"
              autocomplete="off">
            <p class="dm-hint">支持 <a href="https://jsonbin.io" target="_blank" style="color:var(--color-primary);font-weight:600">jsonbin.io</a> 免费云存储，两端配置相同端点即可同步</p>
          </div>
          <div class="dm-form-group">
            <label class="dm-form-label">访问密钥 Token（可选）</label>
            <input type="password" class="dm-input-field" id="dmSyncToken"
              value="${syncConfig.token}"
              placeholder="$2a$10$... 或留空"
              autocomplete="off">
          </div>
          <div class="dm-toggle-row">
            <span class="dm-form-label" style="margin:0">自动实时同步</span>
            <label class="dm-switch">
              <input type="checkbox" id="dmAutoSync" ${syncConfig.autoSync ? 'checked' : ''}>
              <span class="dm-switch-slider"></span>
            </label>
          </div>
          <div class="dm-btn-row">
            <button class="btn btn-primary" id="dmSaveSync">💾 保存配置</button>
            <button class="btn btn-outline" id="dmSyncNow">🔄 立即同步</button>
          </div>
          <div class="dm-sync-tips">
            <b>💡 使用方法：</b>电脑和小米15手机都打开「数据管理」→ 输入相同的同步空间标识和端点URL → 保存。之后任意一端录入数据，另一端自动同步最新内容。网络波动时点击「一键强制同步」即可。
          </div>
        </div>

        <!-- 数据备份 -->
        <div class="dm-section">
          <div class="dm-section-title">💾 数据备份与恢复</div>
          <div class="dm-btn-row">
            <button class="btn btn-outline dm-backup-btn" id="dmExportBtn">⬇️ 导出全部数据存档</button>
            <button class="btn btn-outline dm-backup-btn" id="dmImportBtn">⬆️ 导入备份数据</button>
          </div>
          <input type="file" id="dmImportFile" accept=".json" style="display:none">
          <p class="dm-hint">
            导出全部数据为 JSON 文件存档到本地，防止意外丢失<br>
            支持合并导入（保留现有数据）或完全替换（用备份覆盖）
          </p>
        </div>

        <!-- 存储信息 -->
        <div class="dm-section">
          <div class="dm-section-title">📊 存储状态</div>
          <div class="dm-info-grid" id="dmStorageInfo">
            <div class="dm-info-item">
              <span class="dm-info-label">存储引擎</span>
              <span class="dm-info-value">IndexedDB 持久化</span>
            </div>
            <div class="dm-info-item">
              <span class="dm-info-label">数据条目</span>
              <span class="dm-info-value" id="dmDataCount">计算中...</span>
            </div>
            <div class="dm-info-item">
              <span class="dm-info-label">设备标识</span>
              <span class="dm-info-value" style="font-size:12px">${syncConfig.deviceId}</span>
            </div>
            <div class="dm-info-item">
              <span class="dm-info-label">网络状态</span>
              <span class="dm-info-value" style="color:${syncConfig.online ? '#4CAF50' : '#F44336'}">${syncConfig.online ? '在线' : '离线'}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    App.showModal('数据管理中心', bodyHTML, null, {
      maxWidth: '560px',
      hideFooter: true
    });

    // 绑定事件
    this._bindPanelEvents();
    this._loadDataCount();
  },

  /**
   * 绑定面板内的事件
   */
  _bindPanelEvents() {
    // 一键强制同步
    const forceSyncBtn = document.getElementById('dmForceSync');
    if (forceSyncBtn) {
      forceSyncBtn.addEventListener('click', async () => {
        forceSyncBtn.disabled = true;
        forceSyncBtn.textContent = '同步中...';
        // 先保存当前配置
        this._saveSyncConfigFromForm();
        await SyncManager.forceSync();
        forceSyncBtn.disabled = false;
        forceSyncBtn.textContent = '🔄 一键强制同步';
        // 更新面板状态显示
        const status = SyncManager.getStatus();
        const dot = document.querySelector('.dm-quick-sync .dm-status-dot');
        const txt = document.querySelector('.dm-quick-sync .dm-sync-text');
        if (dot) dot.style.background = status.color;
        if (txt) txt.textContent = status.status;
      });
    }

    // PWA安装
    const installBtn = document.getElementById('dmInstallBtn');
    if (installBtn) {
      installBtn.addEventListener('click', () => this._installPWA());
    }

    // 保存同步配置
    const saveBtn = document.getElementById('dmSaveSync');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this._saveSyncConfigFromForm();
        showToast('同步配置已保存 ✓ 两端配置相同标识即可配对', 2500);
      });
    }

    // 立即同步
    const syncNowBtn = document.getElementById('dmSyncNow');
    if (syncNowBtn) {
      syncNowBtn.addEventListener('click', async () => {
        syncNowBtn.disabled = true;
        syncNowBtn.textContent = '同步中...';
        this._saveSyncConfigFromForm();
        await SyncManager.sync(false);
        syncNowBtn.disabled = false;
        syncNowBtn.textContent = '🔄 立即同步';
      });
    }

    // 导出数据
    const exportBtn = document.getElementById('dmExportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this._exportData());
    }

    // 导入数据
    const importBtn = document.getElementById('dmImportBtn');
    const importFile = document.getElementById('dmImportFile');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => this._importData(e));
    }
  },

  /**
   * 从表单读取并保存同步配置
   */
  _saveSyncConfigFromForm() {
    const endpoint = document.getElementById('dmSyncEndpoint').value.trim();
    const token = document.getElementById('dmSyncToken').value.trim();
    const autoSync = document.getElementById('dmAutoSync').checked;
    const spaceId = document.getElementById('dmSyncSpace').value.trim();
    SyncManager.configure(endpoint, token, autoSync, spaceId);
  },

  /**
   * 加载数据条目数
   */
  async _loadDataCount() {
    try {
      const data = await Storage.exportAll();
      const count = Object.keys(data).length;
      const el = document.getElementById('dmDataCount');
      if (el) el.textContent = count + ' 条';
    } catch (e) {
      const el = document.getElementById('dmDataCount');
      if (el) el.textContent = '获取失败';
    }
  },

  /**
   * 触发 PWA 安装
   */
  async _installPWA() {
    if (!this._deferredPrompt) {
      showToast('当前浏览器不支持直接安装，请使用浏览器菜单中的"安装应用"', 3000);
      return;
    }
    this._deferredPrompt.prompt();
    const { outcome } = await this._deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('[PWA] 用户同意安装');
    } else {
      console.log('[PWA] 用户拒绝安装');
    }
    this._deferredPrompt = null;
  },

  /**
   * 导出数据为JSON文件
   */
  async _exportData() {
    try {
      showToast('正在导出数据...', 1500);
      const jsonStr = await Storage.exportJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = Storage.today();
      a.href = url;
      a.download = `cosmos-workbench-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('数据已导出 ✓', 2000);
    } catch (e) {
      console.error('导出失败:', e);
      showToast('导出失败: ' + e.message, 3000);
    }
  },

  /**
   * 从JSON文件导入数据
   */
  _importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        App.showConfirm(
          `检测到 ${Object.keys(json.data || json).length} 条数据，选择合并还是完全替换？\n（合并=保留现有数据并补充新数据，替换=清空后用导入数据）`,
          async () => {
            // 合并模式
            try {
              const count = await Storage.importFromJSON(json, true);
              showToast(`合并导入成功: ${count} 条数据 ✓`, 2500);
              App.closeModal();
              // 刷新当前页面
              setTimeout(() => App.switchTab(App.currentSection, App.currentTab), 500);
            } catch (err) {
              showToast('导入失败: ' + err.message, 3000);
            }
          }
        );

        // 添加"替换"按钮的逻辑
        const confirmOk = document.getElementById('confirmOkBtn');
        const confirmCancel = document.getElementById('confirmCancelBtn');
        if (confirmOk && confirmCancel) {
          // 修改为三按钮
          const footer = confirmOk.parentElement;
          const replaceBtn = document.createElement('button');
          replaceBtn.className = 'btn btn-danger';
          replaceBtn.textContent = '完全替换';
          replaceBtn.addEventListener('click', async () => {
            try {
              App.closeModal();
              const count = await Storage.importFromJSON(json, false);
              showToast(`替换导入成功: ${count} 条数据 ✓`, 2500);
              setTimeout(() => App.switchTab(App.currentSection, App.currentTab), 500);
            } catch (err) {
              showToast('导入失败: ' + err.message, 3000);
            }
          });
          footer.insertBefore(replaceBtn, confirmOk);
        }
      } catch (err) {
        showToast('文件解析失败: ' + err.message, 3000);
      }
    };
    reader.readAsText(file);
  }
};
