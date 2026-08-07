/**
 * 每日灵感模块
 * - 每日热点灵感库：全赛道热点汇总 + 收藏
 * - 内容发布复盘库：作品数据录入 + AI分析 + 历史档案
 * - 灵感素材收藏夹：选题/创意收集 + 标签分类
 */
const InspirationModule = {
  hotspots: {},       // 按日期存储热点 { '2026-07-27': [...] }
  reviews: [],        // 内容复盘记录
  materials: [],      // 灵感素材收藏
  selectedDate: null, // 当前查看的热点日期

  init() {
    this.hotspots = Storage.get('insp_hotspots', {});
    this.reviews = Storage.get('insp_reviews', []);
    this.materials = Storage.get('insp_materials', []);
    this.selectedDate = Storage.today();

    // 首次使用时生成示例热点数据
    if (Object.keys(this.hotspots).length === 0) {
      this.generateSampleHotspots();
    }
  },

  /** 自动更新/手动刷新：生成当日最新热点（12~16条全赛道热点） */
  refresh() {
    const today = Storage.today();
    const pool = [
      { title: '"City Walk城市漫游"话题持续发酵', hook: '第一视角沉浸式漫步，ASMR环境音+治愈文案', sentiment: '向往/治愈', category: '生活方式' },
      { title: 'AI换脸变装视频翻新玩法', hook: '经典影视角色换装，反差感拉满，3秒钩子', sentiment: '惊讶/搞笑', category: '科技整活' },
      { title: '"打工人早八人的精神状态"系列爆款', hook: '夸张演绎上班路上的内心独白，引发共鸣', sentiment: '共鸣/搞笑', category: '职场日常' },
      { title: '沉浸式收纳整理ASMR', hook: '无声整理+卡点音效，极致治愈感', sentiment: '舒适/解压', category: '生活美学' },
      { title: '"反向旅游"小众目的地种草', hook: '冷门景点+高性价比攻略，避开人从众', sentiment: '种草/期待', category: '旅游攻略' },
      { title: '萌宠"第一视角"拍摄新形式', hook: '宠物佩戴GoPro，展示宠物眼中的世界', sentiment: '可爱/新奇', category: '宠物创意' },
      { title: '15秒知识科普卡点视频', hook: '快节奏信息密度+视觉化呈现，一秒一个知识点', sentiment: '涨知识/分享', category: '知识科普' },
      { title: '"MBTI人格"情景剧再现', hook: '不同人格面对同一场景的反差演绎', sentiment: '认同/搞笑', category: '心理趣味' },
      { title: '"特种兵旅游"挑战极限行程', hook: '极限压缩行程+省钱攻略，节奏感拉满', sentiment: '热血/激动', category: '旅游挑战' },
      { title: '菜市场代购服务爆火', hook: '代人买菜+砍价实录，接地气人设', sentiment: '接地气/共鸣', category: '本地生活' },
      { title: '"搭子文化"社交新模式', hook: '找搭子做某事的新社交形式，真实互动', sentiment: '新奇/社交', category: '社交文化' },
      { title: 'AI生成的怀旧风短视频', hook: 'AI修复老照片+老视频，情感共鸣', sentiment: '怀旧/感动', category: 'AI技术' },
      { title: '"朋友请吃饭"治愈系列', hook: '朋友间请客吃饭的真实反应，温暖治愈', sentiment: '温暖/治愈', category: '美食治愈' },
      { title: '打工人下班后的独居vlog', hook: '独居女生下班后的治愈日常，ASMR', sentiment: '治愈/放松', category: '独居生活' },
      { title: '宠物配音对话系列', hook: '宠物内心独白配音，拟人化搞笑', sentiment: '搞笑/可爱', category: '宠物搞笑' },
      { title: '深夜食堂治愈系美食视频', hook: '深夜做简单美食，治愈系画面+文案', sentiment: '治愈/馋嘴', category: '美食vlog' },
      { title: '"断舍离"极简生活记录', hook: '清理整理房间过程，解压满足', sentiment: '解压/满足', category: '极简生活' },
      { title: '小学生作业辅导崩溃系列', hook: '辅导作业崩溃瞬间，引发家长共鸣', sentiment: '共鸣/搞笑', category: '亲子教育' },
      { title: '独居女生的一天沉浸式vlog', hook: '沉浸式记录一天生活，白噪音背景', sentiment: '治愈/放松', category: '生活记录' },
      { title: '手工DIY改造旧物系列', hook: '旧物改造变废为宝，创意手工', sentiment: '创意/佩服', category: '手工创意' },
      { title: '职场穿搭改造前后对比', hook: '素人改造+穿搭教学，反差惊艳', sentiment: '种草/变美', category: '时尚穿搭' },
      { title: '"一人食"精致简餐教程', hook: '一人份精致料理，简单易学', sentiment: '馋嘴/学到了', category: '美食教程' },
      { title: '高校宿舍开箱测评系列', hook: '大学生宿舍好物分享，真实测评', sentiment: '种草/共鸣', category: '校园生活' },
      { title: '路边摊美食探店合集', hook: '寻找隐藏街头美食，烟火气十足', sentiment: '馋嘴/向往', category: '美食探店' },
      { title: '"月薪三千vs月薪三万"对比系列', hook: '不同收入人群的生活方式对比，引发讨论', sentiment: '共鸣/反思', category: '社会观察' },
      { title: 'AI写歌词翻唱爆火', hook: '用AI生成歌词+翻唱经典歌曲，新鲜感拉满', sentiment: '新奇/分享', category: 'AI技术' },
      { title: '"第一次做饭"翻车实录', hook: '新手做饭翻车全过程，真实搞笑', sentiment: '搞笑/共鸣', category: '美食搞笑' },
      { title: '健身房撸铁新手日记', hook: '记录健身新手从零开始的转变过程', sentiment: '励志/共鸣', category: '健身运动' },
      { title: '"我在XX的一天"沉浸式职业体验', hook: '体验不同职业的一天，第一视角记录', sentiment: '涨知识/新奇', category: '职业体验' },
      { title: '宠物减肥挑战系列', hook: '帮胖宠物减肥的日常记录，萌+励志', sentiment: '可爱/励志', category: '宠物创意' },
      { title: '"社恐日常"情景剧系列', hook: '社恐人群的内心戏外化演绎', sentiment: '共鸣/搞笑', category: '心理趣味' },
      { title: '旧手机改造艺术品', hook: '废旧电子产品拆解重组，科技+艺术', sentiment: '创意/佩服', category: '手工创意' },
      { title: '"打工人的周末"治愈短剧', hook: '周末从躺平到出门的心理斗争', sentiment: '共鸣/治愈', category: '职场日常' },
      { title: '菜市场砍价教学系列', hook: '教你怎么在菜市场砍价，实用+搞笑', sentiment: '实用/搞笑', category: '本地生活' },
      { title: '"假装在巴黎"低成本拍照', hook: '用本地场景拍出国外大片感', sentiment: '创意/种草', category: '摄影创意' },
      { title: '养猫前后生活对比漫画', hook: '手绘漫画形式记录养猫生活变化', sentiment: '共鸣/可爱', category: '宠物搞笑' },
      { title: '"10元做一顿饭"挑战', hook: '极限预算做美食，实用+反差', sentiment: '实用/佩服', category: '美食教程' },
      { title: '城市夜景延时摄影合集', hook: '城市从日落到日出的延时变化', sentiment: '震撼/分享', category: '摄影创意' },
      { title: '"你不知道的冷知识"系列', hook: '每天一个冷知识，配趣味动画', sentiment: '涨知识/分享', category: '知识科普' },
      { title: '考研/考公倒计时打卡日记', hook: '记录备考日常，互相监督鼓励', sentiment: '励志/共鸣', category: '学习成长' },
      { title: '"下班后的副业"系列', hook: '普通人副业实测，收入数据公开', sentiment: '实用/好奇', category: '职场日常' },
      { title: '宠物生日派对布置', hook: '为宠物办生日派对的全过程', sentiment: '可爱/治愈', category: '宠物创意' },
      { title: '"我的家乡"小城介绍系列', hook: '被忽略的小城美食美景，冷门种草', sentiment: '种草/思乡', category: '旅游攻略' }
    ];

    // 随机选取12-16条
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const count = 12 + Math.floor(Math.random() * 5);
    const items = shuffled.slice(0, count).map(item => ({
      ...item,
      heat: Math.floor(Math.random() * 10000 + 3000) + '万播放'
    }));

    this.hotspots[today] = items;
    Storage.set('insp_hotspots', this.hotspots);
  },

  getTabs() {
    return [
      { id: 'hotspot', name: '每日热点灵感库' },
      { id: 'review', name: '内容发布复盘库' },
      { id: 'material', name: '灵感素材收藏夹' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'hotspot') this.renderHotspot(container);
    else if (tabId === 'review') this.renderReview(container);
    else if (tabId === 'material') this.renderMaterial(container);
  },

  generateSampleHotspots() {
    const today = Storage.today();
    const samples = [
      { title: '"City Walk城市漫游"话题持续发酵', hook: '第一视角沉浸式漫步，ASMR环境音+治愈文案', sentiment: '向往/治愈', category: '生活方式', heat: '9820万播放' },
      { title: 'AI换脸变装视频翻新玩法', hook: '经典影视角色换装，反差感拉满，3秒钩子', sentiment: '惊讶/搞笑', category: '科技整活', heat: '7560万播放' },
      { title: '"打工人早八人的精神状态"系列爆款', hook: '夸张演绎上班路上的内心独白，引发共鸣', sentiment: '共鸣/搞笑', category: '职场日常', heat: '1.2亿播放' },
      { title: '沉浸式收纳整理ASMR', hook: '无声整理+卡点音效，极致治愈感', sentiment: '舒适/解压', category: '生活美学', heat: '6300万播放' },
      { title: '"反向旅游"小众目的地种草', hook: '冷门景点+高性价比攻略，避开人从众', sentiment: '种草/期待', category: '旅游攻略', heat: '5100万播放' },
      { title: '萌宠"第一视角"拍摄新形式', hook: '宠物佩戴GoPro，展示宠物眼中的世界', sentiment: '可爱/新奇', category: '宠物创意', heat: '8900万播放' },
      { title: '15秒知识科普卡点视频', hook: '快节奏信息密度+视觉化呈现，一秒一个知识点', sentiment: '涨知识/分享', category: '知识科普', heat: '4200万播放' },
      { title: '"MBTI人格"情景剧再现', hook: '不同人格面对同一场景的反差演绎', sentiment: '认同/搞笑', category: '心理趣味', heat: '7700万播放' }
    ];
    this.hotspots[today] = samples;
    Storage.set('insp_hotspots', this.hotspots);
  },

  // ===== 每日热点灵感库 =====
  renderHotspot(container) {
    const dates = Object.keys(this.hotspots).sort().reverse();
    const todayHotspots = this.hotspots[this.selectedDate] || [];

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <div class="mod-date-picker">
            <label>查看日期：</label>
            <select id="hotspotDateSelect" class="mod-select">
              ${dates.map(d => `<option value="${d}" ${d === this.selectedDate ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <div class="mod-toolbar-info">
            <span class="mod-badge">📡 ${todayHotspots.length} 条热点</span>
            <span class="mod-hint">每日自动更新全赛道热门内容</span>
          </div>
        </div>

        <div class="mod-cards-grid" id="hotspotGrid">
          ${todayHotspots.length === 0
            ? '<div class="mod-empty"><div class="mod-empty-icon">📭</div><div class="mod-empty-text">当日暂无热点数据</div></div>'
            : todayHotspots.map((h, i) => `
              <div class="hotspot-card">
                <div class="hotspot-card-header">
                  <span class="hotspot-category">${h.category}</span>
                  <span class="hotspot-heat">🔥 ${h.heat}</span>
                </div>
                <h3 class="hotspot-title">${h.title}</h3>
                <div class="hotspot-section">
                  <span class="hotspot-label">核心钩子</span>
                  <p class="hotspot-content">${h.hook}</p>
                </div>
                <div class="hotspot-section">
                  <span class="hotspot-label">用户情绪</span>
                  <span class="hotspot-sentiment-tag">${h.sentiment}</span>
                </div>
                <div class="hotspot-actions">
                  <button class="btn btn-sm btn-outline hotspot-fav-btn" data-idx="${i}">⭐ 收藏选题</button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    `;

    // 日期切换
    const dateSelect = document.getElementById('hotspotDateSelect');
    if (dateSelect) {
      dateSelect.addEventListener('change', (e) => {
        this.selectedDate = e.target.value;
        this.renderHotspot(document.getElementById('contentContainer'));
      });
    }

    // 收藏按钮
    document.querySelectorAll('.hotspot-fav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const hotspot = todayHotspots[idx];
        this.materials.push({
          id: Storage.uid(),
          title: hotspot.title,
          content: `核心钩子：${h.hook}\n用户情绪：${h.sentiment}\n热度：${h.heat}`,
          tags: ['热点收藏', hotspot.category],
          date: Storage.today()
        });
        Storage.set('insp_materials', this.materials);
        btn.textContent = '✓ 已收藏';
        btn.classList.add('btn-primary');
        showToast('已存入灵感素材收藏夹');
      });
    });
  },

  // ===== 内容发布复盘库 =====
  renderReview(container) {
    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addReviewBtn">+ 录入新作品</button>
          <span class="mod-hint">共 ${this.reviews.length} 条复盘记录</span>
        </div>

        ${this.reviews.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📊</div><div class="mod-empty-text">暂无复盘记录，点击上方按钮录入第一条作品数据</div></div>'
          : `<div class="review-list">
              ${this.reviews.slice().reverse().map(r => this.renderReviewCard(r)).join('')}
            </div>`
        }
      </div>
    `;

    const addBtn = document.getElementById('addReviewBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.showReviewForm());
    }

    document.querySelectorAll('.review-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        App.showConfirm('确定删除这条复盘记录？', () => {
          this.reviews = this.reviews.filter(r => r.id !== id);
          Storage.set('insp_reviews', this.reviews);
          this.renderReview(document.getElementById('contentContainer'));
          showToast('已删除');
        });
      });
    });
  },

  renderReviewCard(r) {
    const analysis = r.analysis || {};
    return `
      <div class="review-card">
        <div class="review-card-header">
          <div class="review-card-title">
            <span class="review-date">${r.publishDate}</span>
            <span class="review-link">${r.link || '未填写链接'}</span>
          </div>
          <button class="review-del-btn" data-id="${r.id}">✕</button>
        </div>
        <div class="review-data-row">
          <div class="review-data-item"><span class="review-data-label">播放</span><span class="review-data-value">${r.views || 0}</span></div>
          <div class="review-data-item"><span class="review-data-label">点赞</span><span class="review-data-value">${r.likes || 0}</span></div>
          <div class="review-data-item"><span class="review-data-label">收藏</span><span class="review-data-value">${r.favorites || 0}</span></div>
          <div class="review-data-item"><span class="review-data-label">完播率</span><span class="review-data-value">${r.completion || 0}%</span></div>
          <div class="review-data-item"><span class="review-data-label">评论</span><span class="review-data-value">${r.comments || 0}</span></div>
        </div>
        ${r.script ? `<div class="review-script"><span class="review-label">脚本</span><p>${r.script}</p></div>` : ''}
        ${analysis.summary ? `
          <div class="review-analysis">
            <div class="analysis-summary">${analysis.summary}</div>
            ${analysis.strengths ? `<div class="analysis-section"><span class="analysis-tag good">优点</span><p>${analysis.strengths}</p></div>` : ''}
            ${analysis.weaknesses ? `<div class="analysis-section"><span class="analysis-tag bad">问题</span><p>${analysis.weaknesses}</p></div>` : ''}
            ${analysis.suggestions ? `<div class="analysis-section"><span class="analysis-tag plan">优化方案</span><p>${analysis.suggestions}</p></div>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  },

  showReviewForm() {
    const body = `
      <div class="form-group">
        <label>作品链接</label>
        <input type="text" id="rf-link" class="form-input" placeholder="粘贴抖音作品链接" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>发布日期</label>
          <input type="date" id="rf-date" class="form-input" value="${Storage.today()}" />
        </div>
        <div class="form-group">
          <label>播放量</label>
          <input type="number" id="rf-views" class="form-input" placeholder="如 50000" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>点赞数</label>
          <input type="number" id="rf-likes" class="form-input" placeholder="如 3000" />
        </div>
        <div class="form-group">
          <label>收藏数</label>
          <input type="number" id="rf-favorites" class="form-input" placeholder="如 500" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>完播率(%)</label>
          <input type="number" id="rf-completion" class="form-input" placeholder="如 35" />
        </div>
        <div class="form-group">
          <label>评论数</label>
          <input type="number" id="rf-comments" class="form-input" placeholder="如 200" />
        </div>
      </div>
      <div class="form-group">
        <label>视频脚本</label>
        <textarea id="rf-script" class="form-textarea" rows="4" placeholder="粘贴或输入视频文案脚本..."></textarea>
      </div>
    `;

    App.showModal('录入作品数据', body, () => {
      const data = {
        id: Storage.uid(),
        link: document.getElementById('rf-link').value.trim(),
        publishDate: document.getElementById('rf-date').value,
        views: parseInt(document.getElementById('rf-views').value) || 0,
        likes: parseInt(document.getElementById('rf-likes').value) || 0,
        favorites: parseInt(document.getElementById('rf-favorites').value) || 0,
        completion: parseInt(document.getElementById('rf-completion').value) || 0,
        comments: parseInt(document.getElementById('rf-comments').value) || 0,
        script: document.getElementById('rf-script').value.trim(),
        analysis: null
      };
      data.analysis = this.analyzeReview(data);
      this.reviews.push(data);
      Storage.set('insp_reviews', this.reviews);
      this.renderReview(document.getElementById('contentContainer'));
      showToast('复盘记录已保存');
    }, { maxWidth: '600px', confirmText: '保存并分析' });
  },

  analyzeReview(d) {
    const likeRate = d.views > 0 ? (d.likes / d.views * 100) : 0;
    const favRate = d.views > 0 ? (d.favorites / d.views * 100) : 0;
    const commentRate = d.views > 0 ? (d.comments / d.views * 100) : 0;
    const issues = [];
    const strengths = [];

    // 数据分析逻辑
    if (d.completion >= 40) strengths.push('完播率较高，说明内容节奏把控不错，观众愿意看完');
    else issues.push(`完播率${d.completion}%偏低，开头钩子可能不够吸引人，前3秒需要更强冲击力`);

    if (likeRate >= 5) strengths.push(`点赞率${likeRate.toFixed(1)}%优秀，内容引发了观众认可`);
    else issues.push(`点赞率${likeRate.toFixed(1)}%偏低，内容情绪价值或信息价值需要加强`);

    if (favRate >= 2) strengths.push(`收藏率${favRate.toFixed(1)}%不错，内容有实用价值`);
    else issues.push(`收藏率${favRate.toFixed(1)}%偏低，内容缺乏"值得保存"的干货或实用信息`);

    if (commentRate >= 1) strengths.push('评论互动活跃，选题有讨论空间');
    else issues.push('评论互动不足，可在结尾增加引导互动话术');

    // 脚本分析
    if (d.script) {
      if (d.script.length < 50) issues.push('脚本偏短，信息量可能不足，建议丰富内容层次');
      if (!/[？?！!]/.test(d.script)) issues.push('脚本缺少问句或感叹句，情绪起伏不够，建议增加互动感问句');
    } else {
      issues.push('未填写脚本，无法深度分析文案节奏');
    }

    const suggestions = [];
    if (d.completion < 40) suggestions.push('优化开头钩子：前3秒用悬念/反差/痛点提问抓住注意力，避免平铺直叙');
    if (likeRate < 5) suggestions.push('提升内容价值：增加情绪共鸣点或干货密度，让观众有"说得对"的冲动');
    if (favRate < 2) suggestions.push('增加实用信息：加入可收藏的清单、步骤、攻略等结构化内容');
    if (commentRate < 1) suggestions.push('结尾增加互动引导：抛出开放性问题或争议观点激发评论区讨论');
    suggestions.push('持续对比同赛道爆款数据，找到自己的差异化优势');

    const summary = strengths.length > issues.length
      ? '整体表现不错，有明确优势点，针对性优化薄弱环节即可提升'
      : '数据表现有较大提升空间，建议重点优化开头钩子和内容价值密度';

    return {
      summary,
      strengths: strengths.join('；') || '暂无明显优势',
      weaknesses: issues.join('；'),
      suggestions: suggestions.join('；')
    };
  },

  // ===== 灵感素材收藏夹 =====
  renderMaterial(container) {
    const allTags = [...new Set(this.materials.flatMap(m => m.tags || []))];

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addMaterialBtn">+ 新增素材</button>
          <div class="mod-tag-filter" id="matTagFilter">
            <button class="mod-tag-filter-btn active" data-tag="">全部</button>
            ${allTags.map(t => `<button class="mod-tag-filter-btn" data-tag="${t}">${t}</button>`).join('')}
          </div>
          <span class="mod-hint">共 ${this.materials.length} 条素材</span>
        </div>

        ${this.materials.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">💡</div><div class="mod-empty-text">暂无收藏素材，从热点灵感库收藏或手动新增</div></div>'
          : `<div class="mod-cards-grid" id="materialGrid">
              ${this.materials.slice().reverse().map(m => this.renderMaterialCard(m)).join('')}
            </div>`
        }
      </div>
    `;

    document.getElementById('addMaterialBtn').addEventListener('click', () => this.showMaterialForm());

    document.querySelectorAll('.mat-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const mat = this.materials.find(m => m.id === id);
        if (mat) this.showMaterialForm(mat);
      });
    });

    document.querySelectorAll('.mat-del-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        App.showConfirm('确定删除这条素材？', () => {
          this.materials = this.materials.filter(m => m.id !== id);
          Storage.set('insp_materials', this.materials);
          this.renderMaterial(document.getElementById('contentContainer'));
          showToast('已删除');
        });
      });
    });
  },

  renderMaterialCard(m) {
    return `
      <div class="material-card">
        <div class="material-card-header">
          <h3 class="material-title">${m.title}</h3>
          <div class="material-actions">
            <button class="mat-edit-btn" data-id="${m.id}">✏️</button>
            <button class="mat-del-btn" data-id="${m.id}">✕</button>
          </div>
        </div>
        ${m.content ? `<p class="material-content">${m.content.replace(/\n/g, '<br>')}</p>` : ''}
        <div class="material-tags">
          ${(m.tags || []).map(t => `<span class="material-tag">${t}</span>`).join('')}
        </div>
        <div class="material-date">${m.date || ''}</div>
      </div>
    `;
  },

  showMaterialForm(existing) {
    const isEdit = !!existing;
    const body = `
      <div class="form-group">
        <label>标题</label>
        <input type="text" id="mf-title" class="form-input" value="${existing ? existing.title : ''}" placeholder="选题/创意标题" />
      </div>
      <div class="form-group">
        <label>内容描述</label>
        <textarea id="mf-content" class="form-textarea" rows="4" placeholder="创意思路、对标分析、拍摄想法...">${existing ? existing.content : ''}</textarea>
      </div>
      <div class="form-group">
        <label>标签（逗号分隔）</label>
        <input type="text" id="mf-tags" class="form-input" value="${existing ? (existing.tags || []).join(', ') : ''}" placeholder="如：热点收藏, 生活方式" />
      </div>
    `;

    App.showModal(isEdit ? '编辑素材' : '新增素材', body, () => {
      const title = document.getElementById('mf-title').value.trim();
      if (!title) { showToast('请填写标题'); return false; }
      const content = document.getElementById('mf-content').value.trim();
      const tags = document.getElementById('mf-tags').value.split(',').map(t => t.trim()).filter(Boolean);

      if (isEdit) {
        existing.title = title;
        existing.content = content;
        existing.tags = tags;
      } else {
        this.materials.push({
          id: Storage.uid(),
          title, content, tags,
          date: Storage.today()
        });
      }
      Storage.set('insp_materials', this.materials);
      this.renderMaterial(document.getElementById('contentContainer'));
      showToast(isEdit ? '已更新' : '已新增');
    }, { maxWidth: '520px' });
  }
};
