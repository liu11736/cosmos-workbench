/**
 * 每日计划模块
 * - 每日清单：2026-2036日历 + 任务管理 + 按日期存档 + 月度统计
 * - 打卡周：52周网格 + 自定义打卡项 + 完成率统计
 */
const DailyModule = {
  // ===== 每日清单 =====
  tasks: {},        // { "2026-07-27": [{id, text, done}] }
  selectedDate: null,
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),

  // ===== 打卡周 =====
  checkinItems: [],  // [{id, name, color}]
  checkinData: {},   // { "2026-W30": { "itemId": [false, true, false, ...] } }
  checkinYear: new Date().getFullYear(),
  checkinWeek: 1,

  init() {
    this.tasks = Storage.get('daily_tasks', {});
    this.checkinItems = Storage.get('checkin_items', []);
    this.checkinData = Storage.get('checkin_data', {});
    this.selectedDate = Storage.today();

    // 初始化默认打卡项
    if (this.checkinItems.length === 0) {
      this.checkinItems = [
        { id: Storage.uid(), name: '早起', color: '#8B9D83' },
        { id: Storage.uid(), name: '运动', color: '#B89B98' },
        { id: Storage.uid(), name: '阅读', color: '#8B9BB0' },
        { id: Storage.uid(), name: '喝水8杯', color: '#C4A882' }
      ];
      Storage.set('checkin_items', this.checkinItems);
    }

    const today = new Date();
    this.checkinYear = Storage.getWeekYear(today);
    this.checkinWeek = Storage.getWeekNumber(today);
  },

  getTabs() {
    return [
      { id: 'daily-list', name: '每日清单' },
      { id: 'checkin-week', name: '打卡周' }
    ];
  },

  render(tabId, container) {
    if (tabId === 'daily-list') {
      this.renderDailyList(container);
    } else if (tabId === 'checkin-week') {
      this.renderCheckinWeek(container);
    }
  },

  // ===== 每日清单 =====
  renderDailyList(container) {
    const todayStr = Storage.today();
    if (!this.selectedDate) this.selectedDate = todayStr;

    container.innerHTML = `
      <div class="daily-list-layout">
        <div class="daily-calendar-section">
          <div class="card calendar-card">
            <div class="calendar-header">
              <button class="cal-nav-btn" id="calPrevMonth">&lt;</button>
              <span class="cal-title" id="calTitle"></span>
              <button class="cal-nav-btn" id="calNextMonth">&gt;</button>
            </div>
            <div class="calendar-year-selector" id="calYearSelector"></div>
            <div class="calendar-weekdays">
              <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
            </div>
            <div class="calendar-grid" id="calendarGrid"></div>
          </div>
        </div>
        <div class="daily-tasks-section">
          <div class="card tasks-card">
            <div class="tasks-header">
              <div>
                <h3 class="tasks-date-title" id="tasksDateTitle"></h3>
                <p class="tasks-summary" id="tasksSummary"></p>
              </div>
            </div>
            <div class="task-input-row">
              <input type="text" class="input-field task-input" id="taskInput" placeholder="输入待办事项，按回车添加..." />
              <button class="btn btn-primary btn-sm" id="addTaskBtn">添加</button>
            </div>
            <div class="task-list" id="taskList"></div>
          </div>
          <div class="card stats-card">
            <h3 class="card-title">📊 本月高频事项</h3>
            <div id="monthlyStats"></div>
          </div>
        </div>
      </div>
    `;

    this.renderCalendar();
    this.renderTasks();
    this.renderMonthlyStats();
    this.bindDailyListEvents();
  },

  renderCalendar() {
    const year = this.calendarYear;
    const month = this.calendarMonth;
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    document.getElementById('calTitle').textContent = `${year}年 ${monthNames[month]}`;

    // 年份选择器
    const yearSelector = document.getElementById('calYearSelector');
    yearSelector.innerHTML = `
      <select class="input-field cal-year-select" id="calYearSelect">
        ${Array.from({ length: 11 }, (_, i) => 2026 + i).map(y =>
          `<option value="${y}" ${y === year ? 'selected' : ''}>${y}年</option>`
        ).join('')}
      </select>
    `;

    const grid = document.getElementById('calendarGrid');
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDayOfWeek = firstDay.getDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7; // 周日设为7
    startDayOfWeek -= 1; // 调整为周一开始

    const todayStr = Storage.today();
    let html = '';

    // 填充空白
    for (let i = 0; i < startDayOfWeek; i++) {
      html += '<div class="cal-cell empty"></div>';
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const tasks = this.tasks[dateStr] || [];
      const doneCount = tasks.filter(t => t.done).length;
      const hasTasks = tasks.length > 0;
      const allDone = hasTasks && doneCount === tasks.length;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDate;

      html += `
        <div class="cal-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}" data-date="${dateStr}">
          <span class="cal-day">${d}</span>
          ${hasTasks ? `<span class="cal-dot ${allDone ? 'all-done' : ''}">${doneCount}/${tasks.length}</span>` : ''}
        </div>
      `;
    }

    grid.innerHTML = html;

    // 绑定日期点击
    grid.querySelectorAll('.cal-cell:not(.empty)').forEach(cell => {
      cell.addEventListener('click', () => {
        this.selectedDate = cell.dataset.date;
        this.renderCalendar();
        this.renderTasks();
      });
    });

    // 年份选择
    document.getElementById('calYearSelect').addEventListener('change', (e) => {
      this.calendarYear = parseInt(e.target.value);
      this.renderCalendar();
    });
  },

  renderTasks() {
    const date = this.selectedDate;
    const tasks = this.tasks[date] || [];
    const dateObj = new Date(date);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    document.getElementById('tasksDateTitle').textContent =
      `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日 ${weekdays[dateObj.getDay()]}`;

    const doneCount = tasks.filter(t => t.done).length;
    document.getElementById('tasksSummary').textContent =
      tasks.length > 0 ? `已完成 ${doneCount}/${tasks.length} 项` : '暂无任务';

    const list = document.getElementById('taskList');
    if (tasks.length === 0) {
      list.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">今天还没有待办事项</div></div>';
      return;
    }

    list.innerHTML = tasks.map(task => `
      <div class="task-item ${task.done ? 'done' : ''}" data-id="${task.id}">
        <div class="task-checkbox ${task.done ? 'checked' : ''}" data-id="${task.id}">
          ${task.done ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </div>
        <span class="task-text" data-id="${task.id}">${this.escapeHtml(task.text)}</span>
        <div class="task-actions">
          <button class="task-action-btn edit-btn" data-id="${task.id}" title="编辑">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="task-action-btn delete-btn" data-id="${task.id}" title="删除">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
    `).join('');

    // 绑定事件
    list.querySelectorAll('.task-checkbox').forEach(cb => {
      cb.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleTask(cb.dataset.id);
      });
    });

    list.querySelectorAll('.task-text').forEach(span => {
      span.addEventListener('dblclick', () => {
        this.editTask(span.dataset.id);
      });
    });

    list.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editTask(btn.dataset.id);
      });
    });

    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTask(btn.dataset.id);
      });
    });
  },

  renderMonthlyStats() {
    const year = this.calendarYear;
    const month = this.calendarMonth;
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const freq = {};

    Object.keys(this.tasks).forEach(date => {
      if (date.startsWith(monthStr)) {
        this.tasks[date].forEach(task => {
          const text = task.text.trim();
          freq[text] = (freq[text] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const container = document.getElementById('monthlyStats');

    if (sorted.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state-text">本月暂无数据</div></div>';
      return;
    }

    const maxCount = sorted[0][1];
    const colors = ['#8B9D83', '#B89B98', '#8B9BB0', '#C4A882', '#A3A6B0', '#9B8B9D', '#88A0A8', '#B0A088'];

    container.innerHTML = `
      <div class="freq-chart">
        ${sorted.map((item, i) => `
          <div class="freq-item">
            <span class="freq-label">${this.escapeHtml(item[0])}</span>
            <div class="freq-bar-container">
              <div class="freq-bar" style="width: ${(item[1] / maxCount) * 100}%; background: ${colors[i % colors.length]}"></div>
            </div>
            <span class="freq-count">${item[1]}次</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  bindDailyListEvents() {
    document.getElementById('calPrevMonth').addEventListener('click', () => {
      this.calendarMonth--;
      if (this.calendarMonth < 0) {
        this.calendarMonth = 11;
        this.calendarYear--;
      }
      this.renderCalendar();
      this.renderMonthlyStats();
    });

    document.getElementById('calNextMonth').addEventListener('click', () => {
      this.calendarMonth++;
      if (this.calendarMonth > 11) {
        this.calendarMonth = 0;
        this.calendarYear++;
      }
      this.renderCalendar();
      this.renderMonthlyStats();
    });

    const taskInput = document.getElementById('taskInput');
    const addTask = () => {
      const text = taskInput.value.trim();
      if (!text) return;
      if (!this.tasks[this.selectedDate]) this.tasks[this.selectedDate] = [];
      this.tasks[this.selectedDate].push({ id: Storage.uid(), text, done: false });
      Storage.set('daily_tasks', this.tasks);
      taskInput.value = '';
      this.renderTasks();
      this.renderCalendar();
      this.renderMonthlyStats();
    };

    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    taskInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addTask();
    });
  },

  toggleTask(id) {
    const tasks = this.tasks[this.selectedDate] || [];
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.done = !task.done;
      Storage.set('daily_tasks', this.tasks);
      this.renderTasks();
      this.renderCalendar();
    }
  },

  editTask(id) {
    const tasks = this.tasks[this.selectedDate] || [];
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    App.showModal('编辑任务', `
      <div class="form-group">
        <label class="form-label">任务内容</label>
        <input type="text" class="input-field" id="editTaskInput" value="${this.escapeHtml(task.text)}" />
      </div>
    `, () => {
      const newText = document.getElementById('editTaskInput').value.trim();
      if (newText) {
        task.text = newText;
        Storage.set('daily_tasks', this.tasks);
        this.renderTasks();
        this.renderCalendar();
        this.renderMonthlyStats();
        showToast('任务已更新');
      }
    });
  },

  deleteTask(id) {
    App.showConfirm('确认删除这条任务？', () => {
      this.tasks[this.selectedDate] = (this.tasks[this.selectedDate] || []).filter(t => t.id !== id);
      Storage.set('daily_tasks', this.tasks);
      this.renderTasks();
      this.renderCalendar();
      this.renderMonthlyStats();
    });
  },

  // ===== 打卡周 =====
  renderCheckinWeek(container) {
    container.innerHTML = `
      <div class="checkin-week-layout">
        <div class="checkin-toolbar">
          <div class="checkin-week-selector">
            <button class="btn btn-outline btn-sm" id="weekPrev">&lt; 上一周</button>
            <div class="week-info">
              <select class="input-field week-year-select" id="checkinYearSelect">
                ${Array.from({ length: 11 }, (_, i) => 2026 + i).map(y =>
                  `<option value="${y}" ${y === this.checkinYear ? 'selected' : ''}>${y}年</option>`
                ).join('')}
              </select>
              <select class="input-field week-select" id="checkinWeekSelect">
                ${Array.from({ length: 52 }, (_, i) => i + 1).map(w =>
                  `<option value="${w}" ${w === this.checkinWeek ? 'selected' : ''}>第${w}周</option>`
                ).join('')}
              </select>
            </div>
            <button class="btn btn-outline btn-sm" id="weekNext">下一周 &gt;</button>
          </div>
          <button class="btn btn-primary btn-sm" id="addItemBtn">+ 添加打卡项</button>
        </div>

        <div class="card checkin-grid-card">
          <div class="week-date-range" id="weekDateRange"></div>
          <div class="checkin-grid-wrapper">
            <table class="checkin-grid" id="checkinGrid"></table>
          </div>
        </div>

        <div class="checkin-stats-row">
          <div class="card">
            <h3 class="card-title">📈 本周完成率</h3>
            <div id="weekCompletionRate"></div>
          </div>
          <div class="card">
            <h3 class="card-title">📊 各项完成情况</h3>
            <div id="itemCompletion"></div>
          </div>
          <div class="card">
            <h3 class="card-title">🏆 年度总览</h3>
            <div id="yearOverview"></div>
          </div>
        </div>
      </div>
    `;

    this.renderCheckinGrid();
    this.renderCheckinStats();
    this.bindCheckinEvents();
  },

  renderCheckinGrid() {
    const year = this.checkinYear;
    const week = this.checkinWeek;
    const weekDates = Storage.getWeekDates(year, week);
    const weekKey = `${year}-W${week}`;
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    // 日期范围
    const start = weekDates[0];
    const end = weekDates[6];
    document.getElementById('weekDateRange').textContent =
      `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`;

    const grid = document.getElementById('checkinGrid');
    let html = `
      <thead>
        <tr>
          <th class="checkin-item-col">打卡项</th>
          ${weekDates.map((d, i) => {
            const isToday = Storage.formatDate(d) === Storage.today();
            return `<th class="${isToday ? 'today-col' : ''}">
              <span class="col-weekday">${weekdays[i]}</span>
              <span class="col-date">${d.getMonth() + 1}/${d.getDate()}</span>
            </th>`;
          }).join('')}
          <th class="checkin-rate-col">完成率</th>
        </tr>
      </thead>
      <tbody>
    `;

    if (this.checkinItems.length === 0) {
      html += `<tr><td colspan="9" class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">还没有打卡项目，点击"添加打卡项"开始</div></td></tr>`;
    } else {
      this.checkinItems.forEach(item => {
        const data = (this.checkinData[weekKey] && this.checkinData[weekKey][item.id]) || new Array(7).fill(false);
        const doneCount = data.filter(Boolean).length;
        const rate = Math.round((doneCount / 7) * 100);

        html += `
          <tr data-item-id="${item.id}">
            <td class="checkin-item-col">
              <span class="item-color-dot" style="background:${item.color}"></span>
              <span class="item-name">${this.escapeHtml(item.name)}</span>
              <div class="item-actions">
                <button class="task-action-btn edit-item-btn" data-id="${item.id}" title="编辑">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="task-action-btn delete-item-btn" data-id="${item.id}" title="删除">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </td>
            ${data.map((checked, i) => {
              const isToday = Storage.formatDate(weekDates[i]) === Storage.today();
              return `<td class="checkin-cell ${isToday ? 'today-cell' : ''}" data-item-id="${item.id}" data-day="${i}">
                <div class="checkin-circle ${checked ? 'checked' : ''}" style="${checked ? `background:${item.color};border-color:${item.color}` : ''}">
                  ${checked ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                </div>
              </td>`;
            }).join('')}
            <td class="checkin-rate-col">
              <div class="rate-bar-container">
                <div class="rate-bar" style="width:${rate}%;background:${item.color}"></div>
              </div>
              <span class="rate-text">${doneCount}/7</span>
            </td>
          </tr>
        `;
      });
    }

    html += '</tbody>';
    grid.innerHTML = html;

    // 绑定打卡点击
    grid.querySelectorAll('.checkin-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        this.toggleCheckin(cell.dataset.itemId, parseInt(cell.dataset.day));
      });
    });

    // 编辑/删除打卡项
    grid.querySelectorAll('.edit-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.editCheckinItem(btn.dataset.id);
      });
    });

    grid.querySelectorAll('.delete-item-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteCheckinItem(btn.dataset.id);
      });
    });
  },

  toggleCheckin(itemId, day) {
    const weekKey = `${this.checkinYear}-W${this.checkinWeek}`;
    if (!this.checkinData[weekKey]) this.checkinData[weekKey] = {};
    if (!this.checkinData[weekKey][itemId]) this.checkinData[weekKey][itemId] = new Array(7).fill(false);
    this.checkinData[weekKey][itemId][day] = !this.checkinData[weekKey][itemId][day];
    Storage.set('checkin_data', this.checkinData);
    this.renderCheckinGrid();
    this.renderCheckinStats();
  },

  renderCheckinStats() {
    const weekKey = `${this.checkinYear}-W${this.checkinWeek}`;
    const totalCells = this.checkinItems.length * 7;
    let doneCells = 0;

    this.checkinItems.forEach(item => {
      const data = (this.checkinData[weekKey] && this.checkinData[weekKey][item.id]) || new Array(7).fill(false);
      doneCells += data.filter(Boolean).length;
    });

    const rate = totalCells > 0 ? Math.round((doneCells / totalCells) * 100) : 0;

    document.getElementById('weekCompletionRate').innerHTML = `
      <div class="big-rate-display">
        <div class="big-rate-number" style="color:${rate >= 70 ? '#8B9D83' : rate >= 40 ? '#C4A882' : '#B89B98'}">${rate}%</div>
        <div class="big-rate-label">本周总体完成率</div>
        <div class="big-rate-detail">${doneCells} / ${totalCells} 项已完成</div>
      </div>
    `;

    // 各项完成情况
    document.getElementById('itemCompletion').innerHTML = this.checkinItems.length === 0
      ? '<div class="empty-state-text">暂无数据</div>'
      : this.checkinItems.map(item => {
        const data = (this.checkinData[weekKey] && this.checkinData[weekKey][item.id]) || new Array(7).fill(false);
        const done = data.filter(Boolean).length;
        const r = Math.round((done / 7) * 100);
        return `
          <div class="item-stat-row">
            <span class="item-color-dot" style="background:${item.color}"></span>
            <span class="item-stat-name">${this.escapeHtml(item.name)}</span>
            <div class="mini-bar-container">
              <div class="mini-bar" style="width:${r}%;background:${item.color}"></div>
            </div>
            <span class="item-stat-rate">${done}/7</span>
          </div>
        `;
      }).join('');

    // 年度总览
    let yearTotal = 0, yearDone = 0;
    Object.keys(this.checkinData).forEach(key => {
      if (key.startsWith(`${this.checkinYear}-W`)) {
        Object.values(this.checkinData[key]).forEach(arr => {
          yearTotal += 7;
          yearDone += arr.filter(Boolean).length;
        });
      }
    });
    const yearRate = yearTotal > 0 ? Math.round((yearDone / yearTotal) * 100) : 0;
    document.getElementById('yearOverview').innerHTML = `
      <div class="year-stat">
        <div class="year-stat-item">
          <span class="year-stat-value">${yearDone}</span>
          <span class="year-stat-label">总完成</span>
        </div>
        <div class="year-stat-item">
          <span class="year-stat-value">${yearRate}%</span>
          <span class="year-stat-label">完成率</span>
        </div>
        <div class="year-stat-item">
          <span class="year-stat-value">${this.checkinItems.length}</span>
          <span class="year-stat-label">打卡项</span>
        </div>
      </div>
    `;
  },

  bindCheckinEvents() {
    document.getElementById('weekPrev').addEventListener('click', () => {
      this.checkinWeek--;
      if (this.checkinWeek < 1) {
        this.checkinWeek = 52;
        this.checkinYear--;
      }
      this.syncWeekSelector();
      this.renderCheckinGrid();
      this.renderCheckinStats();
    });

    document.getElementById('weekNext').addEventListener('click', () => {
      this.checkinWeek++;
      if (this.checkinWeek > 52) {
        this.checkinWeek = 1;
        this.checkinYear++;
      }
      this.syncWeekSelector();
      this.renderCheckinGrid();
      this.renderCheckinStats();
    });

    document.getElementById('checkinYearSelect').addEventListener('change', (e) => {
      this.checkinYear = parseInt(e.target.value);
      this.renderCheckinGrid();
      this.renderCheckinStats();
    });

    document.getElementById('checkinWeekSelect').addEventListener('change', (e) => {
      this.checkinWeek = parseInt(e.target.value);
      this.renderCheckinGrid();
      this.renderCheckinStats();
    });

    document.getElementById('addItemBtn').addEventListener('click', () => {
      this.addCheckinItem();
    });
  },

  syncWeekSelector() {
    document.getElementById('checkinYearSelect').value = this.checkinYear;
    document.getElementById('checkinWeekSelect').value = this.checkinWeek;
  },

  addCheckinItem() {
    const colors = ['#8B9D83', '#B89B98', '#8B9BB0', '#C4A882', '#A3A6B0', '#9B8B9D', '#88A0A8', '#B0A088', '#A89898', '#90B0A0'];
    App.showModal('添加打卡项', `
      <div class="form-group">
        <label class="form-label">打卡项名称</label>
        <input type="text" class="input-field" id="checkinItemName" placeholder="如：早起、运动、阅读..." />
      </div>
      <div class="form-group">
        <label class="form-label">颜色</label>
        <div class="color-picker" id="colorPicker">
          ${colors.map(c => `<div class="color-option" data-color="${c}" style="background:${c}"></div>`).join('')}
        </div>
      </div>
    `, () => {
      const name = document.getElementById('checkinItemName').value.trim();
      if (!name) { showToast('请输入打卡项名称'); return false; }
      const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || colors[0];
      this.checkinItems.push({ id: Storage.uid(), name, color: selectedColor });
      Storage.set('checkin_items', this.checkinItems);
      this.renderCheckinGrid();
      this.renderCheckinStats();
      showToast('打卡项已添加');
    });

    // 颜色选择
    setTimeout(() => {
      document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        });
      });
      document.querySelector('.color-option')?.classList.add('selected');
    }, 50);
  },

  editCheckinItem(id) {
    const item = this.checkinItems.find(i => i.id === id);
    if (!item) return;
    const colors = ['#8B9D83', '#B89B98', '#8B9BB0', '#C4A882', '#A3A6B0', '#9B8B9D', '#88A0A8', '#B0A088', '#A89898', '#90B0A0'];
    App.showModal('编辑打卡项', `
      <div class="form-group">
        <label class="form-label">打卡项名称</label>
        <input type="text" class="input-field" id="editCheckinItemName" value="${this.escapeHtml(item.name)}" />
      </div>
      <div class="form-group">
        <label class="form-label">颜色</label>
        <div class="color-picker" id="colorPicker">
          ${colors.map(c => `<div class="color-option ${c === item.color ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>`).join('')}
        </div>
      </div>
    `, () => {
      const name = document.getElementById('editCheckinItemName').value.trim();
      if (!name) { showToast('请输入名称'); return false; }
      item.name = name;
      item.color = document.querySelector('.color-option.selected')?.dataset.color || item.color;
      Storage.set('checkin_items', this.checkinItems);
      this.renderCheckinGrid();
      this.renderCheckinStats();
      showToast('已更新');
    });

    setTimeout(() => {
      document.querySelectorAll('.color-option').forEach(opt => {
        opt.addEventListener('click', () => {
          document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        });
      });
    }, 50);
  },

  deleteCheckinItem(id) {
    App.showConfirm('确认删除这个打卡项？所有历史打卡数据也会删除。', () => {
      this.checkinItems = this.checkinItems.filter(i => i.id !== id);
      Storage.set('checkin_items', this.checkinItems);
      // 清理相关数据
      Object.keys(this.checkinData).forEach(key => {
        if (this.checkinData[key][id]) {
          delete this.checkinData[key][id];
        }
      });
      Storage.set('checkin_data', this.checkinData);
      this.renderCheckinGrid();
      this.renderCheckinStats();
      showToast('已删除');
    });
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
