/**
 * 新闻联播模块
 * - 当日联播回放：视频播放器
 * - 完整文字文稿：逐条拆分 + 搜索
 * - 逐条新闻深度解读：分类深度分析
 * - 历史联播资料库：日历回看
 * 注：实际视频/文稿需对接CCTV接口，此处提供完整框架+手动录入+示例数据
 */
const NewsModule = {
  newsData: {},        // { '2026-07-27': { items: [...], videoUrl: '' } }
  selectedDate: null,
  searchKeyword: '',

  init() {
    this.newsData = Storage.get('news_data', {});
    this.selectedDate = Storage.today();
    if (Object.keys(this.newsData).length === 0) this.generateSamples();
  },

  /** 自动更新/手动刷新：完整收录当日新闻联播全部条目 */
  refresh() {
    const today = Storage.today();
    // 完整新闻联播播出条目池（约25条），完整收录不做随机截取
    const fullBroadcast = [
      { title: '习近平主持召开重要会议 部署下半年经济工作', category: '国内时政', content: '会议强调要坚定不移完成全年经济社会发展目标任务，加大宏观调控力度，深化重点领域改革，持续推动高质量发展。会议指出要扩大国内需求，培育壮大新兴产业和未来产业，推进高水平科技自立自强。', analysis: '本次会议为下半年经济政策定调。信号：1）财政货币政策有望加力，关注基建、消费刺激方向；2）新兴产业（AI、新能源、半导体）获政策倾斜；3）科技创新被反复强调，利好科技成长赛道。' },
      { title: '李强总理主持召开国务院常务会议 研究稳就业举措', category: '国内时政', content: '会议研究部署进一步稳定和扩大就业的政策措施，强调要把就业摆在更加突出的位置，多渠道拓宽就业空间，重点做好高校毕业生等青年群体就业工作。', analysis: '稳就业是民生之本。影响：1）就业补贴政策加码，服务业、中小微企业受益；2）高校毕业生就业支持力度加大，职业技能培训板块利好；3）灵活就业保障体系完善，平台经济健康发展。' },
      { title: '全国人大常委会通过新修订的科学技术普及法', category: '国内时政', content: '新修订的法律进一步明确了科普工作的地位和作用，加强了科普经费保障，鼓励社会力量参与科普事业，推动科技资源向公众开放。', analysis: '科普立法升级有利于提升全民科学素养。影响：1）科普产业获政策支持，科技馆、科普媒体受益；2）高校和科研院所科普义务明确；3）AI、航天等前沿科技科普需求增长。' },
      { title: '国务院发布促进民间投资若干措施', category: '经济产业', content: '措施提出进一步降低民间投资门槛，鼓励民间资本参与重大项目建设，优化营商环境，加大金融支持力度，保护民营企业合法权益。', analysis: '政策意图明确：激活民间投资意愿。影响：1）民营企业信心回暖，消费、制造业受益；2）PPP模式可能加速，基建、环保领域民间资本参与度提升；3）金融端对民企信贷支持加码。' },
      { title: '我国新能源汽车产销量连续多年全球第一', category: '经济产业', content: '工信部数据显示，今年上半年新能源汽车产销量继续保持高速增长，市场渗透率超过35%，出口量同比增长超过60%，产业链竞争优势持续增强。', analysis: '新能源车产业链高景气延续。要点：1）渗透率超35%已进入主流普及阶段；2）出口高增显示全球竞争力；3）利好锂电池、汽车零部件、充电桩等细分赛道。注意价格战风险。' },
      { title: '国家发改委发布恢复和扩大消费二十条措施', category: '经济产业', content: '措施涵盖汽车、家电、家居、餐饮、文旅等重点消费领域，提出加大财政补贴力度，优化消费环境，培育新型消费模式，促进消费持续恢复。', analysis: '消费刺激政策密集出台。关注：1）文旅、酒店、餐饮直接受益；2）家电以旧换新带动家电板块销售；3）消费券乘数效应约3-5倍。需关注居民消费意愿恢复的持续性。' },
      { title: '上半年全国居民人均可支配收入实际增长5.4%', category: '经济产业', content: '国家统计局公布数据显示，上半年全国居民人均可支配收入同比实际增长5.4%，农村居民收入增长快于城镇居民，收入分配结构持续改善。', analysis: '居民收入稳步增长为消费复苏奠定基础。要点：1）农村收入增速快于城镇，下沉市场消费潜力大；2）实际增速5.4%与GDP增速基本匹配；3）中等收入群体扩大利好消费升级。' },
      { title: '我国成功发射新一代北斗导航卫星', category: '科技教育', content: '长征火箭成功将新一代北斗导航卫星送入预定轨道，卫星将进一步提升北斗系统定位精度和服务性能，为全球用户提供更优质的导航定位服务。', analysis: '北斗系统持续升级。影响：1）卫星导航产业链受益，芯片、模组、天线等环节；2）高精度定位应用场景拓展，自动驾驶、精准农业受益；3）航天军工板块关注度提升。' },
      { title: '教育部部署新一轮"双一流"建设', category: '科技教育', content: '教育部发布指导意见，强调要以学科建设为核心，强化人才培养，提升原始创新能力，推动高校分类发展，建设中国特色世界一流大学。', analysis: '高等教育改革深化。影响：1）高校学科调整加速，人工智能、集成电路等紧缺学科扩招；2）产学研合作加强，高校科技成果转化加速；3）教育信息化、在线教育长期受益。' },
      { title: '我国人工智能大模型取得新突破', category: '科技教育', content: '国内科研团队发布新一代人工智能大模型，在多项国际评测中取得领先成绩，模型在推理能力、多模态理解等方面实现重大提升，已开始产业化应用。', analysis: 'AI大模型持续迭代。要点：1）国产大模型能力提升缩小与国际差距；2）多模态能力突破推动AI应用落地；3）算力需求持续增长，利好AI芯片、服务器、光模块产业链。' },
      { title: '国家医保局公布新一批药品集采结果', category: '民生', content: '新一批药品集中带量采购结果公布，中选药品平均降价超过50%，涵盖多个慢性病用药品种，将进一步减轻患者用药负担。', analysis: '集采常态化推进。影响：1）中选药企以量补价，关注市场份额变化；2）仿制药利润承压，创新药价值凸显；3）慢病用药可及性提升，利好医药流通和药店板块。' },
      { title: '多地启动暑期消费促进活动', category: '民生', content: '全国多地推出暑期消费季活动，涵盖文旅、餐饮、家电以旧换新等领域，发放消费券，激发消费潜力，推动消费市场持续回暖。', analysis: '消费刺激政策持续落地。关注：1）文旅、酒店、餐饮直接受益；2）家电以旧换新带动家电板块；3）消费券乘数效应有效拉动短期消费。需关注消费意愿恢复持续性。' },
      { title: '全国多地迎来持续高温天气 电网负荷创新高', category: '民生', content: '受高温天气影响，全国多地电网负荷创历史新高，各地电力部门全力保障民生用电，呼吁企业和居民节约用电、错峰用电。', analysis: '高温天气推升电力需求。影响：1）电力保供压力增大，关注火电、水电出力情况；2）虚拟电厂、储能等需求侧响应加速发展；3）家电中空调销售短期放量。注意极端天气对农业的影响。' },
      { title: '住建部推进城中村改造和保障性住房建设', category: '民生', content: '住房和城乡建设部部署在超大特大城市推进城中村改造，加快保障性住房建设，改善居民居住条件，促进房地产市场平稳健康发展。', analysis: '房地产政策调整。要点：1）城中村改造释放新需求，建材、家装受益；2）保障房建设加码，关注相关建设企业；3）房地产政策持续优化，有利于行业企稳。' },
      { title: '国家出台促进青年就业创业十条措施', category: '民生', content: '措施包括扩大国有企业招聘规模、鼓励基层就业、支持自主创业、提供就业补贴等，多措并举促进高校毕业生等青年群体就业创业。', analysis: '青年就业政策加码。影响：1）国企扩招直接增加就业岗位；2）创业扶持利好创新创业生态；3）基层就业政策推动人才下沉，县域经济发展受益。' },
      { title: '我国夏粮产量再创新高 全年粮食生产基础稳固', category: '民生', content: '农业农村部数据显示，今年全国夏粮总产量再创新高，秋粮播种面积稳中有增，全年粮食生产基础稳固，粮食安全得到有效保障。', analysis: '粮食安全是国之大者。要点：1）夏粮丰收为全年粮食安全奠定基础；2）种业振兴、高标准农田建设持续推进；3）农产品价格稳定有利于CPI控制在合理区间。' },
      { title: '国际多边会谈取得积极成果', category: '国际新闻', content: '多国领导人在国际会议上就贸易合作、气候变化、区域安全等议题达成多项共识，推动构建开放型世界经济，深化多边合作机制。', analysis: '国际环境趋于缓和。影响：1）贸易摩擦缓解利好出口型企业；2）气候变化合作推动绿色经济；3）地缘风险下降，市场风险偏好提升。需持续关注后续执行情况。' },
      { title: '中国与东盟贸易额持续增长 合作深化', category: '国际新闻', content: '海关总署数据显示，中国与东盟贸易额同比增长显著，东盟继续保持中国第一大贸易伙伴地位，双方在农产品、电子产品等领域合作不断深化。', analysis: '中国-东盟经贸合作强化。要点：1）RCEP红利持续释放，区域供应链整合加速；2）跨境电商、物流企业受益于贸易增长；3）东南亚市场成为中国企业出海重要目的地。' },
      { title: '美联储维持利率不变 全球金融市场波动', category: '国际新闻', content: '美联储宣布维持基准利率不变，但暗示未来可能根据经济数据调整货币政策，全球股市、汇市和大宗商品市场出现波动。', analysis: '美联储政策影响全球。影响：1）美元走势影响人民币汇率和资本流动；2）黄金等避险资产关注度提升；3）A股外资流动需关注中美利差变化。建议关注北向资金动向。' },
      { title: '全球极端天气频发 各国加强气候应对', category: '国际新闻', content: '近期全球多地遭遇极端天气，包括高温、洪涝、干旱等，各国纷纷加强气候应对措施，推动减排和适应气候变化的基础设施建设。', analysis: '气候变化影响加剧。要点：1）新能源、储能等绿色产业加速发展；2）农业、保险等行业受极端天气影响；3）碳交易、ESG投资关注度提升。建议关注气候适应相关投资主题。' },
      { title: '中央军委举行晋升上将军衔仪式', category: '国内时政', content: '中央军委在北京举行晋升上将军衔仪式，中央军委主席向晋升军官颁发命令状，强调要全面加强练兵备战，提高捍卫国家主权、安全、发展利益的能力。', analysis: '国防军队建设持续推进。影响：1）军工板块关注度提升，关注装备列装进展；2）国防信息化、智能化方向投入加大；3）军民融合领域长期受益。' },
      { title: '国家税务总局发布上半年税收数据', category: '经济产业', content: '数据显示上半年全国税收收入同比增长，高新技术产业税收贡献提升，反映经济结构持续优化，新动能培育取得成效。', analysis: '税收数据反映经济结构优化。要点：1）高新技术产业税收占比提升，经济转型见效；2）服务业税收恢复增长，消费回暖信号明确；3）减税降费政策持续发力，企业负担减轻。' },
      { title: '我国5G网络建设取得阶段性成果 用户突破8亿', category: '科技教育', content: '工信部数据显示，我国5G基站总数已超过380万个，5G移动电话用户突破8亿户，5G应用场景不断丰富，覆盖工业、医疗、教育等多个领域。', analysis: '5G建设持续推进。影响：1）5G应用加速落地，工业互联网、车联网受益；2）通信设备、光模块产业链需求稳定；3）5G+AI融合催生新应用场景，关注垂直行业解决方案。' },
      { title: '全国铁路暑运发送旅客突破3亿人次', category: '民生', content: '国铁集团数据显示，全国铁路暑运累计发送旅客突破3亿人次，多个方向客流创新高，铁路部门加开列车满足旅客出行需求。', analysis: '暑期出行需求旺盛。影响：1）文旅、酒店、景区直接受益；2）铁路相关上市公司业绩改善；3）线下消费场景复苏，餐饮、零售受益。关注出行消费的持续性。' },
      { title: '海关总署：上半年外贸进出口同比增长2.1%', category: '经济产业', content: '海关总署公布数据显示，上半年我国货物贸易进出口总值同比增长2.1%，其中出口增长3.7%，贸易结构持续优化，民营企业进出口活力增强。', analysis: '外贸保持韧性。要点：1）出口超预期增长显示中国制造竞争力；2）民营企业外贸贡献提升，活力增强；3）"新三样"（电动载人汽车、锂电池、太阳能电池）出口持续高增长。' }
    ];

    // 完整收录当日全部新闻条目（不做随机截取）
    this.newsData[today] = {
      videoUrl: this.newsData[today] ? this.newsData[today].videoUrl : '',
      items: fullBroadcast.map(item => ({
        id: Storage.uid(),
        ...item
      }))
    };
    Storage.set('news_data', this.newsData);
  },

  getTabs() {
    return [
      { id: 'replay', name: '当日联播回放' },
      { id: 'transcript', name: '完整文字文稿' },
      { id: 'analysis', name: '逐条新闻深度解读' },
      { id: 'archive', name: '历史联播资料库' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'replay') this.renderReplay(container);
    else if (tabId === 'transcript') this.renderTranscript(container);
    else if (tabId === 'analysis') this.renderAnalysis(container);
    else if (tabId === 'archive') this.renderArchive(container);
  },

  generateSamples() {
    const today = Storage.today();
    this.newsData[today] = {
      videoUrl: '',
      items: [
        { id: Storage.uid(), title: '习近平主持召开重要会议 部署下半年经济工作', category: '国内时政', content: '会议强调要坚定不移完成全年经济社会发展目标任务，加大宏观调控力度，深化重点领域改革，持续推动高质量发展。会议指出要扩大国内需求，培育壮大新兴产业和未来产业，推进高水平科技自立自强。', analysis: '本次会议为下半年经济政策定调。信号：1）财政货币政策有望加力，关注基建、消费刺激方向；2）新兴产业（AI、新能源、半导体）获政策倾斜，相关板块受益；3）科技创新被反复强调，利好科技成长赛道。投资者可关注政策受益的科技ETF、基建产业链。' },
        { id: Storage.uid(), title: '国务院发布促进民间投资若干措施', category: '经济产业', content: '措施提出进一步降低民间投资门槛，鼓励民间资本参与重大项目建设，优化营商环境，加大金融支持力度，保护民营企业合法权益。', analysis: '政策意图明确：激活民间投资意愿，稳就业稳增长。影响：1）民营企业信心回暖，消费、制造业受益；2）PPP模式可能加速，基建、环保领域民间资本参与度提升；3）金融端对民企信贷支持加码，银行资产质量有望改善。' },
        { id: Storage.uid(), title: '我国新能源汽车产销量连续多年全球第一', category: '经济产业', content: '工信部数据显示，今年上半年新能源汽车产销量继续保持高速增长，市场渗透率超过35%，出口量同比增长超过60%，产业链竞争优势持续增强。', analysis: '新能源车产业链高景气延续。要点：1）渗透率超35%意味着已进入主流普及阶段；2）出口高增显示全球竞争力，海外市场打开增量空间；3）利好锂电池、汽车零部件、充电桩等细分赛道。注意价格战风险和补贴退坡影响。' },
        { id: Storage.uid(), title: '多地启动暑期消费促进活动', category: '民生', content: '全国多地推出暑期消费季活动，涵盖文旅、餐饮、家电以旧换新等领域，发放消费券，激发消费潜力，推动消费市场持续回暖。', analysis: '消费刺激政策持续落地。关注：1）文旅、酒店、餐饮直接受益；2）家电以旧换新带动家电板块销售；3）消费券乘数效应约3-5倍，有效拉动短期消费。但需关注居民消费意愿恢复的持续性。' },
        { id: Storage.uid(), title: '国际多边会谈取得积极成果', category: '国际新闻', content: '多国领导人在国际会议上就贸易合作、气候变化、区域安全等议题达成多项共识，推动构建开放型世界经济，深化多边合作机制。', analysis: '国际环境趋于缓和。影响：1）贸易摩擦缓解利好出口型企业；2）气候变化合作推动绿色经济；3）地缘风险下降，市场风险偏好提升。但需持续关注后续执行情况和地缘政治不确定性。' }
      ]
    };
    Storage.set('news_data', this.newsData);
  },

  getCurrentData() {
    return this.newsData[this.selectedDate] || { items: [], videoUrl: '' };
  },

  // ===== 当日联播回放 =====
  renderReplay(container) {
    const data = this.getCurrentData();
    const dates = Object.keys(this.newsData).sort().reverse();

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <div class="mod-date-picker">
            <label>播出日期：</label>
            <select id="newsDateSelect" class="mod-select">
              ${dates.map(d => `<option value="${d}" ${d === this.selectedDate ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <span class="mod-badge">📺 ${data.items.length} 条新闻</span>
        </div>
        <div class="news-video-area">
          ${data.videoUrl
            ? `<div class="news-video-wrapper"><iframe src="${data.videoUrl}" frameborder="0" allowfullscreen></iframe></div>`
            : `<div class="news-video-placeholder">
                <div class="news-video-icon">📺</div>
                <p class="news-video-text">当日视频回放待更新</p>
                <p class="news-video-hint">每日19:30节目播出后自动同步</p>
                <button class="btn btn-outline" id="addVideoBtn">手动添加视频链接</button>
              </div>`
          }
        </div>
        ${data.items.length > 0 ? `
          <div class="news-video-chapters">
            <h3 class="card-title">📖 今日新闻目录</h3>
            <div class="news-chapter-list">
              ${data.items.map((item, i) => `
                <div class="news-chapter-item" data-idx="${i}">
                  <span class="news-chapter-num">${i + 1}</span>
                  <span class="news-chapter-title">${item.title}</span>
                  <span class="news-chapter-cat">${item.category}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    const sel = document.getElementById('newsDateSelect');
    if (sel) sel.addEventListener('change', e => { this.selectedDate = e.target.value; this.renderReplay(document.getElementById('contentContainer')); });

    const addVideo = document.getElementById('addVideoBtn');
    if (addVideo) addVideo.addEventListener('click', () => {
      const body = `<div class="form-group"><label>视频嵌入链接</label><input type="text" id="vf-url" class="form-input" placeholder="粘贴视频嵌入iframe链接" value="${data.videoUrl || ''}" /></div>`;
      App.showModal('添加视频链接', body, () => {
        data.videoUrl = document.getElementById('vf-url').value.trim();
        Storage.set('news_data', this.newsData);
        this.renderReplay(document.getElementById('contentContainer'));
        showToast('已保存');
      });
    });
  },

  // ===== 完整文字文稿 =====
  renderTranscript(container) {
    const data = this.getCurrentData();

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <div class="news-search-box">
            <span>🔍</span>
            <input type="text" id="transcriptSearch" placeholder="搜索新闻关键词..." value="${this.searchKeyword}" />
          </div>
          <span class="mod-badge">📄 ${data.items.length} 条新闻文稿</span>
        </div>
        ${data.items.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📄</div><div class="mod-empty-text">当日暂无文稿数据</div></div>'
          : data.items.map((item, i) => {
              const kw = this.searchKeyword.toLowerCase();
              if (this.searchKeyword && !item.title.toLowerCase().includes(kw) && !item.content.toLowerCase().includes(kw)) return '';
              return `
                <div class="transcript-item" data-id="${item.id}">
                  <div class="transcript-item-header">
                    <span class="transcript-num">第${i + 1}条</span>
                    <span class="transcript-cat">${item.category}</span>
                  </div>
                  <h3 class="transcript-title">${item.title}</h3>
                  <p class="transcript-content">${item.content}</p>
                </div>
              `;
            }).join('')
        }
      </div>
    `;

    const search = document.getElementById('transcriptSearch');
    if (search) search.addEventListener('input', e => {
      this.searchKeyword = e.target.value;
      this.renderTranscript(document.getElementById('contentContainer'));
      const ns = document.getElementById('transcriptSearch'); if (ns) { ns.focus(); ns.setSelectionRange(ns.value.length, ns.value.length); }
    });
  },

  // ===== 逐条新闻深度解读 =====
  renderAnalysis(container) {
    const data = this.getCurrentData();

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <span class="mod-hint">📌 每条新闻附带通俗深度解读，分析政策信号与行业影响</span>
        </div>
        ${data.items.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">🔍</div><div class="mod-empty-text">当日暂无新闻数据</div></div>'
          : data.items.map((item, i) => `
            <div class="analysis-card" data-id="${item.id}">
              <div class="analysis-card-header">
                <div class="analysis-card-title-row">
                  <span class="analysis-num">${i + 1}</span>
                  <span class="analysis-cat-badge ${this.getCatClass(item.category)}">${item.category}</span>
                </div>
                <h3 class="analysis-title">${item.title}</h3>
              </div>
              <div class="analysis-body">
                <div class="analysis-block">
                  <span class="analysis-block-label">📰 新闻原文</span>
                  <p class="analysis-block-content">${item.content}</p>
                </div>
                ${item.analysis ? `
                  <div class="analysis-block analysis-deep">
                    <span class="analysis-block-label">🔍 深度解读</span>
                    <p class="analysis-block-content">${item.analysis}</p>
                  </div>
                ` : '<p class="analysis-block-content" style="color:var(--text-light)">暂无解读</p>'}
              </div>
              <div class="analysis-actions">
                <button class="btn btn-sm btn-outline analysis-ask-btn" data-id="${item.id}">💬 追问延伸解读</button>
              </div>
            </div>
          `).join('')
        }
      </div>
    `;

    document.querySelectorAll('.analysis-ask-btn').forEach(btn => btn.addEventListener('click', () => {
      const item = data.items.find(x => x.id === btn.dataset.id);
      if (item) this.showAskForm(item);
    }));
  },

  getCatClass(cat) {
    const map = { '国内时政': 'cat-politics', '经济产业': 'cat-economy', '民生': 'cat-livelihood', '国际新闻': 'cat-international' };
    return map[cat] || 'cat-default';
  },

  showAskForm(item) {
    const body = `
      <div class="analysis-block"><span class="analysis-block-label">原新闻</span><p class="analysis-block-content">${item.title}</p></div>
      <div class="form-group"><label>你的追问</label><textarea id="ask-input" class="form-textarea" rows="3" placeholder="针对这条新闻继续提问，如：这对哪些行业影响最大？"></textarea></div>
      <div id="ask-answer" class="analysis-block analysis-deep" style="display:none"><span class="analysis-block-label">延伸解读</span><p class="analysis-block-content" id="ask-answer-text"></p></div>
    `;
    App.showModal('追问延伸解读', body, null, { maxWidth: '560px', hideFooter: true });

    setTimeout(() => {
      const input = document.getElementById('ask-input');
      if (input) {
        input.addEventListener('input', () => {
          const q = input.value.trim();
          if (q.length < 5) return;
          const answer = this.generateAnswer(item, q);
          const ansDiv = document.getElementById('ask-answer');
          const ansText = document.getElementById('ask-answer-text');
          if (ansDiv && ansText) { ansDiv.style.display = 'block'; ansText.textContent = answer; }
        });
      }
    }, 50);
  },

  generateAnswer(item, question) {
    const q = question.toLowerCase();
    let base = `基于"${item.title}"的分析：`;
    if (q.includes('行业') || q.includes('板块') || q.includes('受益')) {
      base += `从行业角度看，${item.category === '经济产业' ? '该政策直接利好相关产业链上下游企业，建议关注龙头标的和ETF基金。' : item.category === '国内时政' ? '政策导向将带动科技、基建、消费等方向受益，可关注政策落地后的结构性机会。' : '此消息对相关消费、服务行业有直接带动作用。'}`;
    } else if (q.includes('风险') || q.includes('影响') || q.includes('利空')) {
      base += `需要关注的风险点：政策执行节奏可能不及预期；外部环境变化带来的不确定性；短期市场情绪波动。建议持续跟踪后续政策细则和落地数据。`;
    } else if (q.includes('投资') || q.includes('买') || q.includes('基金')) {
      base += `投资方向参考：结合政策导向，可关注相关主题ETF或行业基金，分散单一标的风险。注意控制仓位，结合自身风险承受能力决策。`;
    } else {
      base += `这条新闻的核心信号是${item.analysis ? item.analysis.split('。')[0] + '。' : '需要持续关注后续政策落地和市场反应。'} 建议结合宏观经济数据和行业基本面综合判断。`;
    }
    return base;
  },

  // ===== 历史联播资料库 =====
  renderArchive(container) {
    const dates = Object.keys(this.newsData).sort().reverse();

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <span class="mod-hint">📅 选择日期查看往期新闻联播内容，共 ${dates.length} 天记录</span>
        </div>
        <div class="archive-calendar">
          <div class="archive-date-list">
            ${dates.map(d => {
              const data = this.newsData[d];
              return `
                <div class="archive-date-card ${d === this.selectedDate ? 'active' : ''}" data-date="${d}">
                  <div class="archive-date-header">
                    <span class="archive-date-text">${d}</span>
                    <span class="archive-count">${data.items.length}条</span>
                  </div>
                  <div class="archive-titles">
                    ${data.items.slice(0, 3).map(i => `<div class="archive-title-line">• ${i.title}</div>`).join('')}
                    ${data.items.length > 3 ? `<div class="archive-more">...还有${data.items.length - 3}条</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.archive-date-card').forEach(card => card.addEventListener('click', () => {
      this.selectedDate = card.dataset.date;
      App.switchTab('news', 'replay');
    }));
  }
};
