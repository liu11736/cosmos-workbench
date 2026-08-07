/**
 * 四级英语单词模块
 * - 四级单词汇总：全套CET-4词汇 A-Z汇总，搜索，掌握/未掌握标记
 * - 单词：每日背诵计划 + 单词卡片 + 生词本 + 进度统计
 */
const EnglishModule = {
  // 单词学习数据
  learnedWords: [],    // 已学单词索引
  unfamiliarWords: [], // 生词本（单词文本数组）
  masteredWords: [],   // 已掌握单词（单词文本数组）
  dailyNewTarget: 20,
  dailyReviewTarget: 10,
  studyDate: null,     // 当前学习日期
  dailyStudyCount: { new: 0, review: 0 }, // 今日学习进度

  // 词汇汇总搜索
  vocabSearchTerm: '',
  vocabFilter: 'all', // all | mastered | unmastered

  init() {
    this.learnedWords = Storage.get('cet4_learned', []);
    this.unfamiliarWords = Storage.get('cet4_unfamiliar', []);
    this.masteredWords = Storage.get('cet4_mastered', []);
    this.dailyNewTarget = Storage.get('cet4_daily_new', 20);
    this.dailyReviewTarget = Storage.get('cet4_daily_review', 10);
    this.studyDate = Storage.get('cet4_study_date', Storage.today());
    this.dailyStudyCount = Storage.get('cet4_study_count', { new: 0, review: 0 });

    // 如果日期变了，重置今日进度
    if (this.studyDate !== Storage.today()) {
      this.studyDate = Storage.today();
      this.dailyStudyCount = { new: 0, review: 0 };
      Storage.set('cet4_study_date', this.studyDate);
      Storage.set('cet4_study_count', this.dailyStudyCount);
    }
  },

  getTabs() {
    return [
      { id: 'vocabulary', name: '四级单词汇总' },
      { id: 'words', name: '单词' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'vocabulary') {
      this.renderVocabulary(container);
    } else if (tabId === 'words') {
      this.renderWords(container);
    }
  },

  // ===== 四级单词汇总 =====
  renderVocabulary(container) {
    const totalWords = CET4_WORDS.length;
    const masteredCount = this.masteredWords.length;
    const masteryRate = Math.round((masteredCount / totalWords) * 100);

    // 按首字母分组
    const grouped = {};
    CET4_WORDS.forEach((w, idx) => {
      const letter = w.word[0].toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push({ ...w, index: idx });
    });

    // 排序字母
    const letters = Object.keys(grouped).sort();

    // 过滤后的数据
    const searchTerm = this.vocabSearchTerm.toLowerCase().trim();
    const filterMode = this.vocabFilter;

    container.innerHTML = `
      <div class="vocab-layout">
        <!-- 统计栏 -->
        <div class="vocab-stats-bar">
          <div class="vocab-stat-card">
            <div class="vocab-stat-icon">📖</div>
            <div class="vocab-stat-info">
              <span class="vocab-stat-value">${totalWords}</span>
              <span class="vocab-stat-label">总词汇量</span>
            </div>
          </div>
          <div class="vocab-stat-card">
            <div class="vocab-stat-icon">✅</div>
            <div class="vocab-stat-info">
              <span class="vocab-stat-value">${masteredCount}</span>
              <span class="vocab-stat-label">已掌握</span>
            </div>
          </div>
          <div class="vocab-stat-card">
            <div class="vocab-stat-icon">📈</div>
            <div class="vocab-stat-info">
              <span class="vocab-stat-value">${masteryRate}%</span>
              <span class="vocab-stat-label">掌握率</span>
            </div>
          </div>
          <div class="vocab-stat-card">
            <div class="vocab-stat-icon">📌</div>
            <div class="vocab-stat-info">
              <span class="vocab-stat-value">${totalWords - masteredCount}</span>
              <span class="vocab-stat-label">未掌握</span>
            </div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="vocab-progress-bar">
          <div class="vocab-progress-track">
            <div class="vocab-progress-fill" style="width:${masteryRate}%"></div>
          </div>
          <span class="vocab-progress-text">${masteredCount} / ${totalWords} 已掌握</span>
        </div>

        <!-- 搜索与过滤 -->
        <div class="vocab-toolbar">
          <div class="vocab-search-box">
            <span class="vocab-search-icon">🔍</span>
            <input type="text" id="vocabSearchInput" placeholder="输入单词或中文意思搜索..." value="${this.vocabSearchTerm}" />
            ${this.vocabSearchTerm ? '<button class="vocab-search-clear" id="vocabSearchClear">✕</button>' : ''}
          </div>
          <div class="vocab-filter-group">
            <button class="vocab-filter-btn ${filterMode === 'all' ? 'active' : ''}" data-filter="all">全部</button>
            <button class="vocab-filter-btn ${filterMode === 'mastered' ? 'active' : ''}" data-filter="mastered">已掌握</button>
            <button class="vocab-filter-btn ${filterMode === 'unmastered' ? 'active' : ''}" data-filter="unmastered">未掌握</button>
          </div>
        </div>

        <!-- 字母索引 -->
        <div class="vocab-letter-index" id="vocabLetterIndex">
          ${letters.map(l => {
            const count = grouped[l].length;
            return `<button class="vocab-letter-btn" data-letter="${l}">${l}<span class="vocab-letter-count">${count}</span></button>`;
          }).join('')}
        </div>

        <!-- 词汇列表 -->
        <div class="vocab-list" id="vocabList">
          ${this.renderVocabList(grouped, letters, searchTerm, filterMode)}
        </div>
      </div>
    `;

    this.bindVocabularyEvents();
  },

  renderVocabList(grouped, letters, searchTerm, filterMode) {
    let totalShown = 0;
    const html = letters.map(letter => {
      let words = grouped[letter];

      // 搜索过滤
      if (searchTerm) {
        words = words.filter(w =>
          w.word.toLowerCase().includes(searchTerm) ||
          w.meaning.toLowerCase().includes(searchTerm)
        );
      }

      // 掌握状态过滤
      if (filterMode === 'mastered') {
        words = words.filter(w => this.masteredWords.includes(w.word));
      } else if (filterMode === 'unmastered') {
        words = words.filter(w => !this.masteredWords.includes(w.word));
      }

      if (words.length === 0) return '';

      totalShown += words.length;

      return `
        <div class="vocab-letter-group" id="letter-${letter}">
          <div class="vocab-letter-header">
            <span class="vocab-letter-badge">${letter}</span>
            <span class="vocab-letter-label">${words.length} 词</span>
          </div>
          <div class="vocab-cards-grid">
            ${words.map(w => {
              const isMastered = this.masteredWords.includes(w.word);
              return `
                <div class="vocab-word-card ${isMastered ? 'mastered' : ''}" data-word="${w.word}" data-index="${w.index}">
                  <div class="vocab-word-card-top">
                    <div class="vocab-word-info">
                      <span class="vocab-word-text">${w.word}</span>
                      ${w.phonetic ? `<span class="vocab-word-phonetic">${w.phonetic}</span>` : ''}
                    </div>
                    <button class="vocab-speak-btn" data-word="${w.word}" title="发音">🔊</button>
                  </div>
                  <div class="vocab-word-meaning">${w.meaning}</div>
                  <div class="vocab-word-card-bottom">
                    <span class="vocab-word-pos">${w.pos}</span>
                    <label class="vocab-master-label" data-word="${w.word}">
                      <input type="checkbox" class="vocab-master-check" data-word="${w.word}" ${isMastered ? 'checked' : ''} />
                      <span class="vocab-master-text">${isMastered ? '已掌握' : '标记掌握'}</span>
                    </label>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    if (totalShown === 0) {
      return '<div class="vocab-empty"><div class="vocab-empty-icon">🔍</div><div class="vocab-empty-text">没有找到匹配的单词</div></div>';
    }

    return html;
  },

  bindVocabularyEvents() {
    // 搜索输入
    const searchInput = document.getElementById('vocabSearchInput');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.vocabSearchTerm = e.target.value;
          this.renderVocabulary(document.getElementById('contentContainer'));
          // 恢复焦点
          const newInput = document.getElementById('vocabSearchInput');
          if (newInput) {
            newInput.focus();
            newInput.setSelectionRange(newInput.value.length, newInput.value.length);
          }
        }, 250);
      });
    }

    // 清除搜索
    const clearBtn = document.getElementById('vocabSearchClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.vocabSearchTerm = '';
        this.renderVocabulary(document.getElementById('contentContainer'));
        const newInput = document.getElementById('vocabSearchInput');
        if (newInput) newInput.focus();
      });
    }

    // 过滤按钮
    document.querySelectorAll('.vocab-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.vocabFilter = btn.dataset.filter;
        this.renderVocabulary(document.getElementById('contentContainer'));
      });
    });

    // 字母索引跳转
    document.querySelectorAll('.vocab-letter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const letter = btn.dataset.letter;
        const target = document.getElementById(`letter-${letter}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // 发音按钮
    document.querySelectorAll('.vocab-speak-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speakWord(btn.dataset.word);
      });
    });

    // 掌握勾选
    document.querySelectorAll('.vocab-master-check').forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const word = cb.dataset.word;
        const label = cb.nextElementSibling;
        const card = cb.closest('.vocab-word-card');

        if (cb.checked) {
          if (!this.masteredWords.includes(word)) {
            this.masteredWords.push(word);
          }
          card.classList.add('mastered');
          label.querySelector('.vocab-master-text').textContent = '已掌握';
          showToast('✅ 已标记为掌握');
        } else {
          this.masteredWords = this.masteredWords.filter(w => w !== word);
          card.classList.remove('mastered');
          label.querySelector('.vocab-master-text').textContent = '标记掌握';
          showToast('已取消掌握标记');
        }
        Storage.set('cet4_mastered', this.masteredWords);

        // 更新统计数字（不重渲染整个页面，避免滚动位置丢失）
        this.updateVocabStats();
      });
    });

    // 点击单词卡片显示详情
    document.querySelectorAll('.vocab-word-card').forEach(card => {
      card.addEventListener('click', (e) => {
        // 不响应勾选框和发音按钮的点击
        if (e.target.closest('.vocab-speak-btn') || e.target.closest('.vocab-master-label')) return;
        const word = card.dataset.word;
        this.showWordDetail(word);
      });
    });
  },

  updateVocabStats() {
    const totalWords = CET4_WORDS.length;
    const masteredCount = this.masteredWords.length;
    const masteryRate = Math.round((masteredCount / totalWords) * 100);

    const values = document.querySelectorAll('.vocab-stat-value');
    if (values.length >= 4) {
      values[0].textContent = totalWords;
      values[1].textContent = masteredCount;
      values[2].textContent = masteryRate + '%';
      values[3].textContent = totalWords - masteredCount;
    }

    const fill = document.querySelector('.vocab-progress-fill');
    if (fill) fill.style.width = masteryRate + '%';

    const text = document.querySelector('.vocab-progress-text');
    if (text) text.textContent = `${masteredCount} / ${totalWords} 已掌握`;
  },

  // ===== 单词（每日背诵） =====
  renderWords(container) {
    const totalWords = CET4_WORDS.length;
    const learnedCount = this.learnedWords.length;
    const progress = Math.round((learnedCount / totalWords) * 100);
    const todayNew = this.dailyStudyCount.new;
    const todayReview = this.dailyStudyCount.review;

    // 今日新词列表
    const startIdx = learnedCount;
    const todayNewWords = CET4_WORDS.slice(startIdx, startIdx + this.dailyNewTarget);
    // 复习词列表（从已学词中随机抽取）
    const reviewPool = this.learnedWords.map(i => CET4_WORDS[i]).filter(Boolean);
    const todayReviewWords = this.shuffleArray(reviewPool).slice(0, this.dailyReviewTarget);

    container.innerHTML = `
      <div class="words-layout">
        <div class="words-stats-bar">
          <div class="stat-card">
            <div class="stat-icon">📖</div>
            <div class="stat-info">
              <span class="stat-value">${learnedCount}</span>
              <span class="stat-label">累计背诵</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-info">
              <span class="stat-value">${progress}%</span>
              <span class="stat-label">完成进度</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-info">
              <span class="stat-value">${this.unfamiliarWords.length}</span>
              <span class="stat-label">生词本</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-info">
              <span class="stat-value">${todayNew}/${this.dailyNewTarget}</span>
              <span class="stat-label">今日新词</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔄</div>
            <div class="stat-info">
              <span class="stat-value">${todayReview}/${this.dailyReviewTarget}</span>
              <span class="stat-label">今日复习</span>
            </div>
          </div>
        </div>

        <div class="progress-bar-container">
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${progress}%"></div>
          </div>
          <span class="progress-text">${learnedCount} / ${totalWords} 词</span>
        </div>

        <div class="words-main-area">
          <div class="words-cards-section">
            <div class="words-section-header">
              <h3 class="card-title">📚 今日新词 (${todayNewWords.length}个)</h3>
              <div class="words-section-actions">
                <button class="btn btn-outline btn-sm" id="speakAllNewBtn">🔊 朗读全部</button>
              </div>
            </div>
            <div class="word-cards-grid" id="newWordsGrid">
              ${todayNewWords.length === 0
                ? '<div class="empty-state"><div class="empty-state-icon">🎉</div><div class="empty-state-text">所有单词已学完！去复习吧</div></div>'
                : todayNewWords.map((w, i) => this.renderWordCard(w, startIdx + i, 'new')).join('')}
            </div>

            ${todayReviewWords.length > 0 ? `
              <div class="words-section-header" style="margin-top:24px">
                <h3 class="card-title">🔄 今日复习 (${todayReviewWords.length}个)</h3>
                <button class="btn btn-outline btn-sm" id="speakAllReviewBtn">🔊 朗读全部</button>
              </div>
              <div class="word-cards-grid" id="reviewWordsGrid">
                ${todayReviewWords.map((w) => this.renderWordCard(w, CET4_WORDS.indexOf(w), 'review')).join('')}
              </div>
            ` : ''}
          </div>

          <div class="wordbook-section">
            <div class="card">
              <h3 class="card-title">📖 生词本 (${this.unfamiliarWords.length})</h3>
              ${this.unfamiliarWords.length === 0
                ? '<div class="empty-state"><div class="empty-state-text">暂无生词，学习时点击"+生词本"收藏</div></div>'
                : `<div class="wordbook-list" id="wordbookList">
                    ${this.unfamiliarWords.map(word => {
                      const w = CET4_WORDS.find(x => x.word === word);
                      if (!w) return '';
                      return `
                        <div class="wordbook-item">
                          <div class="wordbook-info">
                            <span class="wordbook-word">${w.word}</span>
                            <span class="wordbook-meaning">${w.meaning}</span>
                          </div>
                          <div class="wordbook-actions">
                            <button class="wordbook-speak-btn" data-word="${w.word}">🔊</button>
                            <button class="wordbook-remove-btn" data-word="${w.word}">✕</button>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>`
              }
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindWordEvents();
  },

  renderWordCard(word, index, type) {
    const isLearned = type === 'new' ? this.learnedWords.includes(index) : false;
    const isUnfamiliar = this.unfamiliarWords.includes(word.word);
    return `
      <div class="word-card" data-word="${word.word}" data-index="${index}" data-type="${type}">
        <div class="word-card-header">
          <div class="word-card-word">${word.word}</div>
          <button class="word-speak-btn" data-word="${word.word}">🔊</button>
        </div>
        ${word.phonetic ? `<div class="word-card-phonetic">${word.phonetic}</div>` : ''}
        <div class="word-card-pos">${word.pos}</div>
        <div class="word-card-meaning">${word.meaning}</div>
        ${word.example ? `<div class="word-card-example">${word.example}</div>` : ''}
        <div class="word-card-actions">
          <label class="word-check-label">
            <input type="checkbox" class="word-check" data-index="${index}" data-type="${type}" ${isLearned ? 'checked' : ''} />
            <span>${type === 'new' ? '已背诵' : '已复习'}</span>
          </label>
          <button class="btn btn-sm ${isUnfamiliar ? 'btn-primary' : 'btn-outline'} word-familiar-btn" data-word="${word.word}">
            ${isUnfamiliar ? '✓ 已收藏' : '+ 生词本'}
          </button>
        </div>
      </div>
    `;
  },

  bindWordEvents() {
    // 单词发音
    document.querySelectorAll('.word-speak-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speakWord(btn.dataset.word);
      });
    });

    // 生词本发音
    document.querySelectorAll('.wordbook-speak-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.speakWord(btn.dataset.word);
      });
    });

    // 移除生词
    document.querySelectorAll('.wordbook-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = btn.dataset.word;
        this.unfamiliarWords = this.unfamiliarWords.filter(w => w !== word);
        Storage.set('cet4_unfamiliar', this.unfamiliarWords);
        this.renderWords(document.getElementById('contentContainer'));
        showToast('已从生词本移除');
      });
    });

    // 打卡勾选
    document.querySelectorAll('.word-check').forEach(cb => {
      cb.addEventListener('change', (e) => {
        e.stopPropagation();
        const index = parseInt(cb.dataset.index);
        const type = cb.dataset.type;
        if (cb.checked) {
          if (type === 'new' && !this.learnedWords.includes(index)) {
            this.learnedWords.push(index);
            this.dailyStudyCount.new++;
            Storage.set('cet4_learned', this.learnedWords);
            Storage.set('cet4_study_count', this.dailyStudyCount);
            showToast('✅ 已标记为背诵完成');
          } else if (type === 'review') {
            this.dailyStudyCount.review++;
            Storage.set('cet4_study_count', this.dailyStudyCount);
            showToast('✅ 已标记为复习完成');
          }
        } else {
          if (type === 'new') {
            this.learnedWords = this.learnedWords.filter(i => i !== index);
            this.dailyStudyCount.new = Math.max(0, this.dailyStudyCount.new - 1);
            Storage.set('cet4_learned', this.learnedWords);
            Storage.set('cet4_study_count', this.dailyStudyCount);
          } else if (type === 'review') {
            this.dailyStudyCount.review = Math.max(0, this.dailyStudyCount.review - 1);
            Storage.set('cet4_study_count', this.dailyStudyCount);
          }
        }
        // 更新统计但不重渲染整个页面
        this.updateWordStats();
      });
    });

    // 加入/移除生词本
    document.querySelectorAll('.word-familiar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const word = btn.dataset.word;
        if (this.unfamiliarWords.includes(word)) {
          this.unfamiliarWords = this.unfamiliarWords.filter(w => w !== word);
          showToast('已从生词本移除');
        } else {
          this.unfamiliarWords.push(word);
          showToast('已加入生词本');
        }
        Storage.set('cet4_unfamiliar', this.unfamiliarWords);
        this.renderWords(document.getElementById('contentContainer'));
      });
    });

    // 朗读全部新词
    const speakAllNew = document.getElementById('speakAllNewBtn');
    if (speakAllNew) {
      speakAllNew.addEventListener('click', () => {
        const startIdx = this.learnedWords.length;
        const words = CET4_WORDS.slice(startIdx, startIdx + this.dailyNewTarget);
        this.speakWordsSequentially(words.map(w => w.word));
      });
    }

    // 朗读全部复习词
    const speakAllReview = document.getElementById('speakAllReviewBtn');
    if (speakAllReview) {
      speakAllReview.addEventListener('click', () => {
        const reviewPool = this.learnedWords.map(i => CET4_WORDS[i]).filter(Boolean);
        const words = this.shuffleArray(reviewPool).slice(0, this.dailyReviewTarget);
        this.speakWordsSequentially(words.map(w => w.word));
      });
    }
  },

  updateWordStats() {
    const totalWords = CET4_WORDS.length;
    const learnedCount = this.learnedWords.length;
    const progress = Math.round((learnedCount / totalWords) * 100);
    const todayNew = this.dailyStudyCount.new;
    const todayReview = this.dailyStudyCount.review;

    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 5) {
      statValues[0].textContent = learnedCount;
      statValues[1].textContent = progress + '%';
      statValues[2].textContent = this.unfamiliarWords.length;
      statValues[3].textContent = `${todayNew}/${this.dailyNewTarget}`;
      statValues[4].textContent = `${todayReview}/${this.dailyReviewTarget}`;
    }

    const fill = document.querySelector('.progress-bar-fill');
    if (fill) fill.style.width = progress + '%';

    const progressText = document.querySelector('.progress-text');
    if (progressText) progressText.textContent = `${learnedCount} / ${totalWords} 词`;
  },

  speakWord(word, rate) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(word);
      utter.lang = 'en-US';
      utter.rate = rate || 1;
      window.speechSynthesis.speak(utter);
    }
  },

  speakWordsSequentially(words) {
    if (!('speechSynthesis' in window) || words.length === 0) return;
    window.speechSynthesis.cancel();
    let idx = 0;
    const speakNext = () => {
      if (idx >= words.length) return;
      const utter = new SpeechSynthesisUtterance(words[idx]);
      utter.lang = 'en-US';
      utter.rate = 1;
      utter.onend = () => { idx++; speakNext(); };
      window.speechSynthesis.speak(utter);
    };
    speakNext();
  },

  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  showWordDetail(word) {
    const lowerWord = word.toLowerCase();
    // 在CET4词汇中查找
    const cet4Word = CET4_WORDS.find(w => w.word.toLowerCase() === lowerWord);

    const content = `
      <div class="word-detail-modal">
        <div class="word-detail-header">
          <h2 class="word-detail-word">${word}</h2>
          <button class="btn btn-primary btn-sm" id="modalSpeakBtn">🔊 发音</button>
        </div>
        ${cet4Word ? `
          <div class="word-detail-section">
            <div class="word-detail-phonetic">
              <span>音标: ${cet4Word.phonetic || '暂无'}</span>
            </div>
            <div class="word-detail-pos">${cet4Word.pos}</div>
            <div class="word-detail-meaning">${cet4Word.meaning}</div>
          </div>
          ${cet4Word.example ? `
          <div class="word-detail-example">
            <strong>例句：</strong>${cet4Word.example}
          </div>` : ''}
        ` : `
          <div class="word-detail-section">
            <p class="word-detail-meaning">该词不在四级词汇表中，但你可以手动添加到生词本</p>
          </div>
        `}
        <div class="word-detail-actions">
          <button class="btn btn-outline btn-sm" id="modalAddWordBtn">+ 加入生词本</button>
        </div>
      </div>
    `;

    App.showModal(`单词详情: ${word}`, content, () => {
      // 确认按钮关闭
    });

    setTimeout(() => {
      const speakBtn = document.getElementById('modalSpeakBtn');
      if (speakBtn) {
        speakBtn.addEventListener('click', () => this.speakWord(word));
      }
      const addBtn = document.getElementById('modalAddWordBtn');
      if (addBtn) {
        addBtn.addEventListener('click', () => {
          if (!this.unfamiliarWords.includes(word)) {
            this.unfamiliarWords.push(word);
            Storage.set('cet4_unfamiliar', this.unfamiliarWords);
            showToast('已加入生词本');
          } else {
            showToast('已在生词本中');
          }
        });
      }
    }, 50);
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
