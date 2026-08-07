/**
 * 宠物饲养管理模块
 * - 宠物总览：卡片展示 + 档案录入
 * - 饲养记录：体重/驱虫/疫苗/饮食/洗护
 * - 健康台账：异常状况记录
 * - 宠物日记：图文日记
 */
const PetsModule = {
  pets: [],          // [{id, name, breed, gender, birthDate, arrivalDate, avatar, bio}]
  petRecords: {},    // { petId: { weight: [], deworming: [], vaccine: [], diet: [], grooming: [] } }
  healthRecords: {}, // { petId: [{id, date, type, description, notes}] }
  diaries: [],       // [{id, petId, date, type, content, photos: []}]
  selectedPetId: null,

  init() {
    this.pets = Storage.get('pets', []);
    this.petRecords = Storage.get('pet_records', {});
    this.healthRecords = Storage.get('pet_health', {});
    this.diaries = Storage.get('pet_diaries', []);
  },

  getTabs() {
    return [
      { id: 'overview', name: '宠物总览' },
      { id: 'records', name: '饲养记录' },
      { id: 'health', name: '健康台账' },
      { id: 'diary', name: '宠物日记' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'overview') this.renderOverview(container);
    else if (tabId === 'records') this.renderRecords(container);
    else if (tabId === 'health') this.renderHealth(container);
    else if (tabId === 'diary') this.renderDiary(container);
  },

  // ===== 宠物总览 =====
  renderOverview(container) {
    container.innerHTML = `
      <div class="pets-overview">
        <div class="pets-toolbar">
          <div class="pets-quick-icons">
            <button class="quick-icon-btn" data-action="diary" title="日记">📔</button>
            <button class="quick-icon-btn" data-action="weight" title="体重">⚖️</button>
            <button class="quick-icon-btn" data-action="deworming" title="驱虫">💊</button>
            <button class="quick-icon-btn" data-action="vaccine" title="疫苗">💉</button>
            <button class="quick-icon-btn" data-action="diet" title="饮食">🍽️</button>
            <button class="quick-icon-btn" data-action="grooming" title="洗护">🛁</button>
          </div>
          <button class="btn btn-primary btn-sm" id="addPetBtn">+ 新增宠物</button>
        </div>

        <div class="pets-cards-grid" id="petsCardsGrid">
          ${this.pets.length === 0
            ? '<div class="empty-state"><div class="empty-state-icon">🐱</div><div class="empty-state-text">还没有宠物档案，点击"新增宠物"开始记录</div></div>'
            : this.pets.map(pet => this.renderPetCard(pet)).join('')
          }
        </div>
      </div>
    `;

    this.bindOverviewEvents();
  },

  renderPetCard(pet) {
    const age = this.calcAge(pet.birthDate);
    const companionDays = pet.arrivalDate ? this.calcDays(pet.arrivalDate) : 0;
    const genderIcon = pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : '?';

    return `
      <div class="pet-card" data-pet-id="${pet.id}">
        <div class="pet-card-avatar" style="${pet.avatar ? `background-image:url(${pet.avatar})` : ''}">
          ${pet.avatar ? '' : '🐾'}
        </div>
        <div class="pet-card-body">
          <div class="pet-card-header">
            <h3 class="pet-card-name">${this.escapeHtml(pet.name)}</h3>
            <span class="pet-card-gender ${pet.gender}">${genderIcon}</span>
          </div>
          <div class="pet-card-info">
            <span>品种: ${this.escapeHtml(pet.breed || '未填写')}</span>
            <span>出生: ${pet.birthDate || '未填写'}</span>
            <span>年龄: ${age}</span>
            <span>到家: ${pet.arrivalDate || '未填写'}</span>
            <span>陪伴: ${companionDays} 天</span>
          </div>
          ${pet.bio ? `<p class="pet-card-bio">"${this.escapeHtml(pet.bio)}"</p>` : ''}
          <div class="pet-card-actions">
            <button class="btn btn-outline btn-sm pet-detail-btn" data-id="${pet.id}">详情</button>
            <button class="btn btn-outline btn-sm pet-weight-btn" data-id="${pet.id}">⚖️ 体重</button>
            <button class="btn btn-outline btn-sm pet-edit-btn" data-id="${pet.id}">编辑</button>
            <button class="btn btn-danger btn-sm pet-delete-btn" data-id="${pet.id}">删除</button>
          </div>
        </div>
      </div>
    `;
  },

  bindOverviewEvents() {
    document.getElementById('addPetBtn').addEventListener('click', () => {
      this.showPetForm();
    });

    document.querySelectorAll('.pet-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPetDetail(btn.dataset.id);
      });
    });

    document.querySelectorAll('.pet-weight-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectedPetId = btn.dataset.id;
        App.switchTab('pets', 'records');
      });
    });

    document.querySelectorAll('.pet-edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.showPetForm(btn.dataset.id);
      });
    });

    document.querySelectorAll('.pet-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deletePet(btn.dataset.id);
      });
    });

    document.querySelectorAll('.pet-card').forEach(card => {
      card.addEventListener('click', () => {
        this.showPetDetail(card.dataset.petId);
      });
    });

    // 快捷图标
    document.querySelectorAll('.quick-icon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (this.pets.length === 0) {
          showToast('请先添加宠物');
          return;
        }
        if (action === 'diary') {
          App.switchTab('pets', 'diary');
        } else {
          this.selectedPetId = this.selectedPetId || this.pets[0].id;
          App.switchTab('pets', 'records');
        }
      });
    });
  },

  showPetForm(petId) {
    const pet = petId ? this.pets.find(p => p.id === petId) : null;
    const content = `
      <div class="form-group">
        <label class="form-label">宠物头像</label>
        <div class="avatar-upload-area" id="avatarUpload">
          ${pet?.avatar ? `<img src="${pet.avatar}" class="avatar-preview" />` : '<span class="avatar-placeholder">📸 点击上传</span>'}
        </div>
        <input type="file" id="avatarInput" accept="image/*" style="display:none" />
      </div>
      <div class="form-group">
        <label class="form-label">名称 *</label>
        <input type="text" class="input-field" id="petName" value="${pet?.name || ''}" placeholder="宠物名字" />
      </div>
      <div class="form-group">
        <label class="form-label">性别</label>
        <select class="input-field" id="petGender">
          <option value="male" ${pet?.gender === 'male' ? 'selected' : ''}>公 ♂</option>
          <option value="female" ${pet?.gender === 'female' ? 'selected' : ''}>母 ♀</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">品种</label>
        <input type="text" class="input-field" id="petBreed" value="${pet?.breed || ''}" placeholder="如：英短、金毛、布偶..." />
      </div>
      <div class="form-group">
        <label class="form-label">出生日期</label>
        <input type="date" class="input-field" id="petBirthDate" value="${pet?.birthDate || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">到家日期</label>
        <input type="date" class="input-field" id="petArrivalDate" value="${pet?.arrivalDate || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">个性签名</label>
        <textarea class="input-field" id="petBio" placeholder="一句话描述你的宠物...">${pet?.bio || ''}</textarea>
      </div>
    `;

    let avatarData = pet?.avatar || null;

    App.showModal(petId ? '编辑宠物档案' : '新增宠物档案', content, () => {
      const name = document.getElementById('petName').value.trim();
      if (!name) { showToast('请输入宠物名称'); return false; }

      const data = {
        name,
        gender: document.getElementById('petGender').value,
        breed: document.getElementById('petBreed').value.trim(),
        birthDate: document.getElementById('petBirthDate').value,
        arrivalDate: document.getElementById('petArrivalDate').value,
        bio: document.getElementById('petBio').value.trim(),
        avatar: avatarData
      };

      if (petId) {
        Object.assign(pet, data);
        showToast('档案已更新');
      } else {
        const newPet = { id: Storage.uid(), ...data };
        this.pets.push(newPet);
        this.petRecords[newPet.id] = { weight: [], deworming: [], vaccine: [], diet: [], grooming: [] };
        this.healthRecords[newPet.id] = [];
        Storage.set('pet_records', this.petRecords);
        Storage.set('pet_health', this.healthRecords);
        showToast('宠物档案已创建');
      }
      Storage.set('pets', this.pets);
      this.renderOverview(document.getElementById('contentContainer'));
    });

    // 头像上传
    setTimeout(() => {
      const uploadArea = document.getElementById('avatarUpload');
      const avatarInput = document.getElementById('avatarInput');
      uploadArea.addEventListener('click', () => avatarInput.click());
      avatarInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            avatarData = ev.target.result;
            uploadArea.innerHTML = `<img src="${avatarData}" class="avatar-preview" />`;
          };
          reader.readAsDataURL(file);
        }
      });
    }, 50);
  },

  deletePet(id) {
    App.showConfirm('确认删除这只宠物档案？所有相关记录也会删除。', () => {
      this.pets = this.pets.filter(p => p.id !== id);
      delete this.petRecords[id];
      delete this.healthRecords[id];
      this.diaries = this.diaries.filter(d => d.petId !== id);
      Storage.set('pets', this.pets);
      Storage.set('pet_records', this.petRecords);
      Storage.set('pet_health', this.healthRecords);
      Storage.set('pet_diaries', this.diaries);
      if (this.selectedPetId === id) this.selectedPetId = null;
      this.renderOverview(document.getElementById('contentContainer'));
      showToast('已删除');
    });
  },

  showPetDetail(id) {
    const pet = this.pets.find(p => p.id === id);
    if (!pet) return;
    this.selectedPetId = id;
    App.switchTab('pets', 'records');
  },

  // ===== 饲养记录 =====
  renderRecords(container) {
    if (this.pets.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🐾</div><div class="empty-state-text">请先在"宠物总览"添加宠物</div></div>';
      return;
    }

    if (!this.selectedPetId || !this.pets.find(p => p.id === this.selectedPetId)) {
      this.selectedPetId = this.pets[0].id;
    }

    const pet = this.pets.find(p => p.id === this.selectedPetId);
    const records = this.petRecords[this.selectedPetId] || { weight: [], deworming: [], vaccine: [], diet: [], grooming: [] };

    container.innerHTML = `
      <div class="pet-records-layout">
        <div class="pet-selector-bar">
          <select class="input-field pet-select" id="petSelect">
            ${this.pets.map(p => `<option value="${p.id}" ${p.id === this.selectedPetId ? 'selected' : ''}>${this.escapeHtml(p.name)}</option>`).join('')}
          </select>
        </div>

        <div class="records-sections">
          <!-- 体重记录 -->
          <div class="card record-section">
            <div class="record-section-header">
              <h3 class="card-title">⚖️ 体重记录</h3>
              <button class="btn btn-outline btn-sm add-weight-btn">+ 添加</button>
            </div>
            <div id="weightChartContainer"></div>
            <div class="record-list" id="weightList"></div>
          </div>

          <!-- 驱虫记录 -->
          <div class="card record-section">
            <div class="record-section-header">
              <h3 class="card-title">💊 驱虫记录</h3>
              <button class="btn btn-outline btn-sm add-deworming-btn">+ 添加</button>
            </div>
            <div class="record-table" id="dewormingList"></div>
          </div>

          <!-- 疫苗记录 -->
          <div class="card record-section">
            <div class="record-section-header">
              <h3 class="card-title">💉 疫苗记录</h3>
              <button class="btn btn-outline btn-sm add-vaccine-btn">+ 添加</button>
            </div>
            <div class="record-table" id="vaccineList"></div>
          </div>

          <!-- 饮食记录 -->
          <div class="card record-section">
            <div class="record-section-header">
              <h3 class="card-title">🍽️ 饮食记录</h3>
              <button class="btn btn-outline btn-sm add-diet-btn">+ 添加</button>
            </div>
            <div class="record-table" id="dietList"></div>
          </div>

          <!-- 洗护记录 -->
          <div class="card record-section">
            <div class="record-section-header">
              <h3 class="card-title">🛁 洗护记录</h3>
              <button class="btn btn-outline btn-sm add-grooming-btn">+ 添加</button>
            </div>
            <div class="record-table" id="groomingList"></div>
          </div>
        </div>
      </div>
    `;

    this.renderWeightChart(records.weight);
    this.renderRecordList('weight', records.weight);
    this.renderRecordList('deworming', records.deworming);
    this.renderRecordList('vaccine', records.vaccine);
    this.renderRecordList('diet', records.diet);
    this.renderRecordList('grooming', records.grooming);
    this.bindRecordsEvents();
  },

  renderWeightChart(weights) {
    const container = document.getElementById('weightChartContainer');
    if (!container) return;
    if (weights.length < 2) {
      container.innerHTML = '<div class="chart-placeholder">至少2条记录才能生成折线图</div>';
      return;
    }

    const sorted = [...weights].sort((a, b) => new Date(a.date) - new Date(b.date));
    const w = 500, h = 160, pad = 40;
    const values = sorted.map(s => parseFloat(s.value));
    const minV = Math.min(...values) - 0.5;
    const maxV = Math.max(...values) + 0.5;
    const range = maxV - minV || 1;

    const points = sorted.map((s, i) => {
      const x = pad + (i / (sorted.length - 1)) * (w - pad * 2);
      const y = h - pad - ((parseFloat(s.value) - minV) / range) * (h - pad * 2);
      return { x, y, value: s.value, date: s.date };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaD = pathD + ` L ${points[points.length - 1].x.toFixed(1)} ${h - pad} L ${points[0].x.toFixed(1)} ${h - pad} Z`;

    container.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" class="weight-chart">
        <defs>
          <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#8B9D83" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#8B9D83" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${areaD}" fill="url(#weightGradient)" />
        <path d="${pathD}" fill="none" stroke="#8B9D83" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
        ${points.map(p => `
          <g class="chart-point">
            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#8B9D83" />
            <text x="${p.x}" y="${p.y - 10}" text-anchor="middle" font-size="11" fill="#5C5248">${p.value}kg</text>
            <text x="${p.x}" y="${h - 15}" text-anchor="middle" font-size="10" fill="#ADA49A">${p.date.slice(5)}</text>
          </g>
        `).join('')}
        <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#D8D2C9" stroke-width="1" />
      </svg>
    `;
  },

  renderRecordList(type, list) {
    const ids = {
      weight: 'weightList', deworming: 'dewormingList', vaccine: 'vaccineList',
      diet: 'dietList', grooming: 'groomingList'
    };
    const container = document.getElementById(ids[type]);
    if (!container) return;

    if (!list || list.length === 0) {
      container.innerHTML = '<div class="empty-state-text">暂无记录</div>';
      return;
    }

    const sorted = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (type === 'weight') {
      container.innerHTML = sorted.map(r => `
        <div class="record-item">
          <span class="record-date">${r.date}</span>
          <span class="record-value">${r.value} kg</span>
          ${r.note ? `<span class="record-note">${this.escapeHtml(r.note)}</span>` : ''}
          <button class="task-action-btn delete-record-btn" data-type="${type}" data-id="${r.id}">✕</button>
        </div>
      `).join('');
    } else {
      const fields = {
        deworming: [
          { key: 'date', label: '日期' },
          { key: 'drug', label: '药品' },
          { key: 'type', label: '类型' },
          { key: 'note', label: '备注' }
        ],
        vaccine: [
          { key: 'date', label: '接种日期' },
          { key: 'name', label: '疫苗种类' },
          { key: 'nextDate', label: '下次到期' },
          { key: 'note', label: '备注' }
        ],
        diet: [
          { key: 'date', label: '日期' },
          { key: 'food', label: '粮品' },
          { key: 'amount', label: '食量' },
          { key: 'supplement', label: '辅食' }
        ],
        grooming: [
          { key: 'date', label: '日期' },
          { key: 'type', label: '类型' },
          { key: 'note', label: '备注' }
        ]
      };

      const cols = fields[type];
      container.innerHTML = `
        <table class="record-table-inner">
          <thead><tr>${cols.map(c => `<th>${c.label}</th>`).join('')}<th></th></tr></thead>
          <tbody>
            ${sorted.map(r => `
              <tr>
                ${cols.map(c => `<td>${this.escapeHtml(r[c.key] || '-')}</td>`).join('')}
                <td><button class="task-action-btn delete-record-btn" data-type="${type}" data-id="${r.id}">✕</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    container.querySelectorAll('.delete-record-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deleteRecord(btn.dataset.type, btn.dataset.id);
      });
    });
  },

  bindRecordsEvents() {
    document.getElementById('petSelect').addEventListener('change', (e) => {
      this.selectedPetId = e.target.value;
      this.renderRecords(document.getElementById('contentContainer'));
    });

    const addButtons = {
      '.add-weight-btn': () => this.showRecordForm('weight'),
      '.add-deworming-btn': () => this.showRecordForm('deworming'),
      '.add-vaccine-btn': () => this.showRecordForm('vaccine'),
      '.add-diet-btn': () => this.showRecordForm('diet'),
      '.add-grooming-btn': () => this.showRecordForm('grooming')
    };

    Object.entries(addButtons).forEach(([sel, fn]) => {
      const btn = document.querySelector(sel);
      if (btn) btn.addEventListener('click', fn);
    });
  },

  showRecordForm(type) {
    const titles = {
      weight: '添加体重记录', deworming: '添加驱虫记录', vaccine: '添加疫苗记录',
      diet: '添加饮食记录', grooming: '添加洗护记录'
    };

    const fields = {
      weight: `
        <div class="form-group"><label class="form-label">日期 *</label><input type="date" class="input-field" id="rec_date" value="${Storage.today()}" /></div>
        <div class="form-group"><label class="form-label">体重 (kg) *</label><input type="number" step="0.01" class="input-field" id="rec_value" placeholder="如：4.5" /></div>
        <div class="form-group"><label class="form-label">备注</label><input type="text" class="input-field" id="rec_note" /></div>
      `,
      deworming: `
        <div class="form-group"><label class="form-label">日期 *</label><input type="date" class="input-field" id="rec_date" value="${Storage.today()}" /></div>
        <div class="form-group"><label class="form-label">药品名称 *</label><input type="text" class="input-field" id="rec_drug" /></div>
        <div class="form-group"><label class="form-label">驱虫类型</label><select class="input-field" id="rec_type"><option value="体内">体内驱虫</option><option value="体外">体外驱虫</option><option value="内外">内外同驱</option></select></div>
        <div class="form-group"><label class="form-label">备注</label><input type="text" class="input-field" id="rec_note" /></div>
      `,
      vaccine: `
        <div class="form-group"><label class="form-label">接种日期 *</label><input type="date" class="input-field" id="rec_date" value="${Storage.today()}" /></div>
        <div class="form-group"><label class="form-label">疫苗种类 *</label><input type="text" class="input-field" id="rec_name" placeholder="如：猫三联、狂犬疫苗..." /></div>
        <div class="form-group"><label class="form-label">下次到期日</label><input type="date" class="input-field" id="rec_nextDate" /></div>
        <div class="form-group"><label class="form-label">备注</label><input type="text" class="input-field" id="rec_note" /></div>
      `,
      diet: `
        <div class="form-group"><label class="form-label">日期 *</label><input type="date" class="input-field" id="rec_date" value="${Storage.today()}" /></div>
        <div class="form-group"><label class="form-label">粮品 *</label><input type="text" class="input-field" id="rec_food" placeholder="如：皇家猫粮、渴望..." /></div>
        <div class="form-group"><label class="form-label">食量</label><input type="text" class="input-field" id="rec_amount" placeholder="如：50g/天" /></div>
        <div class="form-group"><label class="form-label">辅食</label><input type="text" class="input-field" id="rec_supplement" placeholder="如：鸡胸肉、罐头..." /></div>
      `,
      grooming: `
        <div class="form-group"><label class="form-label">日期 *</label><input type="date" class="input-field" id="rec_date" value="${Storage.today()}" /></div>
        <div class="form-group"><label class="form-label">类型 *</label><select class="input-field" id="rec_type"><option value="洗澡">洗澡</option><option value="清洁笼具">清洁笼具</option><option value="指甲修剪">指甲修剪</option><option value="梳毛">梳毛</option><option value="其他">其他</option></select></div>
        <div class="form-group"><label class="form-label">备注</label><input type="text" class="input-field" id="rec_note" /></div>
      `
    };

    App.showModal(titles[type], fields[type], () => {
      const record = { id: Storage.uid() };
      const dateVal = document.getElementById('rec_date').value;
      if (!dateVal) { showToast('请选择日期'); return false; }
      record.date = dateVal;

      if (type === 'weight') {
        const val = document.getElementById('rec_value').value;
        if (!val) { showToast('请输入体重'); return false; }
        record.value = val;
        record.note = document.getElementById('rec_note').value.trim();
      } else if (type === 'deworming') {
        const drug = document.getElementById('rec_drug').value.trim();
        if (!drug) { showToast('请输入药品名称'); return false; }
        record.drug = drug;
        record.type = document.getElementById('rec_type').value;
        record.note = document.getElementById('rec_note').value.trim();
      } else if (type === 'vaccine') {
        const name = document.getElementById('rec_name').value.trim();
        if (!name) { showToast('请输入疫苗种类'); return false; }
        record.name = name;
        record.nextDate = document.getElementById('rec_nextDate').value;
        record.note = document.getElementById('rec_note').value.trim();
      } else if (type === 'diet') {
        const food = document.getElementById('rec_food').value.trim();
        if (!food) { showToast('请输入粮品'); return false; }
        record.food = food;
        record.amount = document.getElementById('rec_amount').value.trim();
        record.supplement = document.getElementById('rec_supplement').value.trim();
      } else if (type === 'grooming') {
        record.type = document.getElementById('rec_type').value;
        record.note = document.getElementById('rec_note').value.trim();
      }

      if (!this.petRecords[this.selectedPetId]) {
        this.petRecords[this.selectedPetId] = { weight: [], deworming: [], vaccine: [], diet: [], grooming: [] };
      }
      if (!this.petRecords[this.selectedPetId][type]) {
        this.petRecords[this.selectedPetId][type] = [];
      }
      this.petRecords[this.selectedPetId][type].push(record);
      Storage.set('pet_records', this.petRecords);
      this.renderRecords(document.getElementById('contentContainer'));
      showToast('记录已添加');
    });
  },

  deleteRecord(type, id) {
    App.showConfirm('确认删除这条记录？', () => {
      if (this.petRecords[this.selectedPetId] && this.petRecords[this.selectedPetId][type]) {
        this.petRecords[this.selectedPetId][type] = this.petRecords[this.selectedPetId][type].filter(r => r.id !== id);
        Storage.set('pet_records', this.petRecords);
        this.renderRecords(document.getElementById('contentContainer'));
        showToast('已删除');
      }
    });
  },

  // ===== 健康台账 =====
  renderHealth(container) {
    if (this.pets.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🩺</div><div class="empty-state-text">请先添加宠物</div></div>';
      return;
    }

    if (!this.selectedPetId || !this.pets.find(p => p.id === this.selectedPetId)) {
      this.selectedPetId = this.pets[0].id;
    }

    const records = this.healthRecords[this.selectedPetId] || [];

    container.innerHTML = `
      <div class="health-layout">
        <div class="pet-selector-bar">
          <select class="input-field pet-select" id="petSelectHealth">
            ${this.pets.map(p => `<option value="${p.id}" ${p.id === this.selectedPetId ? 'selected' : ''}>${this.escapeHtml(p.name)}</option>`).join('')}
          </select>
          <button class="btn btn-primary btn-sm" id="addHealthBtn">+ 添加健康记录</button>
        </div>

        <div class="health-types-filter">
          <button class="health-filter-btn active" data-type="all">全部</button>
          <button class="health-filter-btn" data-type="皮肤病">皮肤病</button>
          <button class="health-filter-btn" data-type="软便">软便</button>
          <button class="health-filter-btn" data-type="就医">就医</button>
          <button class="health-filter-btn" data-type="用药">用药</button>
          <button class="health-filter-btn" data-type="其他">其他</button>
        </div>

        <div class="health-records-list" id="healthRecordsList">
          ${records.length === 0
            ? '<div class="empty-state"><div class="empty-state-icon">🩺</div><div class="empty-state-text">暂无健康记录</div></div>'
            : this.renderHealthRecords(records)
          }
        </div>
      </div>
    `;

    this.bindHealthEvents(records);
  },

  renderHealthRecords(records) {
    const sorted = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.map(r => `
      <div class="health-record-card" data-id="${r.id}">
        <div class="health-record-header">
          <span class="health-type-badge" data-type="${r.type}">${r.type}</span>
          <span class="health-record-date">${r.date}</span>
          <button class="task-action-btn delete-health-btn" data-id="${r.id}">✕</button>
        </div>
        <p class="health-record-desc">${this.escapeHtml(r.description)}</p>
        ${r.notes ? `<div class="health-record-notes"><strong>就诊笔记：</strong>${this.escapeHtml(r.notes)}</div>` : ''}
      </div>
    `).join('');
  },

  bindHealthEvents(allRecords) {
    document.getElementById('petSelectHealth').addEventListener('change', (e) => {
      this.selectedPetId = e.target.value;
      this.renderHealth(document.getElementById('contentContainer'));
    });

    document.getElementById('addHealthBtn').addEventListener('click', () => {
      App.showModal('添加健康记录', `
        <div class="form-group">
          <label class="form-label">日期 *</label>
          <input type="date" class="input-field" id="health_date" value="${Storage.today()}" />
        </div>
        <div class="form-group">
          <label class="form-label">类型 *</label>
          <select class="input-field" id="health_type">
            <option value="皮肤病">皮肤病</option>
            <option value="软便">软便</option>
            <option value="就医">就医</option>
            <option value="用药">用药</option>
            <option value="其他">其他</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">状况描述 *</label>
          <textarea class="input-field" id="health_desc" placeholder="描述异常状况..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">就诊笔记 / 用药记录</label>
          <textarea class="input-field" id="health_notes" placeholder="医生建议、用药剂量、复诊时间等..."></textarea>
        </div>
      `, () => {
        const date = document.getElementById('health_date').value;
        const type = document.getElementById('health_type').value;
        const desc = document.getElementById('health_desc').value.trim();
        if (!date || !desc) { showToast('请填写日期和描述'); return false; }
        const notes = document.getElementById('health_notes').value.trim();

        if (!this.healthRecords[this.selectedPetId]) this.healthRecords[this.selectedPetId] = [];
        this.healthRecords[this.selectedPetId].push({
          id: Storage.uid(), date, type, description: desc, notes
        });
        Storage.set('pet_health', this.healthRecords);
        this.renderHealth(document.getElementById('contentContainer'));
        showToast('健康记录已添加');
      });
    });

    document.querySelectorAll('.delete-health-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        App.showConfirm('确认删除这条健康记录？', () => {
          this.healthRecords[this.selectedPetId] = this.healthRecords[this.selectedPetId].filter(r => r.id !== id);
          Storage.set('pet_health', this.healthRecords);
          this.renderHealth(document.getElementById('contentContainer'));
          showToast('已删除');
        });
      });
    });

    // 筛选
    document.querySelectorAll('.health-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.health-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const type = btn.dataset.type;
        const records = this.healthRecords[this.selectedPetId] || [];
        const filtered = type === 'all' ? records : records.filter(r => r.type === type);
        document.getElementById('healthRecordsList').innerHTML = filtered.length === 0
          ? '<div class="empty-state"><div class="empty-state-text">暂无相关记录</div></div>'
          : this.renderHealthRecords(filtered);
        // 重新绑定删除
        document.querySelectorAll('.delete-health-btn').forEach(b => {
          b.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = b.dataset.id;
            App.showConfirm('确认删除？', () => {
              this.healthRecords[this.selectedPetId] = this.healthRecords[this.selectedPetId].filter(r => r.id !== id);
              Storage.set('pet_health', this.healthRecords);
              this.renderHealth(document.getElementById('contentContainer'));
            });
          });
        });
      });
    });
  },

  // ===== 宠物日记 =====
  renderDiary(container) {
    container.innerHTML = `
      <div class="diary-layout">
        <div class="diary-toolbar">
          <button class="btn btn-primary btn-sm" id="addDiaryBtn">+ 写新日记</button>
        </div>
        <div class="diary-list" id="diaryList">
          ${this.diaries.length === 0
            ? '<div class="empty-state"><div class="empty-state-icon">📔</div><div class="empty-state-text">还没有日记，开始记录和宠物的日常吧</div></div>'
            : this.renderDiaryList()
          }
        </div>
      </div>
    `;

    this.bindDiaryEvents();
  },

  renderDiaryList() {
    const sorted = [...this.diaries].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.map(d => {
      const pet = this.pets.find(p => p.id === d.petId);
      const petName = pet ? pet.name : '未关联宠物';
      return `
        <div class="diary-card" data-id="${d.id}">
          <div class="diary-card-header">
            <span class="diary-date">${d.date}</span>
            <span class="diary-pet-name">🐾 ${this.escapeHtml(petName)}</span>
            <span class="diary-type-badge">${d.type === 'image' ? '图文' : '文字'}</span>
            <div class="diary-actions">
              <button class="task-action-btn delete-diary-btn" data-id="${d.id}">✕</button>
            </div>
          </div>
          ${d.photos && d.photos.length > 0 ? `
            <div class="diary-photos">
              ${d.photos.map(p => `<img src="${p}" class="diary-photo" />`).join('')}
            </div>
          ` : ''}
          <p class="diary-content">${this.escapeHtml(d.content)}</p>
        </div>
      `;
    }).join('');
  },

  bindDiaryEvents() {
    document.getElementById('addDiaryBtn').addEventListener('click', () => {
      if (this.pets.length === 0) {
        showToast('请先添加宠物');
        return;
      }

      let photosData = [];

      App.showModal('写新日记', `
        <div class="form-group">
          <label class="form-label">关联宠物 *</label>
          <select class="input-field" id="diary_petId">
            ${this.pets.map(p => `<option value="${p.id}">${this.escapeHtml(p.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">日期</label>
          <input type="date" class="input-field" id="diary_date" value="${Storage.today()}" />
        </div>
        <div class="form-group">
          <label class="form-label">形式</label>
          <select class="input-field" id="diary_type">
            <option value="text">文字</option>
            <option value="image">图文</option>
          </select>
        </div>
        <div class="form-group" id="photoUploadGroup" style="display:none">
          <label class="form-label">上传照片</label>
          <div class="photo-upload-area" id="photoUpload">
            <span class="photo-placeholder">📸 点击上传照片</span>
          </div>
          <input type="file" id="photoInput" accept="image/*" multiple style="display:none" />
          <div class="photo-preview-list" id="photoPreviewList"></div>
        </div>
        <div class="form-group">
          <label class="form-label">日记内容 *</label>
          <textarea class="input-field" id="diary_content" rows="4" placeholder="写下今天的日常..."></textarea>
        </div>
      `, () => {
        const petId = document.getElementById('diary_petId').value;
        const date = document.getElementById('diary_date').value;
        const type = document.getElementById('diary_type').value;
        const content = document.getElementById('diary_content').value.trim();
        if (!content) { showToast('请输入日记内容'); return false; }

        this.diaries.push({
          id: Storage.uid(), petId, date, type, content, photos: photosData
        });
        Storage.set('pet_diaries', this.diaries);
        this.renderDiary(document.getElementById('contentContainer'));
        showToast('日记已保存');
      });

      // 形式切换
      setTimeout(() => {
        document.getElementById('diary_type').addEventListener('change', (e) => {
          document.getElementById('photoUploadGroup').style.display = e.target.value === 'image' ? 'block' : 'none';
        });

        const photoUpload = document.getElementById('photoUpload');
        const photoInput = document.getElementById('photoInput');
        const photoPreviewList = document.getElementById('photoPreviewList');

        photoUpload.addEventListener('click', () => photoInput.click());
        photoInput.addEventListener('change', (e) => {
          const files = Array.from(e.target.files);
          files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              photosData.push(ev.target.result);
              const img = document.createElement('img');
              img.src = ev.target.result;
              img.className = 'photo-preview-item';
              photoPreviewList.appendChild(img);
            };
            reader.readAsDataURL(file);
          });
        });
      }, 50);
    });

    document.querySelectorAll('.delete-diary-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        App.showConfirm('确认删除这条日记？', () => {
          this.diaries = this.diaries.filter(d => d.id !== id);
          Storage.set('pet_diaries', this.diaries);
          this.renderDiary(document.getElementById('contentContainer'));
          showToast('已删除');
        });
      });
    });
  },

  // ===== 工具方法 =====
  calcAge(birthDate) {
    if (!birthDate) return '未知';
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    const totalMonths = years * 12 + months;
    if (totalMonths < 1) return '不到1个月';
    if (totalMonths < 12) return `${totalMonths}个月`;
    const y = Math.floor(totalMonths / 12);
    const m = totalMonths % 12;
    return m > 0 ? `${y}岁${m}个月` : `${y}岁`;
  },

  calcDays(dateStr) {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const now = new Date();
    return Math.floor((now - d) / (1000 * 60 * 60 * 24));
  },

  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
