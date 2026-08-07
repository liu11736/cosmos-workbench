/**
 * 基金策略模块
 * - 每日市场基金推荐：联动财联社资讯，多维度分析
 * - 基金深度资料库：搜索/收藏/评测报告
 * - 我的持仓跟踪：盈亏汇总/买卖记录/持仓评估
 * - 基金复盘笔记：操作思路/买卖理由/经验沉淀
 * - 赛道基金筛选器：按赛道横向对比
 * 注：实时基金数据需对接金融数据API，此处提供完整框架+示例数据+手动录入
 */
const FundModule = {
  recommendations: {}, // { date: [...] }
  fundDB: [],          // 基金资料库
  watchlist: [],       // 自选基金
  holdings: [],        // 持仓
  trades: [],          // 交易记录
  notes: [],           // 复盘笔记
  selectedRecDate: null,
  activeSector: 'AI算力',

  init() {
    this.recommendations = Storage.get('fund_recs', {});
    this.fundDB = Storage.get('fund_db', []);
    this.watchlist = Storage.get('fund_watchlist', []);
    this.holdings = Storage.get('fund_holdings', []);
    this.trades = Storage.get('fund_trades', []);
    this.notes = Storage.get('fund_notes', []);
    this.selectedRecDate = Storage.today();

    if (this.fundDB.length === 0) this.generateFundSamples();
    if (Object.keys(this.recommendations).length === 0) this.generateRecSamples();
  },

  generateFundSamples() {
    this.fundDB = [
      { id: Storage.uid(), code: '012414', name: '华夏国证半导体芯片ETF联接A', type: '指数基金', manager: '荣膺', tenure: '5年', style: '被动指数', return1y: 35.2, return3y: 28.5, rank: '前10%', maxDrawdown: -32.1, volatility: 28.5, sharpe: 1.12, holdings: [{ name: '中芯国际', pct: 12.3 }, { name: '韦尔股份', pct: 8.7 }, { name: '北方华创', pct: 7.5 }], sector: '半导体', concentration: '高' },
      { id: Storage.uid(), code: '011033', name: '易方达人工智能主题A', type: '主动基金', manager: '刘树荣', tenure: '3年', style: '成长', return1y: 42.1, return3y: 31.8, rank: '前5%', maxDrawdown: -28.3, volatility: 25.6, sharpe: 1.35, holdings: [{ name: '寒武纪', pct: 9.2 }, { name: '海光信息', pct: 8.1 }, { name: '科大讯飞', pct: 7.3 }], sector: 'AI算力', concentration: '中高' },
      { id: Storage.uid(), code: '005918', name: '天弘沪深300指数A', type: '指数基金', manager: '杨超', tenure: '5年', style: '被动宽基', return1y: 8.5, return3y: 6.2, rank: '前30%', maxDrawdown: -18.5, volatility: 15.2, sharpe: 0.65, holdings: [{ name: '贵州茅台', pct: 5.2 }, { name: '宁德时代', pct: 3.1 }], sector: '宽基', concentration: '低' },
      { id: Storage.uid(), code: '161725', name: '招商中证白酒指数A', type: '指数基金', manager: '侯昊', tenure: '6年', style: '被动行业', return1y: -5.2, return3y: 12.5, rank: '前40%', maxDrawdown: -35.8, volatility: 22.3, sharpe: 0.42, holdings: [{ name: '五粮液', pct: 14.5 }, { name: '贵州茅台', pct: 13.2 }], sector: '消费', concentration: '极高' },
      { id: Storage.uid(), code: '006751', name: '广发医疗保健A', type: '主动基金', manager: '吴兴武', tenure: '4年', style: '成长', return1y: 15.3, return3y: 8.7, rank: '前20%', maxDrawdown: -30.2, volatility: 20.5, sharpe: 0.78, holdings: [{ name: '迈瑞医疗', pct: 8.5 }, { name: '药明康德', pct: 6.2 }], sector: '医药', concentration: '中' }
    ];
    Storage.set('fund_db', this.fundDB);
  },

  generateRecSamples() {
    const today = Storage.today();
    this.recommendations[today] = [
      {
        id: Storage.uid(), date: today, fundCode: '011033', fundName: '易方达人工智能主题A',
        logic: '当前AI产业处于加速落地期，大模型降本增效推动应用层爆发。财联社资讯显示AI芯片国产化突破+大模型能力升级，政策端持续支持科技创新。资金面北向资金加仓科技成长，AI算力板块主力净流入。综合判断当前AI赛道具备配置价值。',
        type: '主动基金', manager: '刘树荣', tenure: '3年', style: '成长',
        return1y: 42.1, return3y: 31.8, rank: '前5%',
        maxDrawdown: -28.3, volatility: 25.6, sharpe: 1.35,
        holdings: '寒武纪9.2%/海光信息8.1%/科大讯飞7.3%',
        sector: 'AI算力', concentration: '中高',
        scenario: '适合定投+波段，建议仓位10-15%',
        riskWarning: '1) AI板块估值偏高，短期有回调风险；2) 政策变化可能影响节奏；3) 行业竞争加剧'
      },
      {
        id: Storage.uid(), date: today, fundCode: '012414', fundName: '华夏国证半导体芯片ETF联接A',
        logic: '半导体国产替代加速，财联社报道国产AI芯片取得突破。叠加下半年经济会议强调科技自立自强，政策利好明确。半导体设备/材料/设计全链条受益，当前估值处于历史中枢以下。',
        type: '指数基金', manager: '荣膺', tenure: '5年', style: '被动指数',
        return1y: 35.2, return3y: 28.5, rank: '前10%',
        maxDrawdown: -32.1, volatility: 28.5, sharpe: 1.12,
        holdings: '中芯国际12.3%/韦尔股份8.7%/北方华创7.5%',
        sector: '半导体', concentration: '高',
        scenario: '适合长期定投，建议仓位8-12%',
        riskWarning: '1) 半导体周期性明显，回调幅度大；2) 中美科技博弈不确定性；3) 高集中度风险'
      }
    ];
    Storage.set('fund_recs', this.recommendations);
  },

  getTabs() {
    return [
      { id: 'daily-rec', name: '每日市场基金推荐' },
      { id: 'database', name: '基金深度资料库' },
      { id: 'holdings', name: '我的持仓跟踪' },
      { id: 'notes', name: '基金复盘笔记' },
      { id: 'screener', name: '赛道基金筛选器' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'daily-rec') this.renderDailyRec(container);
    else if (tabId === 'database') this.renderDatabase(container);
    else if (tabId === 'holdings') this.renderHoldings(container);
    else if (tabId === 'notes') this.renderNotes(container);
    else if (tabId === 'screener') this.renderScreener(container);
  },

  // ===== 每日市场基金推荐 =====
  renderDailyRec(container) {
    const dates = Object.keys(this.recommendations).sort().reverse();
    const recs = this.recommendations[this.selectedRecDate] || [];

    // 联动财联社资讯
    const finMacro = (FinanceModule.newsData.macro || []).slice(-3);
    const finAI = (FinanceModule.newsData.ai || []).slice(-3);
    const finFlow = (FinanceModule.newsData.flow || []).slice(-3);

    container.innerHTML = `
      <div class="mod-layout">
        <!-- 市场环境联动 -->
        <div class="fund-context-bar">
          <h3 class="card-title">📡 当日市场环境（联动财联社资讯）</h3>
          <div class="fund-context-grid">
            <div class="fund-context-col">
              <span class="fund-context-label">🏛️ 宏观政策</span>
              ${finMacro.length > 0 ? finMacro.map(n => `<div class="fund-context-item">• ${n.title} <span class="fin-sentiment-badge ${n.sentiment === '利好' ? 'sentiment-good' : 'sentiment-bad'}">${n.sentiment}</span></div>`).join('') : '<div class="fund-context-empty">暂无</div>'}
            </div>
            <div class="fund-context-col">
              <span class="fund-context-label">🤖 AI产业</span>
              ${finAI.length > 0 ? finAI.map(n => `<div class="fund-context-item">• ${n.title} <span class="fin-sentiment-badge ${n.sentiment === '利好' ? 'sentiment-good' : 'sentiment-bad'}">${n.sentiment}</span></div>`).join('') : '<div class="fund-context-empty">暂无</div>'}
            </div>
            <div class="fund-context-col">
              <span class="fund-context-label">💰 资金流向</span>
              ${finFlow.length > 0 ? finFlow.map(n => `<div class="fund-context-item">• ${n.title} <span class="fin-sentiment-badge ${n.sentiment === '利好' ? 'sentiment-good' : 'sentiment-neutral'}">${n.sentiment}</span></div>`).join('') : '<div class="fund-context-empty">暂无</div>'}
            </div>
          </div>
        </div>

        <div class="mod-toolbar">
          <div class="mod-date-picker">
            <label>推荐日期：</label>
            <select id="recDateSelect" class="mod-select">
              ${dates.map(d => `<option value="${d}" ${d === this.selectedRecDate ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn-primary" id="addRecBtn">+ 新增推荐</button>
          <span class="mod-badge">📊 ${recs.length} 只推荐基金</span>
        </div>

        ${recs.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📊</div><div class="mod-empty-text">当日暂无推荐，点击上方按钮新增</div></div>'
          : recs.map(r => `
            <div class="fund-rec-card" data-id="${r.id}">
              <div class="fund-rec-header">
                <div>
                  <h3 class="fund-rec-name">${r.fundName}</h3>
                  <span class="fund-rec-code">${r.fundCode}</span>
                  <span class="recipe-cat-badge">${r.sector}</span>
                </div>
                <button class="fund-rec-del-btn" data-id="${r.id}">✕</button>
              </div>
              <div class="fund-rec-section">
                <span class="fund-rec-label">📌 推荐逻辑</span>
                <p class="fund-rec-content">${r.logic}</p>
              </div>
              <div class="fund-rec-grid">
                <div class="fund-rec-metric"><span class="metric-label">基金类型</span><span class="metric-value">${r.type}</span></div>
                <div class="fund-rec-metric"><span class="metric-label">基金经理</span><span class="metric-value">${r.manager}（${r.tenure}）</span></div>
                <div class="fund-rec-metric"><span class="metric-label">投资风格</span><span class="metric-value">${r.style}</span></div>
                <div class="fund-rec-metric"><span class="metric-label">近1年收益</span><span class="metric-value ${r.return1y >= 0 ? 'pos' : 'neg'}">${r.return1y >= 0 ? '+' : ''}${r.return1y}%</span></div>
                <div class="fund-rec-metric"><span class="metric-label">近3年收益</span><span class="metric-value ${r.return3y >= 0 ? 'pos' : 'neg'}">${r.return3y >= 0 ? '+' : ''}${r.return3y}%</span></div>
                <div class="fund-rec-metric"><span class="metric-label">同类排名</span><span class="metric-value">${r.rank}</span></div>
                <div class="fund-rec-metric"><span class="metric-label">最大回撤</span><span class="metric-value neg">${r.maxDrawdown}%</span></div>
                <div class="fund-rec-metric"><span class="metric-label">波动率</span><span class="metric-value">${r.volatility}%</span></div>
                <div class="fund-rec-metric"><span class="metric-label">夏普比率</span><span class="metric-value">${r.sharpe}</span></div>
              </div>
              <div class="fund-rec-section">
                <span class="fund-rec-label">💼 持仓分布</span>
                <p class="fund-rec-content">${r.holdings}</p>
                <span class="fund-rec-sub">赛道集中度：${r.concentration}</span>
              </div>
              <div class="fund-rec-section">
                <span class="fund-rec-label">🎯 适配场景</span>
                <p class="fund-rec-content">${r.scenario}</p>
              </div>
              <div class="fund-rec-section fund-rec-risk">
                <span class="fund-rec-label">⚠️ 风险提示</span>
                <p class="fund-rec-content">${r.riskWarning}</p>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    const sel = document.getElementById('recDateSelect');
    if (sel) sel.addEventListener('change', e => { this.selectedRecDate = e.target.value; this.renderDailyRec(document.getElementById('contentContainer')); });
    document.getElementById('addRecBtn').addEventListener('click', () => this.showRecForm());
    document.querySelectorAll('.fund-rec-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这条推荐？', () => {
        const d = this.selectedRecDate;
        this.recommendations[d] = this.recommendations[d].filter(r => r.id !== btn.dataset.id);
        Storage.set('fund_recs', this.recommendations);
        this.renderDailyRec(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
  },

  showRecForm() {
    const fundOptions = this.fundDB.map(f => `<option value="${f.id}">${f.name}（${f.code}）</option>`).join('');
    const body = `
      <div class="form-group"><label>选择基金</label><select id="rf-fund" class="form-input">${fundOptions}</select></div>
      <div class="form-group"><label>推荐逻辑</label><textarea id="rf-logic" class="form-textarea" rows="4" placeholder="结合当下时事、赛道风口、资金动向，说明配置价值..."></textarea></div>
      <div class="form-group"><label>适配场景</label><input type="text" id="rf-scenario" class="form-input" placeholder="如：适合定投，建议仓位10%" /></div>
      <div class="form-group"><label>风险提示</label><textarea id="rf-risk" class="form-textarea" rows="2" placeholder="潜在利空因素..."></textarea></div>
    `;
    App.showModal('新增基金推荐', body, () => {
      const fundId = document.getElementById('rf-fund').value;
      const fund = this.fundDB.find(f => f.id === fundId);
      if (!fund) { showToast('请选择基金'); return false; }
      const logic = document.getElementById('rf-logic').value.trim();
      if (!logic) { showToast('请填写推荐逻辑'); return false; }
      const d = this.selectedRecDate;
      if (!this.recommendations[d]) this.recommendations[d] = [];
      this.recommendations[d].push({
        id: Storage.uid(), date: d, fundCode: fund.code, fundName: fund.name,
        logic, scenario: document.getElementById('rf-scenario').value.trim(),
        riskWarning: document.getElementById('rf-risk').value.trim(),
        type: fund.type, manager: fund.manager, tenure: fund.tenure, style: fund.style,
        return1y: fund.return1y, return3y: fund.return3y, rank: fund.rank,
        maxDrawdown: fund.maxDrawdown, volatility: fund.volatility, sharpe: fund.sharpe,
        holdings: fund.holdings.map(h => `${h.name}${h.pct}%`).join('/'),
        sector: fund.sector, concentration: fund.concentration
      });
      Storage.set('fund_recs', this.recommendations);
      this.renderDailyRec(document.getElementById('contentContainer'));
      showToast('推荐已添加');
    }, { maxWidth: '560px' });
  },

  // ===== 自动刷新：生成当日基金推荐 =====
  /** 自动更新/手动刷新：分赛道筛选20~30只基金推荐 */
  refresh() {
    const today = Storage.today();
    // 扩展基金池（35+只，覆盖8大赛道）
    const fundPool = [
      // ===== AI算力 =====
      { code: '011033', name: '易方达人工智能主题A', type: '主动基金', manager: '刘树荣', tenure: '3年', style: '成长', return1y: 42.1, return3y: 31.8, rank: '前5%', maxDrawdown: -28.3, volatility: 25.6, sharpe: 1.35, holdings: [{ name: '寒武纪', pct: 9.2 }, { name: '海光信息', pct: 8.1 }, { name: '科大讯飞', pct: 7.3 }], sector: 'AI算力', concentration: '中高' },
      { code: '012414', name: '华夏国证半导体芯片ETF联接A', type: '指数基金', manager: '荣膺', tenure: '5年', style: '被动指数', return1y: 35.2, return3y: 28.5, rank: '前10%', maxDrawdown: -32.1, volatility: 28.5, sharpe: 1.12, holdings: [{ name: '中芯国际', pct: 12.3 }, { name: '韦尔股份', pct: 8.7 }, { name: '北方华创', pct: 7.5 }], sector: 'AI算力', concentration: '高' },
      { code: '159819', name: '人工智能ETF', type: 'ETF基金', manager: '姚曦', tenure: '3年', style: '被动指数', return1y: 38.5, return3y: 25.2, rank: '前15%', maxDrawdown: -30.1, volatility: 27.2, sharpe: 1.18, holdings: [{ name: '科大讯飞', pct: 10.5 }, { name: '浪潮信息', pct: 8.3 }], sector: 'AI算力', concentration: '中高' },
      { code: '161031', name: '富国中证人工智能主题A', type: '指数基金', manager: '王保合', tenure: '4年', style: '被动指数', return1y: 33.8, return3y: 22.1, rank: '前20%', maxDrawdown: -31.5, volatility: 26.8, sharpe: 1.05, holdings: [{ name: '海康威视', pct: 9.1 }, { name: '科大讯飞', pct: 8.7 }], sector: 'AI算力', concentration: '中' },
      { code: '515070', name: '人工智能50ETF', type: 'ETF基金', manager: '李茜', tenure: '3年', style: '被动指数', return1y: 36.2, return3y: 24.8, rank: '前15%', maxDrawdown: -29.8, volatility: 26.5, sharpe: 1.15, holdings: [{ name: '寒武纪', pct: 11.2 }, { name: '中科曙光', pct: 7.8 }], sector: 'AI算力', concentration: '中高' },
      // ===== 半导体 =====
      { code: '007984', name: '富国上证科创板芯片ETF联接A', type: '指数基金', manager: '张圣贤', tenure: '3年', style: '被动指数', return1y: 31.5, return3y: 26.8, rank: '前15%', maxDrawdown: -33.2, volatility: 29.1, sharpe: 1.08, holdings: [{ name: '中芯国际', pct: 15.2 }, { name: '中微公司', pct: 9.5 }], sector: '半导体', concentration: '高' },
      { code: '159801', name: '广发国证半导体芯片ETF联接A', type: '指数基金', manager: '霍华明', tenure: '3年', style: '被动指数', return1y: 29.8, return3y: 23.5, rank: '前20%', maxDrawdown: -34.1, volatility: 28.8, sharpe: 1.02, holdings: [{ name: '韦尔股份', pct: 11.3 }, { name: '北方华创', pct: 9.8 }], sector: '半导体', concentration: '高' },
      { code: '008888', name: '华夏国证半导体芯片增强A', type: '指数增强', manager: '荣膺', tenure: '3年', style: '增强指数', return1y: 34.2, return3y: 27.1, rank: '前10%', maxDrawdown: -31.8, volatility: 27.5, sharpe: 1.22, holdings: [{ name: '中芯国际', pct: 13.1 }, { name: '兆易创新', pct: 8.2 }], sector: '半导体', concentration: '高' },
      { code: '012549', name: '国泰中证全指半导体设备材料A', type: '指数基金', manager: '梁杏', tenure: '2年', style: '被动指数', return1y: 27.5, return3y: 20.3, rank: '前25%', maxDrawdown: -35.5, volatility: 30.2, sharpe: 0.95, holdings: [{ name: '北方华创', pct: 12.8 }, { name: '中微公司', pct: 10.1 }], sector: '半导体', concentration: '高' },
      // ===== 消费 =====
      { code: '161725', name: '招商中证白酒指数A', type: '指数基金', manager: '侯昊', tenure: '6年', style: '被动行业', return1y: -5.2, return3y: 12.5, rank: '前40%', maxDrawdown: -35.8, volatility: 22.3, sharpe: 0.42, holdings: [{ name: '五粮液', pct: 14.5 }, { name: '贵州茅台', pct: 13.2 }], sector: '消费', concentration: '极高' },
      { code: '206007', name: '鹏华消费优选', type: '主动基金', manager: '蒋鑫', tenure: '4年', style: '成长', return1y: 8.5, return3y: 15.2, rank: '前30%', maxDrawdown: -25.3, volatility: 18.5, sharpe: 0.68, holdings: [{ name: '贵州茅台', pct: 8.2 }, { name: '伊利股份', pct: 6.5 }], sector: '消费', concentration: '中' },
      { code: '519066', name: '汇添富蓝筹稳健', type: '主动基金', manager: '雷鸣', tenure: '5年', style: '价值', return1y: 6.2, return3y: 10.8, rank: '前35%', maxDrawdown: -22.1, volatility: 17.2, sharpe: 0.55, holdings: [{ name: '五粮液', pct: 7.8 }, { name: '格力电器', pct: 6.2 }], sector: '消费', concentration: '中' },
      { code: '002340', name: '华夏消费升级', type: '主动基金', manager: '黄文倩', tenure: '5年', style: '成长', return1y: 10.3, return3y: 18.5, rank: '前25%', maxDrawdown: -24.5, volatility: 19.8, sharpe: 0.72, holdings: [{ name: '美的集团', pct: 7.5 }, { name: '中国中免', pct: 6.8 }], sector: '消费', concentration: '中' },
      // ===== 医药 =====
      { code: '006751', name: '广发医疗保健A', type: '主动基金', manager: '吴兴武', tenure: '4年', style: '成长', return1y: 15.3, return3y: 8.7, rank: '前20%', maxDrawdown: -30.2, volatility: 20.5, sharpe: 0.78, holdings: [{ name: '迈瑞医疗', pct: 8.5 }, { name: '药明康德', pct: 6.2 }], sector: '医药', concentration: '中' },
      { code: '162411', name: '广发医药卫生联接A', type: '指数基金', manager: '罗国庆', tenure: '5年', style: '被动行业', return1y: 12.5, return3y: 6.8, rank: '前30%', maxDrawdown: -32.1, volatility: 21.2, sharpe: 0.62, holdings: [{ name: '恒瑞医药', pct: 9.8 }, { name: '药明康德', pct: 8.1 }], sector: '医药', concentration: '中' },
      { code: '003095', name: '中欧医疗健康A', type: '主动基金', manager: '葛兰', tenure: '5年', style: '成长', return1y: 18.2, return3y: 12.5, rank: '前15%', maxDrawdown: -28.5, volatility: 22.8, sharpe: 0.85, holdings: [{ name: '药明康德', pct: 9.5 }, { name: '凯莱英', pct: 7.2 }], sector: '医药', concentration: '中高' },
      { code: '050026', name: '博时医疗保健行业A', type: '主动基金', manager: '张弘', tenure: '3年', style: '成长', return1y: 14.8, return3y: 9.2, rank: '前25%', maxDrawdown: -29.8, volatility: 21.5, sharpe: 0.72, holdings: [{ name: '迈瑞医疗', pct: 8.8 }, { name: '爱尔眼科', pct: 6.5 }], sector: '医药', concentration: '中' },
      // ===== 新能源 =====
      { code: '012543', name: '华夏中证新能源ETF联接A', type: '指数基金', manager: '李俊', tenure: '3年', style: '被动行业', return1y: -8.5, return3y: 15.2, rank: '前35%', maxDrawdown: -38.5, volatility: 25.8, sharpe: 0.38, holdings: [{ name: '宁德时代', pct: 12.5 }, { name: '隆基绿能', pct: 8.8 }], sector: '新能源', concentration: '高' },
      { code: '161726', name: '招商中证光伏产业指数A', type: '指数基金', manager: '侯昊', tenure: '3年', style: '被动行业', return1y: -12.3, return3y: 18.5, rank: '前40%', maxDrawdown: -42.1, volatility: 28.5, sharpe: 0.25, holdings: [{ name: '隆基绿能', pct: 15.2 }, { name: '通威股份', pct: 10.5 }], sector: '新能源', concentration: '极高' },
      { code: '005911', name: '嘉实新能源新材料A', type: '主动基金', manager: '姚志鹏', tenure: '4年', style: '成长', return1y: -5.8, return3y: 20.1, rank: '前30%', maxDrawdown: -35.2, volatility: 24.5, sharpe: 0.45, holdings: [{ name: '宁德时代', pct: 10.8 }, { name: '比亚迪', pct: 8.2 }], sector: '新能源', concentration: '中高' },
      { code: '515030', name: '新能源车ETF', type: 'ETF基金', manager: '姚曦', tenure: '3年', style: '被动指数', return1y: -3.2, return3y: 22.5, rank: '前25%', maxDrawdown: -36.8, volatility: 26.2, sharpe: 0.52, holdings: [{ name: '宁德时代', pct: 13.5 }, { name: '比亚迪', pct: 9.2 }], sector: '新能源', concentration: '高' },
      // ===== 宽基 =====
      { code: '005918', name: '天弘沪深300指数A', type: '指数基金', manager: '杨超', tenure: '5年', style: '被动宽基', return1y: 8.5, return3y: 6.2, rank: '前30%', maxDrawdown: -18.5, volatility: 15.2, sharpe: 0.65, holdings: [{ name: '贵州茅台', pct: 5.2 }, { name: '宁德时代', pct: 3.1 }], sector: '宽基', concentration: '低' },
      { code: '001180', name: '易方达上证50增强A', type: '指数增强', manager: '张胜记', tenure: '5年', style: '增强宽基', return1y: 10.2, return3y: 8.5, rank: '前20%', maxDrawdown: -16.8, volatility: 14.5, sharpe: 0.75, holdings: [{ name: '贵州茅台', pct: 8.5 }, { name: '中国平安', pct: 6.2 }], sector: '宽基', concentration: '低' },
      { code: '110020', name: '易方达中证500ETF联接A', type: '指数基金', manager: '余海燕', tenure: '4年', style: '被动宽基', return1y: 12.5, return3y: 9.8, rank: '前25%', maxDrawdown: -22.5, volatility: 18.8, sharpe: 0.68, holdings: [{ name: '中际旭创', pct: 2.8 }, { name: '天孚通信', pct: 2.1 }], sector: '宽基', concentration: '低' },
      { code: '161017', name: '富国中证500指数增强A', type: '指数增强', manager: '李笑薇', tenure: '6年', style: '增强宽基', return1y: 15.2, return3y: 12.5, rank: '前10%', maxDrawdown: -20.8, volatility: 17.5, sharpe: 0.82, holdings: [{ name: '中际旭创', pct: 3.2 }, { name: '新易盛', pct: 2.5 }], sector: '宽基', concentration: '低' },
      // ===== 周期 =====
      { code: '161226', name: '国泰中证有色金属指数A', type: '指数基金', manager: '吴向军', tenure: '4年', style: '被动行业', return1y: 18.5, return3y: 22.1, rank: '前15%', maxDrawdown: -30.5, volatility: 25.2, sharpe: 0.88, holdings: [{ name: '紫金矿业', pct: 10.8 }, { name: '洛阳钼业', pct: 7.5 }], sector: '周期', concentration: '中高' },
      { code: '162415', name: '广发中证全指原材料A', type: '指数基金', manager: '陆志明', tenure: '5年', style: '被动行业', return1y: 15.2, return3y: 18.5, rank: '前20%', maxDrawdown: -28.5, volatility: 23.8, sharpe: 0.72, holdings: [{ name: '中国神华', pct: 8.5 }, { name: '紫金矿业', pct: 7.2 }], sector: '周期', concentration: '中' },
      { code: '005612', name: '嘉实中证500成长A', type: '指数基金', manager: '刘珈吟', tenure: '3年', style: '被动宽基', return1y: 14.8, return3y: 11.2, rank: '前20%', maxDrawdown: -23.5, volatility: 19.5, sharpe: 0.70, holdings: [{ name: '中际旭创', pct: 3.5 }, { name: '天孚通信', pct: 2.8 }], sector: '周期', concentration: '低' },
      // ===== 债券 =====
      { code: '003838', name: '广发安泽短债A', type: '债券基金', manager: '刘志辉', tenure: '4年', style: '短债策略', return1y: 3.2, return3y: 3.5, rank: '前30%', maxDrawdown: -0.5, volatility: 1.2, sharpe: 0.85, holdings: [{ name: '国债', pct: 35.2 }, { name: '金融债', pct: 28.5 }], sector: '债券', concentration: '低' },
      { code: '000914', name: '中加纯债一年A', type: '债券基金', manager: '闾利', tenure: '5年', style: '纯债策略', return1y: 4.5, return3y: 4.2, rank: '前20%', maxDrawdown: -1.2, volatility: 1.8, sharpe: 1.25, holdings: [{ name: '企业债', pct: 45.2 }, { name: '金融债', pct: 32.8 }], sector: '债券', concentration: '低' },
      { code: '470008', name: '博时信用债纯债A', type: '债券基金', manager: '陈凯杨', tenure: '6年', style: '信用债策略', return1y: 4.8, return3y: 4.5, rank: '前15%', maxDrawdown: -1.5, volatility: 2.1, sharpe: 1.15, holdings: [{ name: 'AAA企业债', pct: 52.5 }, { name: '国债', pct: 25.8 }], sector: '债券', concentration: '低' }
    ];

    // 推荐逻辑模板池
    const logicTemplates = {
      'AI算力': [
        '当前AI产业处于加速落地期，大模型降本增效推动应用层爆发。资金面北向资金加仓科技成长，AI算力板块主力净流入。综合判断当前AI赛道具备配置价值，建议逢回调布局。',
        'AI算力需求持续高景气，服务器订单饱满，光模块出货量增长。政策端持续支持科技创新，产业趋势明确。当前估值处于合理区间，适合中长期配置。',
        'AI大模型迭代加速，多模态能力突破，应用场景持续拓展。算力作为AI基础设施，需求确定性强。关注有技术壁垒和客户优势的龙头标的。'
      ],
      '半导体': [
        '半导体国产替代加速，国产AI芯片取得突破。政策强调科技自立自强，利好半导体全链条。当前估值处于历史中枢以下，配置性价比高。',
        '半导体周期见底回升信号显现，库存去化接近尾声，下游需求逐步回暖。国产替代逻辑持续兑现，关注设备、材料等环节国产化率提升机会。',
        'AI驱动半导体新需求，HBM、先进封装等方向景气度提升。国内半导体企业在先进制程和特色工艺方面均有突破，长期成长逻辑不变。'
      ],
      '消费': [
        '消费复苏趋势确认，社零数据好于预期。政策密集出台促消费措施，消费券乘数效应明显。当前消费板块估值处于低位，配置价值凸显。',
        '消费板块经历调整后估值回归合理区间，基本面逐步改善。关注高端白酒、家电龙头等业绩确定性强的标的，适合中长期布局。'
      ],
      '医药': [
        '医药板块经历长时间调整，估值处于历史低位。集采影响逐步消化，创新药和医疗服务赛道成长性良好。当前是中长期布局良机。',
        '医疗需求刚性增长，老龄化趋势明确。创新药出海加速，医疗器械国产替代推进。医药板块配置价值提升，建议定投布局。'
      ],
      '宽基': [
        '沪深300指数估值处于历史低位，股债性价比突出。经济复苏趋势确认，企业盈利改善预期增强。宽基指数适合作为底仓配置，建议定投。',
        '市场底部区域特征明显，宽基指数定投是稳健策略。随着经济复苏和企业盈利改善，指数有望迎来估值修复行情。'
      ],
      '新能源': [
        '新能源行业经历调整，估值大幅回落。虽然短期面临产能过剩压力，但中长期成长逻辑不变。龙头企业成本优势明显，适合逢低布局。',
        '新能源车渗透率持续提升，光伏装机量高增长。行业洗牌后格局优化，龙头企业市场份额提升。关注成本优势明显的龙头标的。'
      ],
      '周期': [
        '大宗商品价格企稳回升，有色金属需求回暖。全球补库周期开启，周期板块迎来配置窗口。关注供给端收缩明确的品种。',
        '经济复苏预期下，原材料需求改善。有色、煤炭等周期品种估值处于低位，股息率较高，具备安全边际。适合均衡配置。'
      ],
      '债券': [
        '货币政策维持宽松，利率中枢下行趋势未改。短债基金流动性好、波动低，是现金管理的优质替代品。适合作为防御性配置。',
        '信用利差收窄，信用债配置价值提升。纯债基金收益稳定，适合作为资产配置的压舱石。建议根据资金属性匹配久期。'
      ]
    };
    const riskTemplates = {
      'AI算力': '1) AI板块估值偏高，短期有回调风险；2) 海外技术限制不确定性；3) 行业竞争加剧可能导致盈利不及预期',
      '半导体': '1) 半导体周期性明显，回调幅度大；2) 中美科技博弈不确定性；3) 高集中度风险',
      '消费': '1) 消费复苏力度不及预期；2) 居民收入增长放缓；3) 高端消费需求波动',
      '医药': '1) 集采政策持续影响；2) 创新药研发不确定性；3) 估值修复需要时间',
      '宽基': '1) 市场波动风险；2) 经济复苏不及预期；3) 外部环境不确定性',
      '新能源': '1) 产能过剩压力持续；2) 价格战侵蚀利润；3) 补贴退坡影响需求',
      '周期': '1) 大宗商品价格波动大；2) 全球经济放缓拖累需求；3) 环保政策不确定性',
      '债券': '1) 利率上行风险；2) 信用违约风险；3) 流动性风险'
    };
    const scenarioTemplates = {
      'AI算力': '适合定投+波段，建议仓位10-15%',
      '半导体': '适合长期定投，建议仓位8-12%',
      '消费': '适合中长期持有，建议仓位10-15%',
      '医药': '适合定投布局，建议仓位8-12%',
      '宽基': '适合定投+长期持有，建议仓位15-25%',
      '新能源': '适合逢低布局，建议仓位5-10%',
      '周期': '适合波段操作，建议仓位5-8%',
      '债券': '适合防御配置，建议仓位20-30%'
    };

    // 从基金池中随机选取20~30只，确保各赛道均有覆盖
    const sectorGroups = {};
    fundPool.forEach(f => {
      if (!sectorGroups[f.sector]) sectorGroups[f.sector] = [];
      sectorGroups[f.sector].push(f);
    });

    // 按赛道比例分配选取数量
    const targetCount = 20 + Math.floor(Math.random() * 11); // 20-30
    const sectors = Object.keys(sectorGroups);
    const perSector = Math.ceil(targetCount / sectors.length);
    let selected = [];
    sectors.forEach(sec => {
      const shuffled = sectorGroups[sec].sort(() => Math.random() - 0.5);
      selected = selected.concat(shuffled.slice(0, Math.min(perSector, shuffled.length)));
    });
    // 如果超出目标数量，随机截断
    if (selected.length > targetCount) {
      selected = selected.sort(() => Math.random() - 0.5).slice(0, targetCount);
    }

    this.recommendations[today] = selected.map(fund => {
      const logicPool = logicTemplates[fund.sector] || logicTemplates['宽基'];
      const logic = logicPool[Math.floor(Math.random() * logicPool.length)];
      const risk = riskTemplates[fund.sector] || riskTemplates['宽基'];
      const scenario = scenarioTemplates[fund.sector] || scenarioTemplates['宽基'];
      return {
        id: Storage.uid(),
        date: today,
        fundCode: fund.code,
        fundName: fund.name,
        logic: logic,
        type: fund.type,
        manager: fund.manager,
        tenure: fund.tenure,
        style: fund.style,
        return1y: fund.return1y,
        return3y: fund.return3y,
        rank: fund.rank,
        maxDrawdown: fund.maxDrawdown,
        volatility: fund.volatility,
        sharpe: fund.sharpe,
        holdings: fund.holdings.map(h => `${h.name}${h.pct}%`).join('/'),
        sector: fund.sector,
        concentration: fund.concentration,
        scenario: scenario,
        riskWarning: risk
      };
    });
    this.selectedRecDate = today;
    Storage.set('fund_recs', this.recommendations);
  },

  // ===== 基金深度资料库 =====
  renderDatabase(container) {
    const searchKw = this._dbSearch || '';
    let filtered = this.fundDB;
    if (searchKw) {
      const kw = searchKw.toLowerCase();
      filtered = this.fundDB.filter(f => f.name.toLowerCase().includes(kw) || f.code.includes(kw));
    }

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addFundBtn">+ 新增基金</button>
          <div class="news-search-box"><span>🔍</span><input type="text" id="dbSearch" placeholder="搜索基金名称/代码..." value="${searchKw}" /></div>
          <span class="mod-hint">资料库 ${this.fundDB.length} 只 / 自选 ${this.watchlist.length} 只</span>
        </div>
        ${filtered.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">🔍</div><div class="mod-empty-text">未找到匹配基金</div></div>'
          : `<div class="mod-cards-grid">${filtered.map(f => `
              <div class="fund-db-card ${this.watchlist.includes(f.id) ? 'watching' : ''}">
                <div class="fund-db-header">
                  <div>
                    <h3 class="fund-db-name">${f.name}</h3>
                    <span class="fund-rec-code">${f.code}</span>
                    <span class="recipe-cat-badge">${f.sector}</span>
                  </div>
                  <button class="fund-watch-btn" data-id="${f.id}">${this.watchlist.includes(f.id) ? '★' : '☆'}</button>
                </div>
                <div class="fund-rec-grid compact">
                  <div class="fund-rec-metric"><span class="metric-label">类型</span><span class="metric-value">${f.type}</span></div>
                  <div class="fund-rec-metric"><span class="metric-label">经理</span><span class="metric-value">${f.manager}</span></div>
                  <div class="fund-rec-metric"><span class="metric-label">近1年</span><span class="metric-value ${f.return1y >= 0 ? 'pos' : 'neg'}">${f.return1y >= 0 ? '+' : ''}${f.return1y}%</span></div>
                  <div class="fund-rec-metric"><span class="metric-label">最大回撤</span><span class="metric-value neg">${f.maxDrawdown}%</span></div>
                  <div class="fund-rec-metric"><span class="metric-label">夏普</span><span class="metric-value">${f.sharpe}</span></div>
                  <div class="fund-rec-metric"><span class="metric-label">排名</span><span class="metric-value">${f.rank}</span></div>
                </div>
                <div class="fund-db-holdings">
                  <span class="fund-rec-label">重仓</span>
                  ${f.holdings.map(h => `<span class="fund-holding-tag">${h.name} ${h.pct}%</span>`).join('')}
                </div>
                <div class="fund-db-actions">
                  <button class="btn btn-sm btn-outline fund-detail-btn" data-id="${f.id}">查看详情</button>
                  <button class="btn btn-sm btn-outline fund-del-btn" data-id="${f.id}">删除</button>
                </div>
              </div>
            `).join('')}</div>`
        }
      </div>
    `;

    document.getElementById('addFundBtn').addEventListener('click', () => this.showFundForm());
    const search = document.getElementById('dbSearch');
    if (search) search.addEventListener('input', e => {
      this._dbSearch = e.target.value;
      this.renderDatabase(document.getElementById('contentContainer'));
      const ns = document.getElementById('dbSearch'); if (ns) { ns.focus(); ns.setSelectionRange(ns.value.length, ns.value.length); }
    });
    document.querySelectorAll('.fund-watch-btn').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      if (this.watchlist.includes(id)) { this.watchlist = this.watchlist.filter(w => w !== id); showToast('已移出自选'); }
      else { this.watchlist.push(id); showToast('已加入自选'); }
      Storage.set('fund_watchlist', this.watchlist);
      this.renderDatabase(document.getElementById('contentContainer'));
    }));
    document.querySelectorAll('.fund-detail-btn').forEach(btn => btn.addEventListener('click', () => {
      const f = this.fundDB.find(x => x.id === btn.dataset.id); if (f) this.showFundDetail(f);
    }));
    document.querySelectorAll('.fund-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定从资料库删除这只基金？', () => {
        this.fundDB = this.fundDB.filter(f => f.id !== btn.dataset.id);
        Storage.set('fund_db', this.fundDB);
        this.renderDatabase(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
  },

  showFundDetail(f) {
    const body = `
      <div class="fund-detail-modal">
        <h2 class="fund-detail-name">${f.name} <span class="fund-rec-code">${f.code}</span></h2>
        <div class="fund-rec-grid">
          <div class="fund-rec-metric"><span class="metric-label">基金类型</span><span class="metric-value">${f.type}</span></div>
          <div class="fund-rec-metric"><span class="metric-label">基金经理</span><span class="metric-value">${f.manager}（任职${f.tenure}）</span></div>
          <div class="fund-rec-metric"><span class="metric-label">投资风格</span><span class="metric-value">${f.style}</span></div>
          <div class="fund-rec-metric"><span class="metric-label">近1年收益</span><span class="metric-value ${f.return1y >= 0 ? 'pos' : 'neg'}">${f.return1y >= 0 ? '+' : ''}${f.return1y}%</span></div>
          <div class="fund-rec-metric"><span class="metric-label">近3年收益</span><span class="metric-value ${f.return3y >= 0 ? 'pos' : 'neg'}">${f.return3y >= 0 ? '+' : ''}${f.return3y}%</span></div>
          <div class="fund-rec-metric"><span class="metric-label">同类排名</span><span class="metric-value">${f.rank}</span></div>
          <div class="fund-rec-metric"><span class="metric-label">最大回撤</span><span class="metric-value neg">${f.maxDrawdown}%</span></div>
          <div class="fund-rec-metric"><span class="metric-label">波动率</span><span class="metric-value">${f.volatility}%</span></div>
          <div class="fund-rec-metric"><span class="metric-label">夏普比率</span><span class="metric-value">${f.sharpe}</span></div>
          <div class="fund-rec-metric"><span class="metric-label">赛道</span><span class="metric-value">${f.sector}</span></div>
          <div class="fund-rec-metric"><span class="metric-label">集中度</span><span class="metric-value">${f.concentration}</span></div>
        </div>
        <div class="fund-detail-section">
          <span class="fund-rec-label">前十大重仓</span>
          <div class="fund-holdings-detail">${f.holdings.map(h => `<span class="fund-holding-tag">${h.name} ${h.pct}%</span>`).join('')}</div>
        </div>
      </div>
    `;
    App.showModal('基金详情', body, null, { maxWidth: '600px', hideFooter: true });
  },

  showFundForm() {
    const body = `
      <div class="form-row">
        <div class="form-group"><label>基金名称</label><input type="text" id="ff-name" class="form-input" placeholder="基金全称" /></div>
        <div class="form-group"><label>基金代码</label><input type="text" id="ff-code" class="form-input" placeholder="如 011033" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>类型</label><select id="ff-type" class="form-input"><option>主动基金</option><option>指数基金</option><option>ETF基金</option><option>债券基金</option></select></div>
        <div class="form-group"><label>赛道</label><select id="ff-sector" class="form-input"><option>AI算力</option><option>半导体</option><option>消费</option><option>医药</option><option>周期</option><option>宽基</option><option>债券</option><option>新能源</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>基金经理</label><input type="text" id="ff-manager" class="form-input" placeholder="姓名" /></div>
        <div class="form-group"><label>任职年限</label><input type="text" id="ff-tenure" class="form-input" placeholder="如 3年" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>近1年收益%</label><input type="number" id="ff-r1y" class="form-input" step="0.1" placeholder="如 35.2" /></div>
        <div class="form-group"><label>近3年收益%</label><input type="number" id="ff-r3y" class="form-input" step="0.1" placeholder="如 28.5" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>最大回撤%</label><input type="number" id="ff-dd" class="form-input" step="0.1" placeholder="如 -32.1" /></div>
        <div class="form-group"><label>波动率%</label><input type="number" id="ff-vol" class="form-input" step="0.1" placeholder="如 28.5" /></div>
        <div class="form-group"><label>夏普比率</label><input type="number" id="ff-sharpe" class="form-input" step="0.01" placeholder="如 1.12" /></div>
      </div>
      <div class="form-group"><label>同类排名</label><input type="text" id="ff-rank" class="form-input" placeholder="如 前10%" /></div>
      <div class="form-group"><label>重仓股（格式：名称,占比; 名称,占比）</label><input type="text" id="ff-holdings" class="form-input" placeholder="中芯国际,12.3; 韦尔股份,8.7" /></div>
    `;
    App.showModal('新增基金', body, () => {
      const name = document.getElementById('ff-name').value.trim();
      if (!name) { showToast('请填写基金名称'); return false; }
      const holdingsStr = document.getElementById('ff-holdings').value.trim();
      const holdings = holdingsStr ? holdingsStr.split(';').map(s => { const [n, p] = s.split(',').map(x => x.trim()); return { name: n, pct: parseFloat(p) || 0 }; }) : [];
      this.fundDB.push({
        id: Storage.uid(), name,
        code: document.getElementById('ff-code').value.trim(),
        type: document.getElementById('ff-type').value,
        sector: document.getElementById('ff-sector').value,
        manager: document.getElementById('ff-manager').value.trim(),
        tenure: document.getElementById('ff-tenure').value.trim(),
        style: document.getElementById('ff-type').value === '主动基金' ? '成长' : '被动指数',
        return1y: parseFloat(document.getElementById('ff-r1y').value) || 0,
        return3y: parseFloat(document.getElementById('ff-r3y').value) || 0,
        maxDrawdown: parseFloat(document.getElementById('ff-dd').value) || 0,
        volatility: parseFloat(document.getElementById('ff-vol').value) || 0,
        sharpe: parseFloat(document.getElementById('ff-sharpe').value) || 0,
        rank: document.getElementById('ff-rank').value.trim(),
        holdings, concentration: '中'
      });
      Storage.set('fund_db', this.fundDB);
      this.renderDatabase(document.getElementById('contentContainer'));
      showToast('已新增');
    }, { maxWidth: '600px' });
  },

  // ===== 我的持仓跟踪 =====
  renderHoldings(container) {
    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addHoldBtn">+ 录入持仓</button>
          <button class="btn btn-outline" id="addTradeBtn">+ 记录交易</button>
          <span class="mod-badge">💼 ${this.holdings.length} 个持仓 / 📋 ${this.trades.length} 笔交易</span>
        </div>
        ${this.holdings.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">💼</div><div class="mod-empty-text">暂无持仓，点击上方按钮录入</div></div>'
          : `<div class="mod-cards-grid">${this.holdings.map(h => {
              const fund = this.fundDB.find(f => f.id === h.fundId);
              const totalCost = h.shares * h.avgCost;
              const currentValue = h.shares * (h.currentPrice || h.avgCost);
              const pnl = currentValue - totalCost;
              const pnlRate = totalCost > 0 ? (pnl / totalCost * 100).toFixed(2) : 0;
              return `
                <div class="holding-card">
                  <div class="holding-header">
                    <h3 class="holding-name">${h.fundName}</h3>
                    <button class="holding-del-btn" data-id="${h.id}">✕</button>
                  </div>
                  <div class="fund-rec-grid compact">
                    <div class="fund-rec-metric"><span class="metric-label">持仓份额</span><span class="metric-value">${h.shares}</span></div>
                    <div class="fund-rec-metric"><span class="metric-label">平均成本</span><span class="metric-value">${h.avgCost}</span></div>
                    <div class="fund-rec-metric"><span class="metric-label">当前净值</span><span class="metric-value">${h.currentPrice || h.avgCost}</span></div>
                    <div class="fund-rec-metric"><span class="metric-label">总投入</span><span class="metric-value">¥${totalCost.toFixed(0)}</span></div>
                    <div class="fund-rec-metric"><span class="metric-label">当前市值</span><span class="metric-value">¥${currentValue.toFixed(0)}</span></div>
                    <div class="fund-rec-metric"><span class="metric-label">盈亏</span><span class="metric-value ${pnl >= 0 ? 'pos' : 'neg'}">${pnl >= 0 ? '+' : ''}¥${pnl.toFixed(0)} (${pnlRate}%)</span></div>
                  </div>
                  ${h.assessment ? `<div class="fund-rec-section"><span class="fund-rec-label">📋 持仓评估</span><p class="fund-rec-content">${h.assessment}</p></div>` : ''}
                  <div class="holding-actions">
                    <button class="btn btn-sm btn-outline holding-update-btn" data-id="${h.id}">更新净值</button>
                    <button class="btn btn-sm btn-outline holding-assess-btn" data-id="${h.id}">AI评估</button>
                  </div>
                </div>
              `;
            }).join('')}</div>`
        }
        ${this.trades.length > 0 ? `
          <h3 class="card-title" style="margin:24px 0 12px">📋 交易记录</h3>
          <div class="trade-table-wrap">
            <table class="plan-table">
              <thead><tr><th>日期</th><th>基金</th><th>操作</th><th>份额</th><th>价格</th><th>金额</th><th>理由</th></tr></thead>
              <tbody>
                ${this.trades.slice().reverse().map(t => `<tr>
                  <td>${t.date}</td><td>${t.fundName}</td>
                  <td><span class="trade-type ${t.type === '买入' ? 'pos' : 'neg'}">${t.type}</span></td>
                  <td>${t.shares}</td><td>${t.price}</td><td>¥${(t.shares * t.price).toFixed(0)}</td>
                  <td>${t.reason || '—'}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('addHoldBtn').addEventListener('click', () => this.showHoldingForm());
    document.getElementById('addTradeBtn').addEventListener('click', () => this.showTradeForm());
    document.querySelectorAll('.holding-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这个持仓？', () => {
        this.holdings = this.holdings.filter(h => h.id !== btn.dataset.id);
        Storage.set('fund_holdings', this.holdings);
        this.renderHoldings(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
    document.querySelectorAll('.holding-update-btn').forEach(btn => btn.addEventListener('click', () => {
      const h = this.holdings.find(x => x.id === btn.dataset.id); if (h) this.showUpdatePriceForm(h);
    }));
    document.querySelectorAll('.holding-assess-btn').forEach(btn => btn.addEventListener('click', () => {
      const h = this.holdings.find(x => x.id === btn.dataset.id); if (h) this.assessHolding(h);
    }));
  },

  showHoldingForm() {
    const fundOptions = this.fundDB.map(f => `<option value="${f.id}">${f.name}（${f.code}）</option>`).join('');
    const body = `
      <div class="form-group"><label>选择基金</label><select id="hf-fund" class="form-input">${fundOptions}</select></div>
      <div class="form-row">
        <div class="form-group"><label>持仓份额</label><input type="number" id="hf-shares" class="form-input" step="0.01" placeholder="如 1000" /></div>
        <div class="form-group"><label>平均成本</label><input type="number" id="hf-cost" class="form-input" step="0.001" placeholder="如 1.523" /></div>
      </div>
      <div class="form-group"><label>当前净值</label><input type="number" id="hf-price" class="form-input" step="0.001" placeholder="如 1.680" /></div>
    `;
    App.showModal('录入持仓', body, () => {
      const fundId = document.getElementById('hf-fund').value;
      const fund = this.fundDB.find(f => f.id === fundId);
      if (!fund) { showToast('请选择基金'); return false; }
      this.holdings.push({
        id: Storage.uid(), fundId, fundName: fund.name,
        shares: parseFloat(document.getElementById('hf-shares').value) || 0,
        avgCost: parseFloat(document.getElementById('hf-cost').value) || 0,
        currentPrice: parseFloat(document.getElementById('hf-price').value) || 0,
        assessment: ''
      });
      Storage.set('fund_holdings', this.holdings);
      this.renderHoldings(document.getElementById('contentContainer'));
      showToast('已录入');
    });
  },

  showUpdatePriceForm(h) {
    const body = `<div class="form-group"><label>当前净值</label><input type="number" id="up-price" class="form-input" step="0.001" value="${h.currentPrice || h.avgCost}" /></div>`;
    App.showModal(`更新净值 - ${h.fundName}`, body, () => {
      h.currentPrice = parseFloat(document.getElementById('up-price').value) || 0;
      Storage.set('fund_holdings', this.holdings);
      this.renderHoldings(document.getElementById('contentContainer'));
      showToast('已更新');
    });
  },

  assessHolding(h) {
    const fund = this.fundDB.find(f => f.id === h.fundId);
    const totalCost = h.shares * h.avgCost;
    const currentValue = h.shares * (h.currentPrice || h.avgCost);
    const pnlRate = totalCost > 0 ? ((currentValue - totalCost) / totalCost * 100).toFixed(1) : 0;
    const finNews = [...(FinanceModule.newsData.macro || []), ...(FinanceModule.newsData.ai || []), ...(FinanceModule.newsData.stock || [])];
    const sectorNews = finNews.filter(n => fund && n.title.includes(fund.sector)).slice(-3);
    let assessment = `当前盈亏：${pnlRate}%。`;
    if (parseFloat(pnlRate) > 15) assessment += '盈利较多，可考虑部分止盈锁定利润，保留底仓继续观察。';
    else if (parseFloat(pnlRate) > 0) assessment += '小幅盈利，趋势尚可，建议继续持有。如基本面未变可逢低加仓。';
    else if (parseFloat(pnlRate) > -10) assessment += '小幅浮亏，属于正常波动范围。建议耐心持有，关注基本面变化。';
    else assessment += '亏损较多，需重新审视持仓逻辑。如基本面恶化应考虑减仓止损；如属市场情绪波动可逢低补仓摊薄成本。';
    if (sectorNews.length > 0) assessment += `\n近期相关资讯：${sectorNews.map(n => n.title).join('；')}`;
    if (fund) assessment += `\n基金近1年收益${fund.return1y}%，最大回撤${fund.maxDrawdown}%，夏普${fund.sharpe}。`;
    h.assessment = assessment;
    Storage.set('fund_holdings', this.holdings);
    this.renderHoldings(document.getElementById('contentContainer'));
    showToast('评估已更新');
  },

  showTradeForm() {
    const fundOptions = this.fundDB.map(f => `<option value="${f.id}">${f.name}（${f.code}）</option>`).join('');
    const body = `
      <div class="form-group"><label>基金</label><select id="tf-fund" class="form-input">${fundOptions}</select></div>
      <div class="form-row">
        <div class="form-group"><label>操作</label><select id="tf-type" class="form-input"><option>买入</option><option>加仓</option><option>减仓</option><option>卖出</option></select></div>
        <div class="form-group"><label>日期</label><input type="date" id="tf-date" class="form-input" value="${Storage.today()}" /></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>份额</label><input type="number" id="tf-shares" class="form-input" step="0.01" /></div>
        <div class="form-group"><label>价格</label><input type="number" id="tf-price" class="form-input" step="0.001" /></div>
      </div>
      <div class="form-group"><label>操作理由</label><textarea id="tf-reason" class="form-textarea" rows="2" placeholder="为什么买/卖..."></textarea></div>
    `;
    App.showModal('记录交易', body, () => {
      const fundId = document.getElementById('tf-fund').value;
      const fund = this.fundDB.find(f => f.id === fundId);
      if (!fund) { showToast('请选择基金'); return false; }
      this.trades.push({
        id: Storage.uid(), fundId, fundName: fund.name,
        type: document.getElementById('tf-type').value,
        date: document.getElementById('tf-date').value,
        shares: parseFloat(document.getElementById('tf-shares').value) || 0,
        price: parseFloat(document.getElementById('tf-price').value) || 0,
        reason: document.getElementById('tf-reason').value.trim()
      });
      Storage.set('fund_trades', this.trades);
      this.renderHoldings(document.getElementById('contentContainer'));
      showToast('已记录');
    }, { maxWidth: '560px' });
  },

  // ===== 基金复盘笔记 =====
  renderNotes(container) {
    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addFNoteBtn">+ 新增复盘笔记</button>
          <span class="mod-hint">共 ${this.notes.length} 条笔记</span>
        </div>
        ${this.notes.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📓</div><div class="mod-empty-text">暂无笔记，记录操作思路和经验总结</div></div>'
          : `<div class="mod-cards-grid">${this.notes.slice().reverse().map(n => `
              <div class="material-card">
                <div class="material-card-header">
                  <h3 class="material-title">${n.title}</h3>
                  <div class="material-actions">
                    <button class="fnote2-edit-btn" data-id="${n.id}">✏️</button>
                    <button class="fnote2-del-btn" data-id="${n.id}">✕</button>
                  </div>
                </div>
                ${n.fundName ? `<span class="recipe-cat-badge">${n.fundName}</span>` : ''}
                <p class="material-content">${n.content.replace(/\n/g, '<br>')}</p>
                <div class="material-tags">${(n.tags || []).map(t => `<span class="material-tag">${t}</span>`).join('')}</div>
                <div class="material-date">${n.date || ''}</div>
              </div>
            `).join('')}</div>`
        }
      </div>
    `;

    document.getElementById('addFNoteBtn').addEventListener('click', () => this.showFNoteForm());
    document.querySelectorAll('.fnote2-edit-btn').forEach(btn => btn.addEventListener('click', () => { const n = this.notes.find(x => x.id === btn.dataset.id); if (n) this.showFNoteForm(n); }));
    document.querySelectorAll('.fnote2-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这条笔记？', () => {
        this.notes = this.notes.filter(n => n.id !== btn.dataset.id);
        Storage.set('fund_notes', this.notes);
        this.renderNotes(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
  },

  showFNoteForm(existing) {
    const isEdit = !!existing;
    const fundOptions = this.fundDB.map(f => `<option value="${f.name}">${f.name}</option>`).join('');
    const body = `
      <div class="form-group"><label>标题</label><input type="text" id="fnf-title" class="form-input" value="${existing ? existing.title : ''}" placeholder="如 AI基金加仓复盘" /></div>
      <div class="form-group"><label>关联基金</label><select id="fnf-fund" class="form-input"><option value="">不关联</option>${fundOptions}</select></div>
      <div class="form-group"><label>笔记内容</label><textarea id="fnf-content" class="form-textarea" rows="5" placeholder="操作思路、买卖理由、对错总结、优化方案...">${existing ? existing.content : ''}</textarea></div>
      <div class="form-group"><label>标签</label><input type="text" id="fnf-tags" class="form-input" value="${existing ? (existing.tags || []).join(', ') : ''}" placeholder="逗号分隔" /></div>
    `;
    App.showModal(isEdit ? '编辑笔记' : '新增复盘笔记', body, () => {
      const title = document.getElementById('fnf-title').value.trim();
      if (!title) { showToast('请填写标题'); return false; }
      const data = {
        title, content: document.getElementById('fnf-content').value.trim(),
        fundName: document.getElementById('fnf-fund').value,
        tags: document.getElementById('fnf-tags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      if (isEdit) { Object.assign(existing, data); }
      else { this.notes.push({ id: Storage.uid(), ...data, date: Storage.today() }); }
      Storage.set('fund_notes', this.notes);
      this.renderNotes(document.getElementById('contentContainer'));
      showToast(isEdit ? '已更新' : '已新增');
    }, { maxWidth: '520px' });
  },

  // ===== 赛道基金筛选器 =====
  renderScreener(container) {
    const sectors = ['AI算力', '半导体', '消费', '医药', '周期', '宽基', '债券', '新能源'];
    let filtered = this.fundDB.filter(f => f.sector === this.activeSector);

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <span class="mod-hint">按赛道筛选基金，横向对比关键指标</span>
        </div>
        <div class="recipe-category-bar">
          ${sectors.map(s => `<button class="recipe-cat-btn ${s === this.activeSector ? 'active' : ''}" data-sector="${s}">${s}</button>`).join('')}
        </div>
        ${filtered.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">🔍</div><div class="mod-empty-text">该赛道暂无基金</div></div>'
          : `<div class="screener-table-wrap">
              <table class="screener-table">
                <thead>
                  <tr>
                    <th>基金名称</th><th>类型</th><th>经理</th><th>近1年</th><th>近3年</th><th>最大回撤</th><th>夏普</th><th>排名</th><th>集中度</th><th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(f => `<tr>
                    <td class="screener-name">${f.name}<br><span class="fund-rec-code">${f.code}</span></td>
                    <td>${f.type}</td><td>${f.manager}</td>
                    <td class="${f.return1y >= 0 ? 'pos' : 'neg'}">${f.return1y >= 0 ? '+' : ''}${f.return1y}%</td>
                    <td class="${f.return3y >= 0 ? 'pos' : 'neg'}">${f.return3y >= 0 ? '+' : ''}${f.return3y}%</td>
                    <td class="neg">${f.maxDrawdown}%</td>
                    <td>${f.sharpe}</td><td>${f.rank}</td><td>${f.concentration}</td>
                    <td><button class="btn btn-sm btn-outline screener-detail-btn" data-id="${f.id}">详情</button></td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </div>`
        }
      </div>
    `;

    document.querySelectorAll('.recipe-cat-btn').forEach(btn => btn.addEventListener('click', () => {
      this.activeSector = btn.dataset.sector;
      this.renderScreener(document.getElementById('contentContainer'));
    }));
    document.querySelectorAll('.screener-detail-btn').forEach(btn => btn.addEventListener('click', () => {
      const f = this.fundDB.find(x => x.id === btn.dataset.id); if (f) this.showFundDetail(f);
    }));
  }
};
