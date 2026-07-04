const STORAGE_KEY = "mof-work-log-tasks";

const statusLabels = {
  pending: "대기",
  progress: "진행 중",
  hold: "보류",
  done: "완료"
};

const importanceLabels = {
  high: "긴급",
  medium: "보통",
  low: "낮음"
};

const sampleTasks = [
  {
    id: "task-1",
    title: "선박 입출항 보고서 정리",
    content: "오늘 접수된 입출항 보고서를 확인하고 누락 항목을 보완합니다.",
    requestDate: "2026-07-02",
    dueDate: "2026-07-04",
    importance: "high",
    requester: "운영팀",
    manager: "김민수",
    status: "progress",
    createdAt: 1751468400000,
    updatedAt: 1751546400000
  },
  {
    id: "task-2",
    title: "상황실 근무자 교대 일정 확인",
    content: "주간 교대표와 근무 공백 여부를 확인하고 공유합니다.",
    requestDate: "2026-07-01",
    dueDate: "2026-07-05",
    importance: "medium",
    requester: "총괄담당",
    manager: "이서연",
    status: "pending",
    createdAt: 1751382000000,
    updatedAt: 1751382000000
  },
  {
    id: "task-3",
    title: "주간 점검결과 보고",
    content: "점검 내역을 취합해 보고서 형식으로 정리하고 완료 처리합니다.",
    requestDate: "2026-06-28",
    dueDate: "2026-07-01",
    importance: "low",
    requester: "행정지원",
    manager: "박지훈",
    status: "done",
    createdAt: 1751122800000,
    updatedAt: 1751295600000
  },
  {
    id: "task-4",
    title: "비상연락망 최신화",
    content: "담당자 연락처를 최신 정보로 갱신하고 내부 배포합니다.",
    requestDate: "2026-07-03",
    dueDate: "2026-07-08",
    importance: "high",
    requester: "상황실",
    manager: "최유진",
    status: "pending",
    createdAt: 1751546400000,
    updatedAt: 1751546400000
  }
];

const elements = {
  menuButtons: Array.from(document.querySelectorAll(".menu-button")),
  workspaceKicker: document.getElementById("workspaceKicker"),
  workspaceTitle: document.getElementById("workspaceTitle"),
  levelOneButtons: document.getElementById("levelOneButtons"),
  levelTwoBox: document.getElementById("levelTwoBox"),
  dashboardArea: document.getElementById("dashboardArea"),
  views: {
    main: document.getElementById("mainView"),
    schedule: document.getElementById("scheduleView")
  },
  totalCount: document.getElementById("totalCount"),
  statusPendingCount: document.getElementById("statusPendingCount"),
  statusProgressCount: document.getElementById("statusProgressCount"),
  statusDoneCount: document.getElementById("statusDoneCount"),
  importanceHighCount: document.getElementById("importanceHighCount"),
  managerCount: document.getElementById("managerCount"),
  recentTaskTableBody: document.getElementById("recentTaskTableBody"),
  mainEmptyState: document.getElementById("mainEmptyState"),
  calendarLabel: document.getElementById("calendarLabel"),
  calendarGrid: document.getElementById("calendarGrid"),
  prevMonthButton: document.getElementById("prevMonthButton"),
  nextMonthButton: document.getElementById("nextMonthButton"),
  taskTableBody: document.getElementById("taskTableBody"),
  scheduleEmptyState: document.getElementById("scheduleEmptyState"),
  statusFilter: document.getElementById("statusFilter"),
  importanceFilter: document.getElementById("importanceFilter"),
  managerFilter: document.getElementById("managerFilter"),
  detailTitle: document.getElementById("detailTitle"),
  detailSubtitle: document.getElementById("detailSubtitle"),
  detailView: document.getElementById("detailView"),
  detailActions: document.getElementById("detailActions"),
  taskForm: document.getElementById("taskForm"),
  taskIdInput: document.getElementById("taskId"),
  titleInput: document.getElementById("titleInput"),
  contentInput: document.getElementById("contentInput"),
  requestDateInput: document.getElementById("requestDateInput"),
  dueDateInput: document.getElementById("dueDateInput"),
  importanceInput: document.getElementById("importanceInput"),
  statusInput: document.getElementById("statusInput"),
  requesterInput: document.getElementById("requesterInput"),
  managerInput: document.getElementById("managerInput"),
  cancelEditButton: document.getElementById("cancelEditButton"),
  editTaskButton: document.getElementById("editTaskButton"),
  deleteTaskButton: document.getElementById("deleteTaskButton"),
  backToListButton: document.getElementById("backToListButton"),
  quickAddButton: document.getElementById("quickAddButton"),
  mainRefreshButton: document.getElementById("mainRefreshButton"),
  goScheduleFromMainButton: document.getElementById("goScheduleFromMainButton"),
  seedButton: document.getElementById("seedButton")
};

let tasks = loadTasks();
let selectedTaskId = null;
let calendarCursor = getMonthAnchor(new Date());
let taskFormMode = "create";
let mainLevel = "status";
let mainLevelValue = null;
let mainLevelOpen = false;
let mainListFilter = null;

if (tasks.length === 0) {
  tasks = cloneTasks(sampleTasks);
  saveTasks();
}

function cloneTasks(source) {
  return source.map((task) => ({ ...task }));
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const [year, month, day] = dateString.split("-");
  return `${year}.${month}.${day}`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getMonthAnchor(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function getTaskDateKey(task) {
  return task.dueDate || task.requestDate || "";
}

function getTaskSortValue(task) {
  const dueValue = task.dueDate ? new Date(task.dueDate).getTime() : 0;
  const updatedValue = task.updatedAt || task.createdAt || 0;
  return Math.max(dueValue, updatedValue);
}

function getFilteredTasks() {
  const statusFilter = elements.statusFilter.value;
  const importanceFilter = elements.importanceFilter.value;
  const managerFilter = elements.managerFilter.value.trim().toLowerCase();

  return tasks
    .filter((task) => {
      const statusMatch = statusFilter === "all" || task.status === statusFilter;
      const importanceMatch = importanceFilter === "all" || task.importance === importanceFilter;
      const managerMatch = managerFilter === "" || task.manager.toLowerCase().includes(managerFilter);
      return statusMatch && importanceMatch && managerMatch;
    })
    .sort((a, b) => getTaskSortValue(b) - getTaskSortValue(a));
}

function getMainLevelLabel(level) {
  if (level === "importance") {
    return "중요도";
  }

  if (level === "manager") {
    return "책임자";
  }

  return "진행상태";
}

function getMainLevelOptions(level) {
  if (level === "importance") {
    return [
      { value: "high", label: "즉시" },
      { value: "medium", label: "긴급" },
      { value: "low", label: "보통" }
    ];
  }

  if (level === "manager") {
    const managers = [...new Set(tasks.map((task) => task.manager.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
    return managers.map((manager) => ({ value: manager, label: manager }));
  }

  return [
    { value: "pending", label: "대기" },
    { value: "progress", label: "진행중" },
    { value: "hold", label: "보류" },
    { value: "done", label: "완료" }
  ];
}

function escapeAttr(text) {
  return escapeHtml(text).replace(/`/g, "&#96;");
}

function getMainListTasks() {
  let source = tasks;

  if (mainListFilter) {
    if (mainListFilter.type === "manager") {
      source = source.filter((task) => task.manager.trim() === mainListFilter.value);
    } else {
      source = source.filter((task) => task[mainListFilter.type] === mainListFilter.value);
    }
  }

  return [...source].sort((a, b) => getTaskSortValue(b) - getTaskSortValue(a));
}

function renderMainLevelTwo() {
  elements.levelTwoBox.classList.add("hidden");
}

function renderMainLevels() {
  elements.levelOneButtons.classList.remove("hidden");
  elements.levelTwoBox.classList.add("hidden");
  elements.levelOneButtons.innerHTML = `
    <button class="level-button${mainLevel === "status" ? " active" : ""}" type="button" data-level="status">진행상태</button>
    <button class="level-button${mainLevel === "importance" ? " active" : ""}" type="button" data-level="importance">중요도</button>
    <button class="level-button${mainLevel === "manager" ? " active" : ""}" type="button" data-level="manager">책임자</button>
  `;
}

function countBy(list, key) {
  return list.reduce((acc, item) => {
    acc[item[key]] = (acc[item[key]] || 0) + 1;
    return acc;
  }, {});
}

function getUniqueManagers(list) {
  return new Set(list.map((task) => task.manager.trim()).filter(Boolean)).size;
}

function setView(viewName) {
  elements.menuButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  if (viewName === "schedule") {
    elements.workspaceKicker.textContent = "WORK HISTORY SCHEDULE";
    elements.workspaceTitle.textContent = "일정관리";
  } else {
    mainLevel = "status";
    mainLevelValue = null;
    mainLevelOpen = false;
    mainListFilter = null;
    elements.workspaceKicker.textContent = "WORK HISTORY DASHBOARD";
    elements.workspaceTitle.textContent = "대시보드";
  }

  Object.entries(elements.views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });

  if (viewName === "schedule") {
    renderScheduleList();
    renderDetail();
  }
}

function statusBadgeClass(value) {
  return `badge ${value}`;
}

function renderSummaryCard(label, value, accent = false, filterType = "", filterValue = "", active = false) {
  return `
    <article class="stat-card summary-card${accent ? " accent" : ""}${active ? " active" : ""}"${filterType ? ` data-filter-type="${escapeAttr(filterType)}" data-filter-value="${escapeAttr(filterValue)}"` : ""}>
      <span class="stat-label">${escapeHtml(label)}</span>
      <strong class="stat-value">${escapeHtml(String(value))}</strong>
    </article>
  `;
}

function renderManagerSummaryTable() {
  const managers = [...new Set(tasks.map((task) => task.manager.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
  const statusOrder = ["pending", "progress", "hold", "done"];
  const statusNames = {
    pending: "대기",
    progress: "진행중",
    hold: "보류",
    done: "완료"
  };

  const headerCells = managers
    .map((manager) => {
      const active = mainListFilter?.type === "manager" && mainListFilter?.value === manager ? " active" : "";
      return `<th class="manager-column${active}" scope="col" data-filter-type="manager" data-filter-value="${escapeAttr(manager)}">${escapeHtml(manager)}</th>`;
    })
    .join("");

  const rows = statusOrder
    .map((status) => {
      const rowActive = mainListFilter?.type === "status" && mainListFilter?.value === status ? " active" : "";
      const totalCount = tasks.filter((task) => task.status === status).length;
      const cells = managers
        .map((manager) => {
          const count = tasks.filter((task) => task.manager.trim() === manager && task.status === status).length;
          return `<td data-filter-type="manager" data-filter-value="${escapeAttr(manager)}">${count}</td>`;
        })
        .join("");

      return `
        <tr class="${rowActive.trim()}" data-filter-type="status" data-filter-value="${status}">
          <th scope="row" class="status-column">${statusNames[status]}</th>
          <td class="overall-cell" data-filter-type="all" data-filter-value="all">${totalCount}</td>
          ${cells}
        </tr>
      `;
    })
    .join("");

  return `
    <article class="stat-card manager-summary">
      <table class="summary-table">
        <thead>
          <tr>
            <th class="status-column">진행상태</th>
            <th class="overall-column" data-filter-type="all" data-filter-value="all">전체</th>
            ${headerCells || `<th>등록된 책임자가 없습니다.</th>`}
          </tr>
        </thead>
        <tbody>
          ${managers.length > 0 ? rows : `<tr><td colspan="999">등록된 책임자가 없습니다.</td></tr>`}
        </tbody>
      </table>
    </article>
  `;
}

function applyMainListFilter(type, value) {
  if (type === "all") {
    clearMainListFilter();
    return;
  }

  mainListFilter = { type, value };
  renderRecentTasks();
  renderDashboard();
}

function clearMainListFilter() {
  mainListFilter = null;
  renderRecentTasks();
  renderDashboard();
}

function renderDashboard() {
  const statusCounts = countBy(tasks, "status");
  const importanceCounts = countBy(tasks, "importance");

  if (mainLevel === "status") {
    elements.dashboardArea.className = "dashboard";
    elements.dashboardArea.innerHTML = [
      renderSummaryCard("전체", tasks.length, false, "all", "all", !mainListFilter),
      renderSummaryCard("대기", statusCounts.pending || 0, true, "status", "pending", mainListFilter?.type === "status" && mainListFilter?.value === "pending"),
      renderSummaryCard("진행중", statusCounts.progress || 0, false, "status", "progress", mainListFilter?.type === "status" && mainListFilter?.value === "progress"),
      renderSummaryCard("보류", statusCounts.hold || 0, false, "status", "hold", mainListFilter?.type === "status" && mainListFilter?.value === "hold"),
      renderSummaryCard("완료", statusCounts.done || 0, false, "status", "done", mainListFilter?.type === "status" && mainListFilter?.value === "done")
    ].join("");
    return;
  }

  if (mainLevel === "importance") {
    elements.dashboardArea.className = "dashboard";
    elements.dashboardArea.innerHTML = [
      renderSummaryCard("전체", tasks.length, false, "all", "all", !mainListFilter),
      renderSummaryCard("긴급", importanceCounts.high || 0, true, "importance", "high", mainListFilter?.type === "importance" && mainListFilter?.value === "high"),
      renderSummaryCard("보통", importanceCounts.medium || 0, false, "importance", "medium", mainListFilter?.type === "importance" && mainListFilter?.value === "medium"),
      renderSummaryCard("낮음", importanceCounts.low || 0, false, "importance", "low", mainListFilter?.type === "importance" && mainListFilter?.value === "low")
    ].join("");
    return;
  }

  elements.dashboardArea.className = "dashboard manager-mode";
  elements.dashboardArea.innerHTML = renderManagerSummaryTable();
}

function renderRecentTasks() {
  const recentTasks = getMainListTasks();

  elements.recentTaskTableBody.innerHTML = "";
  elements.mainEmptyState.classList.toggle("hidden", recentTasks.length > 0);

  recentTasks.forEach((task) => {
    const row = document.createElement("tr");
    row.dataset.taskId = task.id;
    row.innerHTML = `
      <td>
        <span class="task-title">${escapeHtml(task.title)}</span>
        <span class="task-subtext">${escapeHtml(task.manager)} · ${escapeHtml(task.requester)}</span>
      </td>
      <td><span class="${statusBadgeClass(task.status)}">${statusLabels[task.status]}</span></td>
      <td><span class="badge ${task.importance}">${importanceLabels[task.importance]}</span></td>
      <td>${escapeHtml(formatDate(task.requestDate))}</td>
      <td>${escapeHtml(formatDate(task.dueDate))}</td>
    `;
    row.addEventListener("click", () => {
      openTaskDetail(task.id);
      setView("schedule");
    });
    elements.recentTaskTableBody.appendChild(row);
  });
}

function getCalendarTasksForDate(dateKey) {
  return tasks
    .filter((task) => getTaskDateKey(task) === dateKey)
    .sort((a, b) => {
      const left = ["high", "medium", "low"].indexOf(a.importance);
      const right = ["high", "medium", "low"].indexOf(b.importance);
      return left - right;
    });
}

function renderCalendar() {
  const year = calendarCursor.getFullYear();
  const month = calendarCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

  elements.calendarLabel.textContent = `${year}-${String(month + 1).padStart(2, "0")}`;
  elements.calendarGrid.innerHTML = "";

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - startDay + 1;
    const date = new Date(year, month, dayNumber);
    const inCurrentMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const cellTasks = inCurrentMonth ? getCalendarTasksForDate(dateKey) : [];

    const cell = document.createElement("div");
    cell.className = `calendar-cell${inCurrentMonth ? "" : " dimmed"}`;

    const dateLabel = document.createElement("div");
    dateLabel.className = "calendar-date";
    dateLabel.textContent = inCurrentMonth ? String(date.getDate()).padStart(2, "0") : "";
    cell.appendChild(dateLabel);

    const eventList = document.createElement("div");
    eventList.className = "calendar-event-list";

    cellTasks.slice(0, 3).forEach((task) => {
      const eventButton = document.createElement("button");
      eventButton.type = "button";
      eventButton.className = `calendar-event priority-${task.importance}`;
      eventButton.textContent = task.title;
      eventButton.addEventListener("click", (event) => {
        event.stopPropagation();
        openTaskDetail(task.id);
        setView("schedule");
      });
      eventList.appendChild(eventButton);
    });

    cell.appendChild(eventList);
    elements.calendarGrid.appendChild(cell);
  }
}

function renderScheduleList() {
  const filteredTasks = getFilteredTasks();

  elements.taskTableBody.innerHTML = "";
  elements.scheduleEmptyState.classList.toggle("hidden", filteredTasks.length > 0);

  filteredTasks.forEach((task) => {
    const row = document.createElement("tr");
    row.dataset.taskId = task.id;
    row.innerHTML = `
      <td>
        <span class="task-title">${escapeHtml(task.title)}</span>
        <span class="task-subtext">요청일 ${escapeHtml(formatDate(task.requestDate))}</span>
      </td>
      <td>${escapeHtml(task.requester)}</td>
      <td>${escapeHtml(task.manager)}</td>
      <td><span class="${statusBadgeClass(task.status)}">${statusLabels[task.status]}</span></td>
      <td>${escapeHtml(formatDate(task.dueDate))}</td>
    `;
    row.addEventListener("click", () => openTaskDetail(task.id));
    elements.taskTableBody.appendChild(row);
  });
}

function populateForm(task) {
  elements.taskIdInput.value = task?.id || "";
  elements.titleInput.value = task?.title || "";
  elements.contentInput.value = task?.content || "";
  elements.requestDateInput.value = task?.requestDate || todayValue();
  elements.dueDateInput.value = task?.dueDate || todayValue();
  elements.importanceInput.value = task?.importance || "medium";
  elements.statusInput.value = task?.status || "pending";
  elements.requesterInput.value = task?.requester || "";
  elements.managerInput.value = task?.manager || "";
}

function renderDetail() {
  if (taskFormMode === "create") {
    elements.detailTitle.textContent = "게시글 등록";
    elements.detailSubtitle.textContent = "새 업무를 등록합니다.";
    elements.detailView.className = "detail-view empty-detail";
    elements.detailView.innerHTML = "<p>아래 폼에 업무 내용을 입력하세요.</p>";
    elements.detailActions.classList.add("hidden");
    elements.taskForm.classList.remove("hidden");
    populateForm({
      requestDate: todayValue(),
      dueDate: todayValue(),
      importance: "medium",
      status: "pending"
    });
    return;
  }

  const task = tasks.find((entry) => entry.id === selectedTaskId);

  if (!task) {
    elements.detailTitle.textContent = "상세 화면";
    elements.detailSubtitle.textContent = "목록에서 게시글을 선택하세요.";
    elements.detailView.className = "detail-view empty-detail";
    elements.detailView.innerHTML = "<p>업무를 선택하면 상세 내용이 표시됩니다.</p>";
    elements.detailActions.classList.add("hidden");
    elements.taskForm.classList.add("hidden");
    return;
  }

  if (taskFormMode === "edit") {
    elements.detailTitle.textContent = "업무 수정";
    elements.detailSubtitle.textContent = "내용을 수정한 뒤 저장하세요.";
    elements.detailView.className = "detail-view";
    elements.detailView.innerHTML = "<p>수정 폼을 사용 중입니다.</p>";
    elements.detailActions.classList.add("hidden");
    elements.taskForm.classList.remove("hidden");
    populateForm(task);
    return;
  }

  elements.detailTitle.textContent = task.title;
  elements.detailSubtitle.textContent = `${task.manager} 책임자 업무 상세`;
  elements.detailView.className = "detail-view";
  elements.detailView.innerHTML = `
    <p class="detail-title">${escapeHtml(task.title)}</p>
    <div class="detail-meta">
      <div class="detail-row">
        <div class="detail-label">내용</div>
        <div class="detail-value">${escapeHtml(task.content)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">요청일</div>
        <div class="detail-value">${escapeHtml(formatDate(task.requestDate))}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">마감기한</div>
        <div class="detail-value">${escapeHtml(formatDate(task.dueDate))}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">중요도</div>
        <div class="detail-value"><span class="${statusBadgeClass(task.importance)}">${importanceLabels[task.importance]}</span></div>
      </div>
      <div class="detail-row">
        <div class="detail-label">요청자</div>
        <div class="detail-value">${escapeHtml(task.requester)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">책임자</div>
        <div class="detail-value">${escapeHtml(task.manager)}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">작업상태</div>
        <div class="detail-value"><span class="${statusBadgeClass(task.status)}">${statusLabels[task.status]}</span></div>
      </div>
    </div>
  `;
  elements.taskForm.classList.add("hidden");
  elements.detailActions.classList.remove("hidden");
}

function openTaskDetail(taskId) {
  selectedTaskId = taskId;
  taskFormMode = "view";
  renderDetail();
}

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function openCreateForm() {
  selectedTaskId = null;
  taskFormMode = "create";
  setView("schedule");
  renderDetail();
}

function resetFormMode() {
  taskFormMode = "view";
  elements.taskForm.classList.add("hidden");
  renderDetail();
}

function syncCalendarToTask(taskId) {
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task || !task.dueDate) {
    return;
  }

  calendarCursor = getMonthAnchor(new Date(task.dueDate));
}

function renderAll() {
  renderMainLevels();
  renderDashboard();
  renderRecentTasks();
  renderCalendar();
  renderScheduleList();
  renderDetail();
}

function upsertTaskFromForm(event) {
  event.preventDefault();

  const payload = {
    title: elements.titleInput.value.trim(),
    content: elements.contentInput.value.trim(),
    requestDate: elements.requestDateInput.value,
    dueDate: elements.dueDateInput.value,
    importance: elements.importanceInput.value,
    status: elements.statusInput.value,
    requester: elements.requesterInput.value.trim(),
    manager: elements.managerInput.value.trim()
  };

  if (!payload.title || !payload.content || !payload.requestDate || !payload.dueDate || !payload.requester || !payload.manager) {
    window.alert("모든 항목을 입력해주세요.");
    return;
  }

  if (new Date(payload.dueDate) < new Date(payload.requestDate)) {
    window.alert("마감기한은 요청일보다 같거나 늦어야 합니다.");
    return;
  }

  if (taskFormMode === "edit" && selectedTaskId) {
    const target = tasks.find((task) => task.id === selectedTaskId);
    if (!target) {
      return;
    }

    Object.assign(target, payload, { updatedAt: Date.now() });
  } else {
    const newTask = {
      id: createId(),
      ...payload,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    tasks.unshift(newTask);
    selectedTaskId = newTask.id;
  }

  saveTasks();
  taskFormMode = "view";
  syncCalendarToTask(selectedTaskId);
  renderAll();
  setView("schedule");
  openTaskDetail(selectedTaskId);
}

function deleteCurrentTask() {
  const task = tasks.find((entry) => entry.id === selectedTaskId);
  if (!task) {
    return;
  }

  const confirmed = window.confirm(`"${task.title}" 업무를 삭제할까요?`);
  if (!confirmed) {
    return;
  }

  tasks = tasks.filter((entry) => entry.id !== selectedTaskId);
  selectedTaskId = null;
  taskFormMode = "view";
  saveTasks();
  renderAll();
}

function restoreSamples() {
  const confirmed = window.confirm("샘플 데이터를 다시 불러올까요? 현재 저장된 업무는 샘플로 교체됩니다.");
  if (!confirmed) {
    return;
  }

  tasks = cloneTasks(sampleTasks);
  selectedTaskId = tasks[0]?.id || null;
  taskFormMode = "view";
  calendarCursor = getMonthAnchor(new Date(tasks[0]?.dueDate || new Date()));
  saveTasks();
  renderAll();
}

elements.menuButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

elements.levelOneButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const level = button.dataset.level;

  if (level) {
    mainLevel = level;
    mainLevelValue = null;
    mainLevelOpen = false;
    mainListFilter = null;
    renderAll();
  }
});

elements.dashboardArea.addEventListener("click", (event) => {
  const target = event.target.closest("[data-filter-type][data-filter-value]");
  if (!target) {
    return;
  }

  const filterType = target.dataset.filterType;
  const filterValue = target.dataset.filterValue;

  if (filterType && filterValue) {
    applyMainListFilter(filterType, filterValue);
  }
});

elements.mainRefreshButton.addEventListener("click", () => {
  clearMainListFilter();
});

elements.prevMonthButton.addEventListener("click", () => {
  calendarCursor = addMonths(calendarCursor, -1);
  renderCalendar();
});

elements.nextMonthButton.addEventListener("click", () => {
  calendarCursor = addMonths(calendarCursor, 1);
  renderCalendar();
});

elements.statusFilter.addEventListener("change", renderScheduleList);
elements.importanceFilter.addEventListener("change", renderScheduleList);
elements.managerFilter.addEventListener("input", renderScheduleList);

elements.quickAddButton.addEventListener("click", openCreateForm);
elements.goScheduleFromMainButton.addEventListener("click", () => setView("schedule"));
elements.seedButton.addEventListener("click", restoreSamples);

elements.taskForm.addEventListener("submit", upsertTaskFromForm);
elements.cancelEditButton.addEventListener("click", resetFormMode);
elements.editTaskButton.addEventListener("click", () => {
  const task = tasks.find((entry) => entry.id === selectedTaskId);
  if (!task) {
    return;
  }

  taskFormMode = "edit";
  renderDetail();
});
elements.deleteTaskButton.addEventListener("click", deleteCurrentTask);
elements.backToListButton.addEventListener("click", () => {
  selectedTaskId = null;
  taskFormMode = "view";
  renderDetail();
});

window.addEventListener("storage", () => {
  tasks = loadTasks();
  renderAll();
});

renderAll();
setView("main");
