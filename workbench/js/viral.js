/**
 * 爆款二创模块（宠物垂类）
 * - 鼠类赛道热点库：仓鼠/公婆鼠等啮齿类宠物热点
 * - 综合宠物赛道热点库：猫狗等各类宠物通用热点
 * - 二创脚本素材库：筛选后的选题/脚本/文案管理
 * - 对标视频收藏夹：对标视频链接+借鉴思路
 */
const ViralModule = {
  hamsterHotspots: {},  // 鼠类热点 { date: [...] }
  petHotspots: {},      // 综合宠物热点 { date: [...] }
  scripts: [],          // 二创脚本素材
  benchmarks: [],       // 对标视频收藏
  selectedHamsterDate: null,
  selectedPetDate: null,

  init() {
    this.hamsterHotspots = Storage.get('viral_hamster', {});
    this.petHotspots = Storage.get('viral_pet', {});
    this.scripts = Storage.get('viral_scripts', []);
    this.benchmarks = Storage.get('viral_benchmarks', []);
    this.selectedHamsterDate = Storage.today();
    this.selectedPetDate = Storage.today();

    if (Object.keys(this.hamsterHotspots).length === 0) this.generateHamsterSamples();
    if (Object.keys(this.petHotspots).length === 0) this.generatePetSamples();
  },

  /** 自动更新/手动刷新：生成当日鼠类+综合宠物热点（各12~16条） */
  refresh() {
    const today = Storage.today();
    const hamsterPool = [
      { title: '仓鼠"越狱"系列爆火', hook: '记录仓鼠想方设法逃出笼子的搞笑过程', resonance: '搞笑/心疼', discuss: '评论区热议仓鼠智商到底有多高', idea: '拍摄自家鼠子越狱失败合集，配上内心独白字幕', bgm: '搞笑卡点BGM', format: '15-30秒短剧' },
      { title: '公婆鼠"一家三口"治愈日常', hook: '一对公婆鼠带宝宝的温馨画面', resonance: '治愈/萌', discuss: '讨论繁殖注意事项和幼鼠护理', idea: '记录鼠宝宝成长日记，从出生到开眼', bgm: '治愈钢琴曲', format: '1分钟vlog' },
      { title: '仓鼠吃播ASMR', hook: '近距离收音仓鼠啃瓜子的声音', resonance: '解压/舒适', discuss: '求推荐同款零食和食盆', idea: '不同零食对比吃播，测试鼠子口味偏好', bgm: '纯自然音', format: '30秒沉浸式' },
      { title: '"仓鼠跑轮极限挑战"', hook: '记录仓鼠一晚跑了多少公里', resonance: '惊讶/佩服', discuss: '讨论跑轮选购和运动量', idea: '用计数器统计仓鼠跑轮圈数换算距离', bgm: '燃向BGM', format: '快节奏混剪' },
      { title: '仓鼠换新窝反应实录', hook: '给仓鼠布置豪华新笼舍的反应', resonance: '好奇/期待', discuss: '讨论笼舍布置和丰容方案', idea: 'DIY仓鼠豪宅改造全过程', bgm: '轻快BGM', format: '1-2分钟vlog' },
      { title: '仓鼠洗澡沙浴翻滚合集', hook: '仓鼠在浴沙里打滚的萌态', resonance: '治愈/可爱', discuss: '讨论浴沙品牌选择和使用频率', idea: '不同浴沙对比+仓鼠反应', bgm: '可爱风BGM', format: '15秒合集' },
      { title: '"仓鼠的一天"延时摄影', hook: '24小时延时记录仓鼠活动规律', resonance: '新奇/有趣', discuss: '讨论仓鼠作息和夜间活动', idea: '夜视镜头记录仓鼠夜间行为', bgm: '时间流逝风BGM', format: '30秒延时' },
      { title: '仓鼠穿小衣服系列', hook: '给仓鼠DIY迷你服装穿搭', resonance: '可爱/搞笑', discuss: '讨论仓鼠穿衣安全性和DIY教程', idea: '不同风格穿搭+T台走秀', bgm: '时尚秀BGM', format: '15-30秒' },
      { title: '仓鼠迷宫挑战赛', hook: '手工制作迷宫让仓鼠闯关找食物', resonance: '有趣/紧张', discuss: '讨论迷宫设计思路和仓鼠智力', idea: '不同难度迷宫进阶挑战系列', bgm: '游戏风BGM', format: '1分钟挑战' },
      { title: '"仓鼠称体重"日常仪式感', hook: '每周称体重记录仓鼠成长曲线', resonance: '治愈/养成', discuss: '讨论正常体重范围和健康管理', idea: '制作体重变化折线图可视化', bgm: '轻快日常BGM', format: '30秒vlog' },
      { title: '仓鼠颊囊塞满食物搞笑瞬间', hook: '仓鼠把食物塞满颊囊变成大头', resonance: '搞笑/可爱', discuss: '讨论颊囊健康和清理方法', idea: '不同食物塞颊囊对比测试', bgm: '搞笑配乐', format: '15秒合集' },
      { title: '仓鼠品种科普图鉴', hook: '一文看全所有仓鼠品种特点', resonance: '涨知识/收藏', discuss: '讨论各品种适合新手程度', idea: '用图文+实物对比做品种大全', bgm: '知识科普BGM', format: '1分钟科普' },
      { title: '"仓鼠搬家日"全记录', hook: '从旧笼搬到新笼的完整过程', resonance: '期待/治愈', discuss: '讨论搬家注意事项和适应期', idea: '记录仓鼠适应新环境的每一天', bgm: '温暖BGM', format: '2分钟vlog' },
      { title: '仓鼠啃笼子纠正指南', hook: '仓鼠啃笼子的原因和解决方法', resonance: '实用/共鸣', discuss: '讨论啃笼子的危害和替代方案', idea: '实测各种磨牙玩具效果', bgm: '教学风BGM', format: '1分钟科普' },
      { title: '仓鼠相亲配对实录', hook: '记录给仓鼠找对象的搞笑过程', resonance: '搞笑/期待', discuss: '讨论配种注意事项和时机', idea: '相亲过程配上人类相亲旁白', bgm: '搞笑相亲BGM', format: '1-2分钟短剧' },
      { title: '仓鼠夏季降温妙招', hook: '夏天如何给仓鼠降温防暑', resonance: '实用/关心', discuss: '讨论降温板、空调房、瓷窝等方案', idea: '实测不同降温方案效果对比', bgm: '清凉风BGM', format: '1分钟教程' },
      { title: '仓鼠冬季保暖攻略', hook: '冬天仓鼠伪冬眠怎么办', resonance: '实用/担心', discuss: '讨论保暖材料和温度控制', idea: '仓鼠保暖用品红黑榜', bgm: '温暖BGM', format: '1分钟科普' },
      { title: '"仓鼠智商测试"系列', hook: '设计趣味测试检验仓鼠聪明程度', resonance: '有趣/佩服', discuss: '讨论仓鼠学习能力和训练方法', idea: '找食物迷宫+记忆测试', bgm: '游戏风BGM', format: '1分钟挑战' },
      { title: '仓鼠造型窝DIY大赛', hook: '手工制作不同主题的仓鼠窝', resonance: '创意/治愈', discuss: '讨论材料安全性和DIY教程', idea: '主题窝系列：城堡/森林/海底', bgm: '手工治愈BGM', format: '2分钟DIY' },
      { title: '仓鼠零食制作教程', hook: '自制健康仓鼠零食', resonance: '实用/创意', discuss: '讨论食材安全和营养搭配', idea: '不同配方零食制作+仓鼠试吃反应', bgm: '美食风BGM', format: '1分钟教程' },
      { title: '"仓鼠生病的那些事"科普', hook: '仓鼠常见疾病识别与预防', resonance: '担心/涨知识', discuss: '讨论湿尾、皮肤病、肿瘤等常见病', idea: '症状图鉴+就医建议', bgm: '科普BGM', format: '2分钟科普' },
      { title: '仓鼠跑球外放探险', hook: '仓鼠在跑球里探索家里的每个角落', resonance: '新奇/可爱', discuss: '讨论跑球安全性和使用时长', idea: '不同房间探险+仓鼠反应', bgm: '探险风BGM', format: '1分钟vlog' },
      { title: '"仓鼠老年生活"记录', hook: '老年仓鼠的日常护理和陪伴', resonance: '感动/治愈', discuss: '讨论老年仓鼠特殊护理需求', idea: '记录老年仓鼠的温柔日常', bgm: '感伤治愈BGM', format: '2分钟vlog' },
      { title: '仓鼠不同叫声含义解读', hook: '仓鼠各种叫声代表什么意思', resonance: '涨知识/好奇', discuss: '讨论仓鼠情绪表达和沟通方式', idea: '收集不同叫声+情境解读', bgm: '自然音', format: '1分钟科普' },
      { title: '仓鼠笼造景布景教程', hook: '自然风造景笼舍布置全过程', resonance: '治愈/创意', discuss: '讨论造景材料安全和维护难度', idea: '不同风格造景系列教程', bgm: '治愈自然BGM', format: '3分钟DIY' },
      { title: '"仓鼠跟手训练"教学', hook: '教仓鼠学会跟手和上手', resonance: '佩服/治愈', discuss: '讨论训练方法和耐心要求', idea: '从零开始训练仓鼠上手系列', bgm: '轻快BGM', format: '1分钟教程' },
      { title: '仓鼠运动会趣味挑战', hook: '为仓鼠举办迷你运动会', resonance: '可爱/有趣', discuss: '讨论比赛项目设计和安全', idea: '跑轮赛/觅食赛/障碍赛', bgm: '运动会BGM', format: '2分钟混剪' },
      { title: '仓鼠四季变化记录', hook: '同一只仓鼠在四季的不同状态', resonance: '治愈/感动', discuss: '讨论季节对仓鼠的影响', idea: '春夏秋冬对比记录', bgm: '四季BGM', format: '1分钟对比' },
      { title: '"新手养鼠第一周"指南', hook: '新手养仓鼠第一周该做什么', resonance: '实用/共鸣', discuss: '讨论新鼠到家适应期护理', idea: '第一天到第七天详细攻略', bgm: '教学BGM', format: '3分钟教程' },
      { title: '仓鼠搞笑表情包合集', hook: '仓鼠各种搞笑表情截屏做成表情包', resonance: '搞笑/分享', discuss: '求原图和表情包下载', idea: '不同情境表情包系列', bgm: '搞笑BGM', format: '15秒合集' },
      { title: '仓鼠与主人信任建立过程', hook: '从怕人到亲近的转变记录', resonance: '感动/治愈', discuss: '讨论建立信任的方法和时间', idea: '30天信任养成日记', bgm: '温暖BGM', format: '2分钟vlog' },
      { title: '多只仓鼠同居实验', hook: '仓鼠能不能合笼养的真相', resonance: '好奇/争议', discuss: '讨论合笼风险和品种差异', idea: '科学实验+专家解读', bgm: '纪录片风BGM', format: '3分钟科普' }
    ];
    const petPool = [
      { title: '猫咪"嫌弃表情"合集爆款', hook: '主人做各种事情时猫咪的嫌弃眼神', resonance: '搞笑/共鸣', type: '宠物日常vlog', idea: '适配鼠类：拍仓鼠面对新玩具的嫌弃反应' },
      { title: '宠物"第一次体验"系列', hook: '记录宠物第一次见雪/见镜子/坐车的反应', resonance: '新奇/可爱', type: '宠物日常vlog', idea: '仓鼠第一次见浴沙/外出的反应' },
      { title: '"宠物视角"第一人称拍摄', hook: '宠物身上的GoPro记录它的一天', resonance: '新奇/代入', type: '创意拍摄', idea: '仓鼠视角探索整个房间的冒险' },
      { title: '宠物智商测试挑战', hook: '设计趣味测试检验宠物聪明程度', resonance: '有趣/佩服', type: '趣味挑战', idea: '仓鼠走迷宫+找食物测试' },
      { title: '萌宠"吵架"名场面', hook: '宠物之间互动对话配音', resonance: '搞笑/治愈', type: '剧情配音', idea: '多只仓鼠互动配音对话' },
      { title: '宠物用品真实测评', hook: '热门宠物用品买回来实测好不好用', resonance: '种草/避雷', type: '用品测评', idea: '仓鼠用品红黑榜测评' },
      { title: '"猫咪 reacting to"反应系列', hook: '猫咪对各种声音/物体的反应', resonance: '可爱/搞笑', type: '宠物日常vlog', idea: '仓鼠对不同声音的反应测试' },
      { title: '宠物成长记录对比', hook: '从小到大的变化对比，感动回忆杀', resonance: '感动/怀旧', type: '治愈向短视频', idea: '仓鼠从幼鼠到成鼠的变化记录' },
      { title: '宠物科普辟谣系列', hook: '纠正养宠常见误区，专业科普', resonance: '涨知识/转发', type: '科普辟谣', idea: '仓鼠饲养常见误区辟谣' },
      { title: '"养宠前后"生活变化', hook: '养宠物前后的生活对比', resonance: '共鸣/搞笑', type: '宠物日常vlog', idea: '养鼠前后的生活对比' },
      { title: '宠物洗澡大战实录', hook: '给宠物洗澡的鸡飞狗跳过程', resonance: '搞笑/共鸣', type: '宠物日常vlog', idea: '仓鼠沙浴vs水浴对比' },
      { title: '"宠物听到主人回家"反应', hook: '宠物听到门钥匙声音的激动反应', resonance: '治愈/感动', type: '宠物日常vlog', idea: '仓鼠听到主人脚步声的反应' },
      { title: '宠物体检全记录', hook: '带宠物去体检的完整过程', resonance: '实用/关心', type: '科普vlog', idea: '仓鼠体检项目详解和费用' },
      { title: '"宠物拆家"名场面', hook: '宠物搞破坏的搞笑瞬间', resonance: '搞笑/心疼', type: '宠物日常vlog', idea: '仓鼠啃咬破坏实录' },
      { title: '宠物穿衣打扮系列', hook: '给宠物穿各种衣服的可爱造型', resonance: '可爱/种草', type: '穿搭分享', idea: '仓鼠迷你服装DIY穿搭' },
      { title: '"宠物偷吃"被抓包', hook: '宠物偷吃东西被抓到的表情', resonance: '搞笑/可爱', type: '宠物日常vlog', idea: '仓鼠偷藏食物被抓包' },
      { title: '宠物生日派对策划', hook: '为宠物办生日派对的完整方案', resonance: '治愈/精致', type: 'vlog', idea: '仓鼠一岁生日派对布置' },
      { title: '"宠物生病了怎么办"指南', hook: '宠物常见小毛病处理方法', resonance: '实用/担心', type: '科普', idea: '仓鼠常见疾病自查指南' },
      { title: '宠物减肥打卡日记', hook: '帮胖宠物减肥的每日记录', resonance: '励志/可爱', type: 'vlog', idea: '仓鼠减肥计划打卡' },
      { title: '"宠物才艺展示"系列', hook: '教宠物各种技能的成果展示', resonance: '佩服/可爱', type: '才艺展示', idea: '仓鼠转圈/握手才艺教学' },
      { title: '宠物医院真实体验', hook: '带宠物看病的真实经历分享', resonance: '共鸣/实用', type: 'vlog', idea: '仓鼠就医经历和费用分享' },
      { title: '"宠物好物推荐"每月清单', hook: '每月养宠好物推荐合集', resonance: '种草/实用', type: '好物推荐', idea: '仓鼠月度好物红黑榜' },
      { title: '宠物与小孩的温馨互动', hook: '宠物和小朋友的治愈画面', resonance: '治愈/温暖', type: '日常vlog', idea: '仓鼠与小孩的温柔互动' },
      { title: '"宠物视角"解读主人行为', hook: '从宠物角度吐槽主人的搞笑日常', resonance: '搞笑/新奇', type: '创意配音', idea: '仓鼠视角吐槽主人' },
      { title: '宠物季节性护理指南', hook: '不同季节宠物护理要点', resonance: '实用/收藏', type: '科普', idea: '仓鼠四季护理全攻略' },
      { title: '"宠物领养代替购买"公益', hook: '领养宠物的真实故事分享', resonance: '感动/共鸣', type: '公益vlog', idea: '仓鼠领养故事和注意事项' },
      { title: '宠物社交名场面', hook: '宠物之间社交互动的有趣画面', resonance: '可爱/有趣', type: '日常vlog', idea: '仓鼠见面会社交实验' },
      { title: '"宠物旅游"带宠出行攻略', hook: '带宠物出门旅行的完整攻略', resonance: '实用/向往', type: '攻略', idea: '带仓鼠外出的装备和注意事项' },
      { title: '宠物饮食科普大全', hook: '宠物能吃什么不能吃什么', resonance: '涨知识/收藏', type: '科普', idea: '仓鼠饮食红绿灯图表' },
      { title: '"宠物老年护理"专题', hook: '老年宠物的特殊护理需求', resonance: '感动/实用', type: '科普vlog', idea: '老年仓鼠护理指南' },
      { title: '宠物摄影技巧教学', hook: '怎么拍出好看的宠物照片', resonance: '实用/种草', type: '摄影教程', idea: '仓鼠微距摄影技巧' },
      { title: '"宠物年度总结"回忆杀', hook: '一年里宠物成长的精彩瞬间', resonance: '感动/怀旧', type: '年度混剪', idea: '仓鼠年度成长回顾' }
    ];

    // 随机选取12-16条
    const hCount = 12 + Math.floor(Math.random() * 5);
    const pCount = 12 + Math.floor(Math.random() * 5);
    this.hamsterHotspots[today] = [...hamsterPool].sort(() => Math.random() - 0.5).slice(0, hCount);
    this.petHotspots[today] = [...petPool].sort(() => Math.random() - 0.5).slice(0, pCount);

    Storage.set('viral_hamster', this.hamsterHotspots);
    Storage.set('viral_pet', this.petHotspots);
  },

  getTabs() {
    return [
      { id: 'hamster', name: '鼠类赛道热点库' },
      { id: 'pet', name: '综合宠物赛道热点库' },
      { id: 'scripts', name: '二创脚本素材库' },
      { id: 'benchmarks', name: '对标视频收藏夹' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'hamster') this.renderHamsterHotspot(container);
    else if (tabId === 'pet') this.renderPetHotspot(container);
    else if (tabId === 'scripts') this.renderScripts(container);
    else if (tabId === 'benchmarks') this.renderBenchmarks(container);
  },

  generateHamsterSamples() {
    const today = Storage.today();
    this.hamsterHotspots[today] = [
      { title: '仓鼠"越狱"系列爆火', hook: '记录仓鼠想方设法逃出笼子的搞笑过程', resonance: '搞笑/心疼', discuss: '评论区热议仓鼠智商到底有多高', idea: '拍摄自家鼠子越狱失败合集，配上内心独白字幕', bgm: '搞笑卡点BGM', format: '15-30秒短剧' },
      { title: '公婆鼠"一家三口"治愈日常', hook: '一对公婆鼠带宝宝的温馨画面', resonance: '治愈/萌', discuss: '讨论繁殖注意事项和幼鼠护理', idea: '记录鼠宝宝成长日记，从出生到开眼', bgm: '治愈钢琴曲', format: '1分钟vlog' },
      { title: '仓鼠吃播ASMR', hook: '近距离收音仓鼠啃瓜子的声音', resonance: '解压/舒适', discuss: '求推荐同款零食和食盆', idea: '不同零食对比吃播，测试鼠子口味偏好', bgm: '纯自然音', format: '30秒沉浸式' },
      { title: '"仓鼠跑轮极限挑战"', hook: '记录仓鼠一晚跑了多少公里', resonance: '惊讶/佩服', discuss: '讨论跑轮选购和运动量', idea: '用计数器统计仓鼠跑轮圈数换算距离', bgm: '燃向BGM', format: '快节奏混剪' }
    ];
    Storage.set('viral_hamster', this.hamsterHotspots);
  },

  generatePetSamples() {
    const today = Storage.today();
    this.petHotspots[today] = [
      { title: '猫咪"嫌弃表情"合集爆款', hook: '主人做各种事情时猫咪的嫌弃眼神', resonance: '搞笑/共鸣', type: '宠物日常vlog', idea: '适配鼠类：拍仓鼠面对新玩具的嫌弃反应' },
      { title: '宠物"第一次体验"系列', hook: '记录宠物第一次见雪/见镜子/坐车的反应', resonance: '新奇/可爱', type: '宠物日常vlog', idea: '仓鼠第一次见浴沙/外出的反应' },
      { title: '"宠物视角"第一人称拍摄', hook: '宠物身上的GoPro记录它的一天', resonance: '新奇/代入', type: '创意拍摄', idea: '仓鼠视角探索整个房间的冒险' },
      { title: '宠物用品真实测评', hook: '热门宠物用品买回来实测好不好用', resonance: '种草/避雷', type: '用品测评', idea: '仓鼠笼/跑轮/零食横评测评' },
      { title: '宠物冷知识科普辟谣', hook: '你以为对宠物好的事其实害了它', resonance: '涨知识/分享', type: '科普辟谣', idea: '仓鼠饲养常见误区辟谣' }
    ];
    Storage.set('viral_pet', this.petHotspots);
  },

  // ===== 鼠类赛道热点库 =====
  renderHamsterHotspot(container) {
    const dates = Object.keys(this.hamsterHotspots).sort().reverse();
    const list = this.hamsterHotspots[this.selectedHamsterDate] || [];

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <div class="mod-date-picker">
            <label>查看日期：</label>
            <select id="hamsterDateSelect" class="mod-select">
              ${dates.map(d => `<option value="${d}" ${d === this.selectedHamsterDate ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <span class="mod-badge">🐹 ${list.length} 条鼠类热点</span>
        </div>
        <div class="mod-cards-grid">
          ${list.length === 0
            ? '<div class="mod-empty"><div class="mod-empty-icon">📭</div><div class="mod-empty-text">当日暂无鼠类赛道热点</div></div>'
            : list.map((h, i) => `
              <div class="hotspot-card viral-card">
                <div class="hotspot-card-header">
                  <span class="hotspot-category">🐹 鼠类</span>
                </div>
                <h3 class="hotspot-title">${h.title}</h3>
                <div class="hotspot-section"><span class="hotspot-label">核心钩子</span><p class="hotspot-content">${h.hook}</p></div>
                <div class="hotspot-section"><span class="hotspot-label">观众共鸣</span><span class="hotspot-sentiment-tag">${h.resonance}</span></div>
                <div class="hotspot-section"><span class="hotspot-label">评论区方向</span><p class="hotspot-content">${h.discuss}</p></div>
                <div class="hotspot-section"><span class="hotspot-label">二创思路</span><p class="hotspot-content viral-idea">${h.idea}</p></div>
                <div class="hotspot-section"><span class="hotspot-label">推荐BGM</span><span class="hotspot-content">${h.bgm}</span></div>
                <div class="hotspot-section"><span class="hotspot-label">拍摄形式</span><span class="hotspot-content">${h.format}</span></div>
                <div class="hotspot-actions">
                  <button class="btn btn-sm btn-outline viral-save-script" data-idx="${i}">📝 存入脚本素材库</button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    `;

    const sel = document.getElementById('hamsterDateSelect');
    if (sel) sel.addEventListener('change', e => { this.selectedHamsterDate = e.target.value; this.renderHamsterHotspot(document.getElementById('contentContainer')); });

    document.querySelectorAll('.viral-save-script').forEach(btn => {
      btn.addEventListener('click', () => {
        const h = list[parseInt(btn.dataset.idx)];
        this.scripts.push({
          id: Storage.uid(), title: h.title, content: `钩子：${h.hook}\n二创思路：${h.idea}\nBGM：${h.bgm}\n形式：${h.format}`,
          tags: ['鼠类'], date: Storage.today()
        });
        Storage.set('viral_scripts', this.scripts);
        btn.textContent = '✓ 已存入';
        showToast('已存入二创脚本素材库');
      });
    });
  },

  // ===== 综合宠物赛道热点库 =====
  renderPetHotspot(container) {
    const dates = Object.keys(this.petHotspots).sort().reverse();
    const list = this.petHotspots[this.selectedPetDate] || [];

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <div class="mod-date-picker">
            <label>查看日期：</label>
            <select id="petDateSelect" class="mod-select">
              ${dates.map(d => `<option value="${d}" ${d === this.selectedPetDate ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
          </div>
          <span class="mod-badge">🐾 ${list.length} 条综合宠物热点</span>
        </div>
        <div class="mod-cards-grid">
          ${list.length === 0
            ? '<div class="mod-empty"><div class="mod-empty-icon">📭</div><div class="mod-empty-text">当日暂无综合宠物热点</div></div>'
            : list.map((h, i) => `
              <div class="hotspot-card viral-card">
                <div class="hotspot-card-header">
                  <span class="hotspot-category">🐾 ${h.type}</span>
                </div>
                <h3 class="hotspot-title">${h.title}</h3>
                <div class="hotspot-section"><span class="hotspot-label">核心钩子</span><p class="hotspot-content">${h.hook}</p></div>
                <div class="hotspot-section"><span class="hotspot-label">观众共鸣</span><span class="hotspot-sentiment-tag">${h.resonance}</span></div>
                <div class="hotspot-section"><span class="hotspot-label">改编方向</span><p class="hotspot-content viral-idea">${h.idea}</p></div>
                <div class="hotspot-actions">
                  <button class="btn btn-sm btn-outline pet-save-script" data-idx="${i}">📝 存入脚本素材库</button>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    `;

    const sel = document.getElementById('petDateSelect');
    if (sel) sel.addEventListener('change', e => { this.selectedPetDate = e.target.value; this.renderPetHotspot(document.getElementById('contentContainer')); });

    document.querySelectorAll('.pet-save-script').forEach(btn => {
      btn.addEventListener('click', () => {
        const h = list[parseInt(btn.dataset.idx)];
        this.scripts.push({
          id: Storage.uid(), title: h.title, content: `钩子：${h.hook}\n改编方向：${h.idea}\n类型：${h.type}`,
          tags: ['综合宠物'], date: Storage.today()
        });
        Storage.set('viral_scripts', this.scripts);
        btn.textContent = '✓ 已存入';
        showToast('已存入二创脚本素材库');
      });
    });
  },

  // ===== 二创脚本素材库 =====
  renderScripts(container) {
    const allTags = [...new Set(this.scripts.flatMap(s => s.tags || []))];

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addScriptBtn">+ 新增脚本</button>
          <div class="mod-tag-filter">
            <button class="mod-tag-filter-btn active" data-tag="">全部</button>
            ${allTags.map(t => `<button class="mod-tag-filter-btn" data-tag="${t}">${t}</button>`).join('')}
          </div>
          <span class="mod-hint">共 ${this.scripts.length} 条脚本素材</span>
        </div>
        ${this.scripts.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📝</div><div class="mod-empty-text">暂无脚本素材，从热点库收藏或手动新增</div></div>'
          : `<div class="mod-cards-grid">${this.scripts.slice().reverse().map(s => `
              <div class="material-card">
                <div class="material-card-header">
                  <h3 class="material-title">${s.title}</h3>
                  <div class="material-actions">
                    <button class="script-edit-btn" data-id="${s.id}">✏️</button>
                    <button class="script-del-btn" data-id="${s.id}">✕</button>
                  </div>
                </div>
                ${s.content ? `<p class="material-content">${s.content.replace(/\n/g, '<br>')}</p>` : ''}
                <div class="material-tags">${(s.tags || []).map(t => `<span class="material-tag">${t}</span>`).join('')}</div>
                <div class="material-date">${s.date || ''}</div>
              </div>
            `).join('')}</div>`
        }
      </div>
    `;

    document.getElementById('addScriptBtn').addEventListener('click', () => this.showScriptForm());
    document.querySelectorAll('.script-edit-btn').forEach(btn => btn.addEventListener('click', () => {
      const s = this.scripts.find(x => x.id === btn.dataset.id); if (s) this.showScriptForm(s);
    }));
    document.querySelectorAll('.script-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这条脚本？', () => {
        this.scripts = this.scripts.filter(s => s.id !== btn.dataset.id);
        Storage.set('viral_scripts', this.scripts);
        this.renderScripts(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
  },

  showScriptForm(existing) {
    const isEdit = !!existing;
    const body = `
      <div class="form-group"><label>标题</label><input type="text" id="sf-title" class="form-input" value="${existing ? existing.title : ''}" placeholder="脚本/选题标题" /></div>
      <div class="form-group"><label>脚本内容</label><textarea id="sf-content" class="form-textarea" rows="5" placeholder="拍摄脚本、标题文案、分镜思路...">${existing ? existing.content : ''}</textarea></div>
      <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="sf-tags" class="form-input" value="${existing ? (existing.tags || []).join(', ') : ''}" placeholder="如：鼠类, 日常科普, 测评" /></div>
    `;
    App.showModal(isEdit ? '编辑脚本' : '新增脚本', body, () => {
      const title = document.getElementById('sf-title').value.trim();
      if (!title) { showToast('请填写标题'); return false; }
      const content = document.getElementById('sf-content').value.trim();
      const tags = document.getElementById('sf-tags').value.split(',').map(t => t.trim()).filter(Boolean);
      if (isEdit) { existing.title = title; existing.content = content; existing.tags = tags; }
      else { this.scripts.push({ id: Storage.uid(), title, content, tags, date: Storage.today() }); }
      Storage.set('viral_scripts', this.scripts);
      this.renderScripts(document.getElementById('contentContainer'));
      showToast(isEdit ? '已更新' : '已新增');
    }, { maxWidth: '520px' });
  },

  // ===== 对标视频收藏夹 =====
  renderBenchmarks(container) {
    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addBenchBtn">+ 收藏对标视频</button>
          <span class="mod-hint">共 ${this.benchmarks.length} 条对标视频</span>
        </div>
        ${this.benchmarks.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📌</div><div class="mod-empty-text">暂无对标视频，点击上方按钮添加</div></div>'
          : `<div class="mod-cards-grid">${this.benchmarks.slice().reverse().map(b => `
              <div class="material-card benchmark-card">
                <div class="material-card-header">
                  <h3 class="material-title">${b.title}</h3>
                  <div class="material-actions">
                    <button class="bench-edit-btn" data-id="${b.id}">✏️</button>
                    <button class="bench-del-btn" data-id="${b.id}">✕</button>
                  </div>
                </div>
                ${b.link ? `<a class="benchmark-link" href="${b.link}" target="_blank">🔗 ${b.link}</a>` : ''}
                ${b.highlight ? `<div class="hotspot-section"><span class="hotspot-label">视频亮点</span><p class="hotspot-content">${b.highlight}</p></div>` : ''}
                ${b.idea ? `<div class="hotspot-section"><span class="hotspot-label">借鉴思路</span><p class="hotspot-content viral-idea">${b.idea}</p></div>` : ''}
                <div class="material-tags">${(b.tags || []).map(t => `<span class="material-tag">${t}</span>`).join('')}</div>
                <div class="material-date">${b.date || ''}</div>
              </div>
            `).join('')}</div>`
        }
      </div>
    `;

    document.getElementById('addBenchBtn').addEventListener('click', () => this.showBenchForm());
    document.querySelectorAll('.bench-edit-btn').forEach(btn => btn.addEventListener('click', () => {
      const b = this.benchmarks.find(x => x.id === btn.dataset.id); if (b) this.showBenchForm(b);
    }));
    document.querySelectorAll('.bench-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这条对标视频？', () => {
        this.benchmarks = this.benchmarks.filter(b => b.id !== btn.dataset.id);
        Storage.set('viral_benchmarks', this.benchmarks);
        this.renderBenchmarks(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
  },

  showBenchForm(existing) {
    const isEdit = !!existing;
    const body = `
      <div class="form-group"><label>视频标题</label><input type="text" id="bf-title" class="form-input" value="${existing ? existing.title : ''}" placeholder="对标视频标题" /></div>
      <div class="form-group"><label>视频链接</label><input type="text" id="bf-link" class="form-input" value="${existing ? existing.link : ''}" placeholder="粘贴抖音视频链接" /></div>
      <div class="form-group"><label>视频亮点</label><textarea id="bf-highlight" class="form-textarea" rows="3" placeholder="这个视频哪些地方做得好...">${existing ? existing.highlight : ''}</textarea></div>
      <div class="form-group"><label>借鉴思路</label><textarea id="bf-idea" class="form-textarea" rows="3" placeholder="可以怎么借鉴改编...">${existing ? existing.idea : ''}</textarea></div>
      <div class="form-group"><label>标签（逗号分隔）</label><input type="text" id="bf-tags" class="form-input" value="${existing ? (existing.tags || []).join(', ') : ''}" placeholder="如：鼠类, 日常vlog" /></div>
    `;
    App.showModal(isEdit ? '编辑对标视频' : '收藏对标视频', body, () => {
      const title = document.getElementById('bf-title').value.trim();
      if (!title) { showToast('请填写标题'); return false; }
      const data = {
        title,
        link: document.getElementById('bf-link').value.trim(),
        highlight: document.getElementById('bf-highlight').value.trim(),
        idea: document.getElementById('bf-idea').value.trim(),
        tags: document.getElementById('bf-tags').value.split(',').map(t => t.trim()).filter(Boolean)
      };
      if (isEdit) { Object.assign(existing, data); }
      else { this.benchmarks.push({ id: Storage.uid(), ...data, date: Storage.today() }); }
      Storage.set('viral_benchmarks', this.benchmarks);
      this.renderBenchmarks(document.getElementById('contentContainer'));
      showToast(isEdit ? '已更新' : '已收藏');
    }, { maxWidth: '520px' });
  }
};
