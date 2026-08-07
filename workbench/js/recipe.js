/**
 * 菜谱模块
 * - 菜谱清单：分类归档 + 菜品卡片 + 搜索
 * - 本周食谱：周一至周日三餐规划 + 多套方案
 * - 食材采购清单：手动录入 + 勾选完成 + 关联菜品
 * - 烹饪笔记：调味心得/踩坑总结 + 绑定菜品
 */
const RecipeModule = {
  recipes: [],
  categories: ['猪肉', '鸡肉', '牛肉', '海鲜', '素菜', '汤品', '主食'],
  weeklyPlans: [],
  shoppingList: [],
  notes: [],
  activeCategory: '猪肉',
  searchKeyword: '',

  init() {
    this.recipes = Storage.get('recipe_list', []);
    this.categories = Storage.get('recipe_categories', ['猪肉', '鸡肉', '牛肉', '海鲜', '素菜', '汤品', '主食']);
    this.weeklyPlans = Storage.get('recipe_weekly', []);
    this.shoppingList = Storage.get('recipe_shopping', []);
    this.notes = Storage.get('recipe_notes', []);

    if (this.recipes.length === 0) this.generateSamples();
  },

  generateSamples() {
    const samples = [
      { id: Storage.uid(), name: '红烧肉', category: '猪肉', ingredients: '五花肉500g, 冰糖30g, 生抽2勺, 老抽1勺, 料酒2勺, 葱姜八角', steps: '1. 五花肉切块焯水\n2. 冰糖炒糖色\n3. 放入肉块翻炒上色\n4. 加调料和水没过肉\n5. 大火烧开转小火炖40分钟\n6. 大火收汁', duration: '60分钟', taste: '咸甜', note: '冰糖炒糖色时火不要太大，容易苦' },
      { id: Storage.uid(), name: '可乐鸡翅', category: '鸡肉', ingredients: '鸡翅10个, 可乐1罐, 生抽2勺, 老抽半勺, 姜片', steps: '1. 鸡翅划刀焯水\n2. 热锅煎至两面金黄\n3. 倒入可乐和调料\n4. 中火炖15分钟\n5. 大火收汁', duration: '30分钟', taste: '甜咸', note: '可乐没过鸡翅即可，不要加水' },
      { id: Storage.uid(), name: '番茄炒蛋', category: '素菜', ingredients: '番茄2个, 鸡蛋3个, 糖1勺, 盐适量', steps: '1. 鸡蛋打散炒熟盛出\n2. 番茄切块炒出汁\n3. 加糖盐调味\n4. 倒入鸡蛋翻炒均匀', duration: '15分钟', taste: '酸甜', note: '番茄要选熟透的，炒出汁更好吃' }
    ];
    this.recipes = samples;
    Storage.set('recipe_list', this.recipes);
  },

  getTabs() {
    return [
      { id: 'recipe-list', name: '菜谱清单' },
      { id: 'weekly', name: '本周食谱' },
      { id: 'shopping', name: '食材采购清单' },
      { id: 'notes', name: '烹饪笔记' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'recipe-list') this.renderRecipeList(container);
    else if (tabId === 'weekly') this.renderWeekly(container);
    else if (tabId === 'shopping') this.renderShopping(container);
    else if (tabId === 'notes') this.renderNotes(container);
  },

  // ===== 菜谱清单 =====
  renderRecipeList(container) {
    let filtered = this.recipes.filter(r => r.category === this.activeCategory);
    if (this.searchKeyword) {
      const kw = this.searchKeyword.toLowerCase();
      filtered = this.recipes.filter(r => r.name.toLowerCase().includes(kw) || (r.ingredients && r.ingredients.toLowerCase().includes(kw)));
    }

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addRecipeBtn">+ 新增菜谱</button>
          <div class="recipe-search-box">
            <span>🔍</span>
            <input type="text" id="recipeSearch" placeholder="搜索菜名或食材..." value="${this.searchKeyword}" />
          </div>
        </div>
        <div class="recipe-category-bar">
          ${this.categories.map(c => `<button class="recipe-cat-btn ${c === this.activeCategory && !this.searchKeyword ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('')}
          <button class="recipe-cat-add-btn" id="addCatBtn">+ 新分类</button>
        </div>
        ${filtered.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">🍳</div><div class="mod-empty-text">暂无菜谱，点击上方按钮新增</div></div>'
          : `<div class="mod-cards-grid">${filtered.map(r => `
              <div class="recipe-card" data-id="${r.id}">
                <div class="recipe-card-header">
                  <h3 class="recipe-name">${r.name}</h3>
                  <div class="material-actions">
                    <button class="recipe-edit-btn" data-id="${r.id}">✏️</button>
                    <button class="recipe-del-btn" data-id="${r.id}">✕</button>
                  </div>
                </div>
                <div class="recipe-meta">
                  <span class="recipe-cat-badge">${r.category}</span>
                  <span class="recipe-duration">⏱ ${r.duration || '未设置'}</span>
                  <span class="recipe-taste">👅 ${r.taste || ''}</span>
                </div>
                <div class="hotspot-section"><span class="hotspot-label">食材</span><p class="hotspot-content">${r.ingredients || '未填写'}</p></div>
                <div class="hotspot-section"><span class="hotspot-label">步骤</span><p class="hotspot-content recipe-steps">${(r.steps || '').replace(/\n/g, '<br>')}</p></div>
                ${r.note ? `<div class="hotspot-section"><span class="hotspot-label">备注</span><p class="hotspot-content recipe-note">${r.note}</p></div>` : ''}
              </div>
            `).join('')}</div>`
        }
      </div>
    `;

    document.getElementById('addRecipeBtn').addEventListener('click', () => this.showRecipeForm());
    const search = document.getElementById('recipeSearch');
    if (search) {
      search.addEventListener('input', e => {
        this.searchKeyword = e.target.value;
        this.renderRecipeList(document.getElementById('contentContainer'));
        const ns = document.getElementById('recipeSearch'); if (ns) { ns.focus(); ns.setSelectionRange(ns.value.length, ns.value.length); }
      });
    }
    document.querySelectorAll('.recipe-cat-btn').forEach(btn => btn.addEventListener('click', () => { this.activeCategory = btn.dataset.cat; this.searchKeyword = ''; this.renderRecipeList(document.getElementById('contentContainer')); }));
    document.getElementById('addCatBtn').addEventListener('click', () => this.showCategoryForm());
    document.querySelectorAll('.recipe-edit-btn').forEach(btn => btn.addEventListener('click', () => { const r = this.recipes.find(x => x.id === btn.dataset.id); if (r) this.showRecipeForm(r); }));
    document.querySelectorAll('.recipe-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这道菜谱？', () => {
        this.recipes = this.recipes.filter(r => r.id !== btn.dataset.id);
        Storage.set('recipe_list', this.recipes);
        this.renderRecipeList(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
  },

  showRecipeForm(existing) {
    const isEdit = !!existing;
    const body = `
      <div class="form-row">
        <div class="form-group"><label>菜名</label><input type="text" id="rf-name" class="form-input" value="${existing ? existing.name : ''}" /></div>
        <div class="form-group"><label>分类</label>
          <select id="rf-category" class="form-input">${this.categories.map(c => `<option value="${c}" ${existing && existing.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>耗时</label><input type="text" id="rf-duration" class="form-input" value="${existing ? existing.duration : ''}" placeholder="如 30分钟" /></div>
        <div class="form-group"><label>口味</label><input type="text" id="rf-taste" class="form-input" value="${existing ? existing.taste : ''}" placeholder="如 咸鲜/酸甜" /></div>
      </div>
      <div class="form-group"><label>食材及用量</label><textarea id="rf-ingredients" class="form-textarea" rows="3" placeholder="五花肉500g, 冰糖30g...">${existing ? existing.ingredients : ''}</textarea></div>
      <div class="form-group"><label>烹饪步骤</label><textarea id="rf-steps" class="form-textarea" rows="5" placeholder="1. ...&#10;2. ...">${existing ? existing.steps : ''}</textarea></div>
      <div class="form-group"><label>备注/改良技巧</label><textarea id="rf-note" class="form-textarea" rows="2" placeholder="烹饪心得、改良方案...">${existing ? existing.note : ''}</textarea></div>
    `;
    App.showModal(isEdit ? '编辑菜谱' : '新增菜谱', body, () => {
      const name = document.getElementById('rf-name').value.trim();
      if (!name) { showToast('请填写菜名'); return false; }
      const data = {
        name, category: document.getElementById('rf-category').value,
        duration: document.getElementById('rf-duration').value.trim(),
        taste: document.getElementById('rf-taste').value.trim(),
        ingredients: document.getElementById('rf-ingredients').value.trim(),
        steps: document.getElementById('rf-steps').value.trim(),
        note: document.getElementById('rf-note').value.trim()
      };
      if (isEdit) { Object.assign(existing, data); }
      else { this.recipes.push({ id: Storage.uid(), ...data }); }
      Storage.set('recipe_list', this.recipes);
      this.renderRecipeList(document.getElementById('contentContainer'));
      showToast(isEdit ? '已更新' : '已新增');
    }, { maxWidth: '600px' });
  },

  showCategoryForm() {
    const body = `<div class="form-group"><label>分类名称</label><input type="text" id="cf-name" class="form-input" placeholder="如 烘焙" /></div>`;
    App.showModal('新增分类', body, () => {
      const name = document.getElementById('cf-name').value.trim();
      if (!name) { showToast('请输入分类名'); return false; }
      if (!this.categories.includes(name)) { this.categories.push(name); Storage.set('recipe_categories', this.categories); }
      this.activeCategory = name;
      this.renderRecipeList(document.getElementById('contentContainer'));
      showToast('分类已添加');
    });
  },

  // ===== 本周食谱 =====
  renderWeekly(container) {
    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addPlanBtn">+ 新建周食谱</button>
          <span class="mod-hint">共 ${this.weeklyPlans.length} 套周食谱方案</span>
        </div>
        ${this.weeklyPlans.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📅</div><div class="mod-empty-text">暂无周食谱，点击上方按钮新建</div></div>'
          : this.weeklyPlans.slice().reverse().map(p => this.renderPlanCard(p)).join('')
        }
      </div>
    `;

    document.getElementById('addPlanBtn').addEventListener('click', () => this.showPlanForm());
    document.querySelectorAll('.plan-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这套周食谱？', () => {
        this.weeklyPlans = this.weeklyPlans.filter(p => p.id !== btn.dataset.id);
        Storage.set('recipe_weekly', this.weeklyPlans);
        this.renderWeekly(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
    document.querySelectorAll('.plan-edit-btn').forEach(btn => btn.addEventListener('click', () => {
      const p = this.weeklyPlans.find(x => x.id === btn.dataset.id); if (p) this.showPlanForm(p);
    }));
  },

  renderPlanCard(p) {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const meals = ['早餐', '午餐', '晚餐'];
    return `
      <div class="plan-card">
        <div class="plan-card-header">
          <h3 class="plan-title">${p.name}</h3>
          <div class="material-actions">
            <button class="plan-edit-btn" data-id="${p.id}">✏️</button>
            <button class="plan-del-btn" data-id="${p.id}">✕</button>
          </div>
        </div>
        <div class="plan-date">${p.startDate || ''}</div>
        <table class="plan-table">
          <thead><tr><th>日</th><th>早餐</th><th>午餐</th><th>晚餐</th></tr></thead>
          <tbody>
            ${days.map((d, i) => `<tr><td class="plan-day-cell">${d}</td>${meals.map(m => `<td>${(p.meals && p.meals[i] && p.meals[i][m]) || '—'}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  showPlanForm(existing) {
    const isEdit = !!existing;
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const meals = ['早餐', '午餐', '晚餐'];
    const recipeNames = this.recipes.map(r => r.name);
    const currentMeals = existing ? existing.meals : days.map(() => ({}));

    const body = `
      <div class="form-group"><label>方案名称</label><input type="text" id="pf-name" class="form-input" value="${existing ? existing.name : ''}" placeholder="如 第30周食谱" /></div>
      <div class="form-group"><label>起始日期</label><input type="date" id="pf-date" class="form-input" value="${existing ? existing.startDate : Storage.today()}" /></div>
      <div class="plan-form-grid">
        ${days.map((d, di) => `
          <div class="plan-form-day">
            <div class="plan-form-day-title">${d}</div>
            ${meals.map(m => `
              <div class="plan-form-meal">
                <label>${m}</label>
                <input type="text" class="form-input plan-meal-input" data-day="${di}" data-meal="${m}" value="${currentMeals[di] && currentMeals[di][m] || ''}" list="recipeNames" placeholder="输入或选择菜名" />
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
      <datalist id="recipeNames">${recipeNames.map(n => `<option value="${n}">`).join('')}</datalist>
    `;

    App.showModal(isEdit ? '编辑周食谱' : '新建周食谱', body, () => {
      const name = document.getElementById('pf-name').value.trim();
      if (!name) { showToast('请填写方案名称'); return false; }
      const meals = days.map((d, di) => {
        const obj = {};
        ['早餐', '午餐', '晚餐'].forEach(m => {
          const input = document.querySelector(`.plan-meal-input[data-day="${di}"][data-meal="${m}"]`);
          obj[m] = input ? input.value.trim() : '';
        });
        return obj;
      });
      if (isEdit) { existing.name = name; existing.startDate = document.getElementById('pf-date').value; existing.meals = meals; }
      else { this.weeklyPlans.push({ id: Storage.uid(), name, startDate: document.getElementById('pf-date').value, meals }); }
      Storage.set('recipe_weekly', this.weeklyPlans);
      this.renderWeekly(document.getElementById('contentContainer'));
      showToast(isEdit ? '已更新' : '已创建');
    }, { maxWidth: '720px' });
  },

  // ===== 食材采购清单 =====
  renderShopping(container) {
    const unchecked = this.shoppingList.filter(s => !s.checked);
    const checked = this.shoppingList.filter(s => s.checked);

    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addShopBtn">+ 新增采购项</button>
          <button class="btn btn-outline" id="autoShopBtn">📌 从菜谱汇总</button>
          <span class="mod-hint">待采购 ${unchecked.length} 项 / 已完成 ${checked.length} 项</span>
        </div>
        ${this.shoppingList.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">🛒</div><div class="mod-empty-text">暂无采购项，手动新增或从菜谱自动汇总</div></div>'
          : `<div class="shopping-list">
              ${unchecked.length > 0 ? `<div class="shopping-section-title">待采购</div>` : ''}
              ${unchecked.map(s => `
                <div class="shopping-item ${s.checked ? 'checked' : ''}">
                  <label class="shopping-check-label">
                    <input type="checkbox" class="shopping-check" data-id="${s.id}" ${s.checked ? 'checked' : ''} />
                    <span class="shopping-name">${s.name}</span>
                  </label>
                  <div class="shopping-info">
                    ${s.amount ? `<span class="shopping-amount">${s.amount}</span>` : ''}
                    ${s.recipe ? `<span class="shopping-recipe">📎 ${s.recipe}</span>` : ''}
                  </div>
                  <button class="shopping-del-btn" data-id="${s.id}">✕</button>
                </div>
              `).join('')}
              ${checked.length > 0 ? `<div class="shopping-section-title">已完成</div>` : ''}
              ${checked.map(s => `
                <div class="shopping-item checked">
                  <label class="shopping-check-label">
                    <input type="checkbox" class="shopping-check" data-id="${s.id}" checked />
                    <span class="shopping-name">${s.name}</span>
                  </label>
                  <div class="shopping-info">${s.amount ? `<span class="shopping-amount">${s.amount}</span>` : ''}</div>
                  <button class="shopping-del-btn" data-id="${s.id}">✕</button>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;

    document.getElementById('addShopBtn').addEventListener('click', () => this.showShoppingForm());
    document.getElementById('autoShopBtn').addEventListener('click', () => this.showAutoShopForm());
    document.querySelectorAll('.shopping-check').forEach(cb => cb.addEventListener('change', () => {
      const item = this.shoppingList.find(s => s.id === cb.dataset.id);
      if (item) { item.checked = cb.checked; Storage.set('recipe_shopping', this.shoppingList); this.renderShopping(document.getElementById('contentContainer')); }
    }));
    document.querySelectorAll('.shopping-del-btn').forEach(btn => btn.addEventListener('click', () => {
      this.shoppingList = this.shoppingList.filter(s => s.id !== btn.dataset.id);
      Storage.set('recipe_shopping', this.shoppingList);
      this.renderShopping(document.getElementById('contentContainer'));
    }));
  },

  showShoppingForm() {
    const recipeNames = this.recipes.map(r => r.name);
    const body = `
      <div class="form-row">
        <div class="form-group"><label>食材名称</label><input type="text" id="sf-name" class="form-input" placeholder="如 土豆" /></div>
        <div class="form-group"><label>用量</label><input type="text" id="sf-amount" class="form-input" placeholder="如 2个" /></div>
      </div>
      <div class="form-group"><label>关联菜品（可选）</label><input type="text" id="sf-recipe" class="form-input" list="recipeNames2" placeholder="选择或输入菜名" /><datalist id="recipeNames2">${recipeNames.map(n => `<option value="${n}">`).join('')}</datalist></div>
    `;
    App.showModal('新增采购项', body, () => {
      const name = document.getElementById('sf-name').value.trim();
      if (!name) { showToast('请填写食材名称'); return false; }
      this.shoppingList.push({ id: Storage.uid(), name, amount: document.getElementById('sf-amount').value.trim(), recipe: document.getElementById('sf-recipe').value.trim(), checked: false });
      Storage.set('recipe_shopping', this.shoppingList);
      this.renderShopping(document.getElementById('contentContainer'));
      showToast('已添加');
    });
  },

  showAutoShopForm() {
    const body = `
      <div class="form-group"><label>选择菜品（可多选）</label>
        <div class="recipe-multi-select">
          ${this.recipes.map(r => `<label class="multi-select-item"><input type="checkbox" class="auto-shop-recipe" data-id="${r.id}" /> ${r.name}（${r.category}）</label>`).join('')}
        </div>
      </div>
    `;
    App.showModal('从菜谱汇总采购清单', body, () => {
      const selected = document.querySelectorAll('.auto-shop-recipe:checked');
      let added = 0;
      selected.forEach(cb => {
        const recipe = this.recipes.find(r => r.id === cb.dataset.id);
        if (recipe && recipe.ingredients) {
          recipe.ingredients.split(/[,，]/).forEach(ing => {
            const trimmed = ing.trim();
            if (trimmed) {
              this.shoppingList.push({ id: Storage.uid(), name: trimmed, amount: '', recipe: recipe.name, checked: false });
              added++;
            }
          });
        }
      });
      Storage.set('recipe_shopping', this.shoppingList);
      this.renderShopping(document.getElementById('contentContainer'));
      showToast(`已添加 ${added} 项采购项`);
    }, { maxWidth: '480px' });
  },

  // ===== 烹饪笔记 =====
  renderNotes(container) {
    container.innerHTML = `
      <div class="mod-layout">
        <div class="mod-toolbar">
          <button class="btn btn-primary" id="addNoteBtn">+ 新增笔记</button>
          <span class="mod-hint">共 ${this.notes.length} 条烹饪笔记</span>
        </div>
        ${this.notes.length === 0
          ? '<div class="mod-empty"><div class="mod-empty-icon">📓</div><div class="mod-empty-text">暂无笔记，记录调味心得、踩坑总结</div></div>'
          : `<div class="mod-cards-grid">${this.notes.slice().reverse().map(n => `
              <div class="material-card">
                <div class="material-card-header">
                  <h3 class="material-title">${n.title}</h3>
                  <div class="material-actions">
                    <button class="note-edit-btn" data-id="${n.id}">✏️</button>
                    <button class="note-del-btn" data-id="${n.id}">✕</button>
                  </div>
                </div>
                ${n.recipe ? `<span class="recipe-cat-badge">${n.recipe}</span>` : ''}
                <p class="material-content">${n.content.replace(/\n/g, '<br>')}</p>
                <div class="material-date">${n.date || ''}</div>
              </div>
            `).join('')}</div>`
        }
      </div>
    `;

    document.getElementById('addNoteBtn').addEventListener('click', () => this.showNoteForm());
    document.querySelectorAll('.note-edit-btn').forEach(btn => btn.addEventListener('click', () => { const n = this.notes.find(x => x.id === btn.dataset.id); if (n) this.showNoteForm(n); }));
    document.querySelectorAll('.note-del-btn').forEach(btn => btn.addEventListener('click', () => {
      App.showConfirm('确定删除这条笔记？', () => {
        this.notes = this.notes.filter(n => n.id !== btn.dataset.id);
        Storage.set('recipe_notes', this.notes);
        this.renderNotes(document.getElementById('contentContainer'));
        showToast('已删除');
      });
    }));
  },

  showNoteForm(existing) {
    const isEdit = !!existing;
    const recipeNames = this.recipes.map(r => r.name);
    const body = `
      <div class="form-group"><label>标题</label><input type="text" id="nf-title" class="form-input" value="${existing ? existing.title : ''}" placeholder="如 红烧肉糖色技巧" /></div>
      <div class="form-group"><label>关联菜品</label><input type="text" id="nf-recipe" class="form-input" list="recipeNames3" value="${existing ? existing.recipe : ''}" placeholder="选择或输入菜名" /><datalist id="recipeNames3">${recipeNames.map(n => `<option value="${n}">`).join('')}</datalist></div>
      <div class="form-group"><label>笔记内容</label><textarea id="nf-content" class="form-textarea" rows="5" placeholder="调味心得、踩坑总结、改良方案...">${existing ? existing.content : ''}</textarea></div>
    `;
    App.showModal(isEdit ? '编辑笔记' : '新增笔记', body, () => {
      const title = document.getElementById('nf-title').value.trim();
      if (!title) { showToast('请填写标题'); return false; }
      const data = { title, recipe: document.getElementById('nf-recipe').value.trim(), content: document.getElementById('nf-content').value.trim() };
      if (isEdit) { Object.assign(existing, data); }
      else { this.notes.push({ id: Storage.uid(), ...data, date: Storage.today() }); }
      Storage.set('recipe_notes', this.notes);
      this.renderNotes(document.getElementById('contentContainer'));
      showToast(isEdit ? '已更新' : '已新增');
    }, { maxWidth: '520px' });
  }
};
