/**
 * 财联社资讯模块
 * - 宏观时事快讯：政策/经济数据/监管动向 + 解读
 * - 股市动态：A股盘面/板块异动/公告 + 利好利空
 * - AI产业风口：算力/大模型/AI应用/半导体
 * - 资金流向追踪：机构偏好/北向/游资
 * - 资讯收藏与复盘笔记：收藏+思考+标签归档
 * 注：实时资讯需对接财联社API，此处提供完整框架+示例数据+手动录入
 */
const FinanceModule = {
  newsData: { macro: [], stock: [], ai: [], flow: [] },
  favorites: [],
  notes: [],
  searchKeyword: '',

  init() {
    this.newsData = Storage.get('fin_news', { macro: [], stock: [], ai: [], flow: [] });
    this.favorites = Storage.get('fin_favorites', []);
    this.notes = Storage.get('fin_notes', []);

    if (this.newsData.macro.length === 0) this.generateSamples();
  },

  /** 自动更新/手动刷新：每30分钟向各分类追加1-2条最新资讯 */
  refresh() {
    const now = new Date().toISOString().slice(0, 16);
    const pools = {
      macro: [
        { title: '央行公开市场净投放2000亿元', content: '央行通过逆回购操作净投放2000亿元流动性，维护银行体系流动性合理充裕。', sentiment: '利好', analysis: '流动性宽松信号明确，利好债市和成长股估值提升。关注后续MLF续做情况。' },
        { title: '财政部下达新增专项债额度', content: '财政部下达年内新增专项债务限额，重点用于交通基础设施、市政建设等领域。', sentiment: '利好', analysis: '专项债加速发行利好基建产业链，关注建材、工程机械、建筑央企。' },
        { title: '统计局：7月CPI同比上涨0.5%', content: '7月CPI同比上涨0.5%，涨幅比上月扩大0.3个百分点，食品价格由降转涨。', sentiment: '中性', analysis: 'CPI温和回升，通缩担忧缓解。货币政策空间打开，降息降准仍有空间。' },
        { title: '国务院常务会议研究稳增长措施', content: '会议研究部署进一步稳增长的若干措施，涉及投资、消费、出口等多方面。', sentiment: '利好', analysis: '稳增长政策加码预期升温，基建、消费、地产链可能受益。' },
        { title: '外管局：跨境资金流动平稳有序', content: '外汇管理局数据显示，近期跨境资金流动总体平稳有序，人民币汇率保持基本稳定。', sentiment: '中性', analysis: '汇率稳定有利于外资流入，北向资金风险偏好有望改善。' }
      ],
      stock: [
        { title: 'AI算力板块再度走强 多股涨停', content: '光模块、AI服务器板块午后拉升，多只个股涨停，主力资金大幅净流入。', sentiment: '利好', analysis: 'AI算力主线持续发酵，关注业绩兑现能力强、估值合理的龙头标的。' },
        { title: '消费板块回调 白酒领跌', content: '白酒板块今日回调超2%，资金净流出明显，市场对消费复苏节奏产生分歧。', sentiment: '利空', analysis: '短期回调不改长期价值，关注三季度旺季动销数据。建议逢低关注龙头。' },
        { title: '半导体设备股大涨 国产替代加速', content: '半导体设备板块集体大涨，国产替代逻辑持续兑现，多只个股创阶段新高。', sentiment: '利好', analysis: '国产替代是长期确定方向，关注设备、材料环节的国产化率提升。' },
        { title: '新能源板块分化 锂电池强势', content: '锂电池板块表现强势，光伏板块回调，资金在新能源内部出现轮动。', sentiment: '中性', analysis: '关注产业链各环节供需格局变化，优选成本优势明显的龙头。' },
        { title: '券商股异动 市场活跃度提升', content: '券商板块尾盘异动拉升，两市成交额连续多日突破万亿，市场活跃度提升。', sentiment: '利好', analysis: '量价齐升利好券商经纪业务，关注市场成交量持续性。' }
      ],
      ai: [
        { title: '国产大模型推理成本再降50%', content: '多家企业宣布大模型API调用价格下调50%，推理成本持续下降加速应用落地。', sentiment: '利好', analysis: '降本增效推动AI应用爆发，关注有实际落地场景和数据优势的公司。' },
        { title: 'AI芯片国产化取得新进展', content: '国产AI芯片在推理性能上达到国际主流水平，已开始向互联网大厂规模交付。', sentiment: '利好', analysis: '国产AI芯片突破利好半导体全链条，关注产能爬坡和客户验证情况。' },
        { title: 'AI应用层融资活跃 多家企业获大额融资', content: 'AI应用赛道融资活跃，多个细分方向获得大额融资，资本持续涌入AI应用层。', sentiment: '利好', analysis: 'AI应用进入落地期，关注有商业化路径和数据壁垒的企业。' },
        { title: '大厂发布多模态大模型 视觉理解突破', content: '国内大厂发布新一代多模态大模型，在视觉理解、视频生成等方向实现重大突破。', sentiment: '利好', analysis: '多模态能力提升将催生AI视频、AI设计等新应用场景，关注相关产业链。' },
        { title: 'AI+教育赛道政策利好', content: '教育部发文鼓励AI技术在教育领域应用，推动个性化学习和智能教学。', sentiment: '利好', analysis: 'AI+教育有望率先实现规模化落地，关注教育信息化和AI教育内容企业。' }
      ],
      flow: [
        { title: '北向资金今日净流入50亿元', content: '北向资金全天净流入约50亿元，主要流入电子、计算机、通信等科技板块。', sentiment: '利好', analysis: '外资持续加仓科技成长，反映对AI主线的信心。关注其重仓股变动趋势。' },
        { title: '两融余额回升至1.6万亿上方', content: '两市融资融券余额回升至1.6万亿以上，市场做多情绪有所回暖。', sentiment: '利好', analysis: '杠杆资金回流有利于市场活跃度提升，关注融资盘偏好方向。' },
        { title: '游资活跃于AI应用方向', content: '多只AI应用概念股出现龙虎榜游资席位，短线资金博弈加剧。', sentiment: '中性', analysis: '游资短线博弈加剧波动，注意追高风险。中线建议关注基本面支撑的标的。' },
        { title: '机构调研聚焦半导体设备', content: '近期机构密集调研半导体设备企业，关注国产替代进展和订单情况。', sentiment: '利好', analysis: '机构调研方向往往是下一阶段市场主线，半导体设备值得持续跟踪。' },
        { title: 'ETF资金持续流入科技方向', content: '多只科技类ETF持续获资金净申购，反映场内资金对科技成长方向的偏好。', sentiment: '利好', analysis: 'ETF资金流向代表机构中长期配置方向，科技主线资金面支撑较强。' }
      ]
    };

    Object.keys(pools).forEach(cat => {
      const pool = pools[cat];
      // 随机选1-2条
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const addCount = 1 + Math.floor(Math.random() * 2);
      const newItems = shuffled.slice(0, addCount).map(item => ({
        id: Storage.uid(),
        time: now,
        ...item
      }));
      this.newsData[cat] = this.newsData[cat] || [];
      this.newsData[cat].push(...newItems);
      // 上限100条，超出截断旧数据
      if (this.newsData[cat].length > 100) {
        this.newsData[cat] = this.newsData[cat].slice(-100);
      }
    });
    Storage.set('fin_news', this.newsData);
  },

  generateSamples() {
    const now = new Date().toISOString().slice(0, 16);
    this.newsData.macro = [
      { id: Storage.uid(), time: now, title: '央行下调LPR 15个基点', content: '1年期LPR降至3.35%，5年期以上LPR降至3.85%，释放宽松信号。', sentiment: '利好', analysis: '降息直接降低实体经济融资成本，利好银行负债端、地产链、基建。股市流动性预期改善，成长风格占优。' },
      { id: Storage.uid(), time: now, title: '国务院发布促消费二十条措施', content: '涉及汽车、家电、家居、餐饮等重点消费领域，加大财政补贴力度。', sentiment: '利好', analysis: '消费刺激政策密集出台，短期提振消费板块情绪。关注家电以旧换新、新能源汽车、文旅消费方向。' }
    ];
    this.newsData.stock = [
      { id: Storage.uid(), time: now, title: 'AI算力板块午后拉升', content: '光模块、服务器板块涨幅居前，多只个股涨停，主力资金净流入超20亿。', sentiment: '利好', analysis: 'AI算力主线持续发酵，光模块受益于海外大厂扩产预期。关注业绩兑现能力强、估值合理的龙头标的。' },
      { id: Storage.uid(), time: now, title: '某新能源龙头发布业绩预告', content: '上半年净利润同比增长15%，低于市场预期，盘后股价跌超5%。', sentiment: '利空', analysis: '业绩不及预期反映行业竞争加剧，价格战侵蚀利润。短期承压，关注三季度改善信号和市占率变化。' }
    ];
    this.newsData.ai = [
      { id: Storage.uid(), time: now, title: '国产大模型能力再升级', content: '多家企业发布新一代大模型，推理能力显著提升，API调用成本降低50%。', sentiment: '利好', analysis: '大模型降本增效加速AI应用落地，利好AI应用层企业。关注有实际落地场景和数据优势的公司。' },
      { id: Storage.uid(), time: now, title: 'AI芯片国产化取得突破', content: '国产AI芯片性能达到国际主流水平，已开始规模化交付。', sentiment: '利好', analysis: '国产替代加速，半导体设备、材料、设计全链条受益。关注产能爬坡进度和客户验证情况。' }
    ];
    this.newsData.flow = [
      { id: Storage.uid(), time: now, title: '北向资金今日净流入80亿元', content: '主要流入电子、计算机、通信板块，流出银行、地产。', sentiment: '利好', analysis: '外资持续加仓科技成长方向，反映对AI主线的信心。北向资金偏好龙头，可关注其重仓股变动趋势。' },
      { id: Storage.uid(), time: now, title: '游资集中攻击AI应用方向', content: '多只AI应用概念股出现龙虎榜游资席位，短线资金活跃。', sentiment: '中性', analysis: '游资短线博弈加剧波动，注意追高风险。中线建议关注有基本面支撑的标的，避免纯概念炒作。' }
    ];
    Storage.set('fin_news', this.newsData);
  },

  getTabs() {
    return [
      { id: 'macro', name: '宏观时事快讯' },
      { id: 'stock', name: '股市动态' },
      { id: 'ai', name: 'AI产业风口' },
      { id: 'flow', name: '资金流向追踪' },
      { id: 'fav', name: '资讯收藏与复盘笔记' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'macro') this.renderNewsList(container, 'macro', '宏观时事快讯');
    else if (tabId === 'stock') this.renderNewsList(container, 'stock', '股市动态');
    else if (tabId === 'ai') this.renderNewsList(container, 'ai', 'AI产业风口');
    else if (tabId === 'flow') this.renderNewsList(container, 'flow', '资金流向追踪');
    else if (tabId === 'fav') this.renderFavorites(container);
  },

  renderNewsList(container, type, title) {
    const list = this.newsData[type] || [];
    let filtered = list;
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase();
      filtered = list.filter(n => n.title.toLowerCase().includes(kw) || n.content.toLowerCase().includes(kw));
    }

    const iconMap = { macro: '🏛️', stock: '📈', ai: '🤖', flow: '💰' };

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addNewsBtn">+ 录入资讯</button>
          <div class="news-search-box">
            <span>🔍</span>
            <input type="text" id="finSearch" placeholder="搜索资讯关键词..." value="${this.searchKeyword}" />
          </div>
          <span class="mod-badge">${iconMap[type]} ${list.length} 条资讯</span>
        </div>
        ${filtered.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📭</div><div class="mod-empty-text">暂无资讯，点击上方按钮录入或等待自动更新</div></div>'
          : filtered.slice().reverse().map(n => `
            <div class="fin-news-card" data-id="${n.id}">
              <div class="fin-news-header">
                <span class="fin-news-time">${n.time ? n.time.replace('T', ' ') : ''}</span>
                <span class="fin-sentiment-badge ${n.sentiment === '利好' ? 'sentiment-good' : n.sentiment === '利空' ? 'sentiment-bad' : 'sentiment-neutral'}">${n.sentiment || '中性'}</span>
              </div>
              <h3 class="fin-news-title">${n.title}</h3>
              <p class="fin-news-content">${n.content}</p>
              ${n.analysis ? `<div class="fin-news-analysis"><span class="fin-analysis-label">📊 通俗解读</span><p>${n.analysis}</p></div>` : ''}
              <div class="fin-news-actions">
                <button class="btn btn-sm btn-outline fin-fav-btn" data-id="${n.id}" data-type="${type}">${this.favorites.some(f => f.newsId === n.id) ? '★ 已收藏' : '☆ 收藏'}</button>
                <button class="btn btn-sm btn-outline fin-del-btn" data-id="${n.id}" data-type="${type}">删除</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    document.getElementById('addNewsBtn').addEventListener('click', () => this.showNewsForm(type));
    const search = document.getElementById('finSearch');
    if (search) search.addEventListener('input', e => {
      this.searchKeyword = e.target.value;
      this.renderNewsList(document.getElementById('contentContainer'), type, title);
      const ns = document.getElementById('finSearch'); if (ns) { ns.focus(); ns.setSelectionRange(ns.value.length, ns.value.length); }
    });
    document.querySelectorAll('.fin-fav-btn').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const t = btn.dataset.type;
      const news = this.newsData[t].find(n => n.id === id);
      if (!news) return;
      const existIdx = this.favorites.findIndex(f => f.newsId === id);
      if (existIdx >= 0) { this.favorites.splice(existIdx, 1); showToast('已取消收藏'); }
      else { this.favorites.push({ id: Storage.uid(), newsId: id, title: news.title, content: news.content, analysis: news.analysis, sentiment: news.sentiment, source: t, date: Storage.today() }); showToast('已收藏'); }
      Storage.set('fin_favorites', this.favorites);
      this.renderNewsList(document.getElementById('contentContainer'), type, title);
    }));
    document.querySelectorAll('.fin-del-btn').forEach(btn => btn.addEventListener('click', () => {
      const id = btn.dataset.id; const t = btn.dataset.type;
      App.showConfirm('确定删除这条资讯？', () => {
        this.newsData[t] = this.newsData[t].filter(n => n.id !== id);
        Storage.set('fin_news', this.newsData);
        this.renderNewsList(document.getElementById('contentContainer'), type, title);
        showToast('已删除');
      });
    }));
  },

  showNewsForm(type) {
    const typeNames = { macro: '宏观时事', stock: '股市动态', ai: 'AI产业', flow: '资金流向' };
    const body = `
      <div class="form-group"><label>标题</label><input type="text" id="nf-title" class="form-input" placeholder="资讯标题" /></div>
      <div class="form-row">
        <div class="form-group"><label>情绪倾向</label>
          <select id="nf-sentiment" class="form-input">
            <option value="利好">利好</option><option value="利空">利空</option><option value="中性">中性</option>
          </select>
        </div>
        <div class="form-group"><label>时间</label><input type="datetime-local" id="nf-time" class="form-input" value="${new Date().toISOString().slice(0, 16)}" /></div>
      </div>
      <div class="form-group"><label>资讯内容</label><textarea id="nf-content" class="form-textarea" rows="3" placeholder="资讯正文..."></textarea></div>
      <div class="form-group"><label>通俗解读</label><textarea id="nf-analysis" class="form-textarea" rows="3" placeholder="分析政策意图、对市场行业的影响..."></textarea></div>
    `;
    App.showModal(`录入${typeNames[type]}资讯`, body, () => {
      const title = document.getElementById('nf-title').value.trim();
      if (!title) { showToast('请填写标题'); return false; }
      this.newsData[type].push({
        id: Storage.uid(), title,
        sentiment: document.getElementById('nf-sentiment').value,
        time: document.getElementById('nf-time').value,
        content: document.getElementById('nf-content').value.trim(),
        analysis: document.getElementById('nf-analysis').value.trim()
      });
      Storage.set('fin_news', this.newsData);
      this.renderNewsList(document.getElementById('contentContainer'), type, typeNames[type]);
      showToast('已录入');
    }, { maxWidth: '560px' });
  },

  // ===== 资讯收藏与复盘笔记 =====
  renderFavorites(container) {
    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addNoteBtn">+ 新增复盘笔记</button>
          <span class="mod-badge">⭐ ${this.favorites.length} 条收藏 / 📝 ${this.notes.length} 条笔记</span>
        </div>
        ${this.favorites.length > 0 ? `
          <h3 class="card-title" style="margin-bottom:12px">⭐ 收藏资讯</h3>
          <div class="fin-fav-list">
            ${this.favorites.slice().reverse().map(f => `
              <div class="fin-news-card compact">
                <div class="fin-news-header">
                  <span class="fin-news-time">${f.date || ''}</span>
                  <span class="fin-sentiment-badge ${f.sentiment === '利好' ? 'sentiment-good' : f.sentiment === '利空' ? 'sentiment-bad' : 'sentiment-neutral'}">${f.sentiment || '中性'}</span>
                  <span class="fin-fav-source">${f.source}</span>
                </div>
                <h3 class="fin-news-title">${f.title}</h3>
                <p class="fin-news-content">${f.content}</p>
                <div class="fin-news-actions">
                  <button class="btn btn-sm btn-outline fin-unfav-btn" data-id="${f.id}">取消收藏</button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<div class="mod-empty" style="margin-bottom:20px"><div class="mod-empty-icon">⭐</div><div class="mod-empty-text">暂无收藏资讯</div></div>'}
        <h3 class="card-title" style="margin:24px 0 12px">📝 复盘笔记</h3>
        ${this.notes.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📝</div><div class="mod-empty-text">暂无笔记，记录你的思考与预判</div></div>'
          : `<div class="mod-cards-grid">${this.notes.slice().reverse().map(n => `
              <div class="material-card">
                <div class="material-card-header">
                  <h3 class="material-title">${n.title}</h3>
                  <div class="material-actions">
                    <button class="fnote-edit-btn" data-id="${n.id}">✏️</button>
                    <button class="fnote-del-btn" data-id="${n.id}">✕</button>
                  </div>
                </div>
                <p class="material-content">${n.content.replace(/\n/g, '<br>')}</p>
                <div class="material-tags">${(n.tags || []).map(t => `<span class="material-tag">${t}</span>`).join('')}</div>
                <div class="material-date">${n.date || ''}</div>
              </div>
            `).join('')}</div>`
        }
      </div>
    `;

    document.getElementById('addNoteBtn').addEventListener('click', () => this.showNoteForm());
    document.querySelectorAll('.fin-unfav-btn').forEach(btn => btn.addEventListener('click', () => {
      this.favorites = this.favorites.filter(f => f.id !== btn.dataset.id);
      Storage.set('fin_favorites', this.favorites);
      this.renderFavorites(document.getElementById('contentContainer'));
      showToast('已取消收藏');
    }));
    document.querySelectorAll('.fnote-edit-btn').forEach(btn => btn.addEventListener('click', () => { const n = this.notes.find(x => x.id === btn.dataset.id); if (n) this.showNoteForm(n); }));
    document.querySelectorAll('.fnote-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这条笔记？', () => {
        this.notes = this.notes.filter(n => n.id !== btn.dataset.id);
        Storage.set('fin_notes', this.notes);
        this.renderFavorites(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
  },

  showNoteForm(existing) {
    const isEdit = !!existing;
    const body = `
      <div class="form-group"><label>标题</label><input type="text" id="nnf-title" class="form-input" value="${existing ? existing.title : ''}" placeholder="思考/预判/跟踪要点" /></div>
      <div class="form-group"><label>内容</label><textarea id="nnf-content" class="form-textarea" rows="5" placeholder="记录你的思考、预判、后续跟踪要点...">${existing ? existing.content : ''}</textarea></div>
      <div class="form-group"><label>板块标签（逗号分隔）</label><input type="text" id="nnf-tags" class="form-input" value="${existing ? (existing.tags || []).join(', ') : ''}" placeholder="如：AI算力, 消费, 新能源" /></div>
    `;
    App.showModal(isEdit ? '编辑笔记' : '新增复盘笔记', body, () => {
      const title = document.getElementById('nnf-title').value.trim();
      if (!title) { showToast('请填写标题'); return false; }
      const data = { title, content: document.getElementById('nnf-content').value.trim(), tags: document.getElementById('nnf-tags').value.split(',').map(t => t.trim()).filter(Boolean) };
      if (isEdit) { Object.assign(existing, data); }
      else { this.notes.push({ id: Storage.uid(), ...data, date: Storage.today() }); }
      Storage.set('fin_notes', this.notes);
      this.renderFavorites(document.getElementById('contentContainer'));
      showToast(isEdit ? '已更新' : '已新增');
    }, { maxWidth: '520px' });
  }
};
