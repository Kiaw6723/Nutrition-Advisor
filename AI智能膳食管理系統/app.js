/* ============================================
 * 應用程式主邏輯
 * ============================================ */

const STATE = {
  gender: 'male',
  age: 30,
  height: 170,
  weight: 65,
  activity: 'sedentary',
  goal: 'maintain',
  conditions: [],
  userName: '',
  theme: 'auto',
  useOllama: false,
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.1',
  result: null,
};

// ── 啟動 ─────────────────────────────
document.addEventListener('DOMContentLoaded', init);

function init() {
  loadState();
  bindFormInputs();
  bindNavigation();
  bindGenerateButton();
  bindFoodSearch();
  bindSettings();
  bindKeyboard();
  applyTheme();
  applyState();
  recalcMetrics();
}

// ── 持久化 ───────────────────────────
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem('mealAppState') || '{}');
    Object.assign(STATE, saved);
  } catch {}
}

function saveState() {
  const persist = {
    gender: STATE.gender, age: STATE.age, height: STATE.height,
    weight: STATE.weight, activity: STATE.activity, goal: STATE.goal,
    conditions: STATE.conditions, userName: STATE.userName, theme: STATE.theme,
    useOllama: STATE.useOllama, ollamaEndpoint: STATE.ollamaEndpoint,
    ollamaModel: STATE.ollamaModel,
  };
  localStorage.setItem('mealAppState', JSON.stringify(persist));
}

function applyState() {
  document.getElementById('age').value = STATE.age;
  document.getElementById('height').value = STATE.height;
  document.getElementById('weight').value = STATE.weight;

  // Segmented controls
  setSegmentActive('gender', STATE.gender);
  setActivityActive(STATE.activity);
  setGoalActive(STATE.goal);

  // Chips
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('active', STATE.conditions.includes(chip.dataset.condition));
  });

  // Greeting
  document.getElementById('greetingName').textContent = STATE.userName || '朋友';

  // Settings
  document.getElementById('userName').value = STATE.userName;
  document.getElementById('useOllama').checked = STATE.useOllama;
  document.getElementById('ollamaEndpoint').value = STATE.ollamaEndpoint;
  document.getElementById('ollamaModel').value = STATE.ollamaModel;
  document.getElementById('ollamaSettings').classList.toggle('active', STATE.useOllama);
  setSegmentActive('theme', STATE.theme);
}

function setSegmentActive(field, value) {
  document.querySelectorAll(`.segmented[data-field="${field}"] .seg-option, [data-field="${field}"].segmented .seg-option`)
    .forEach((b) => b.classList.toggle('active', b.dataset.value === value));
}

function setActivityActive(value) {
  document.querySelectorAll('[data-field="activity"] .activity-card')
    .forEach((b) => b.classList.toggle('active', b.dataset.value === value));
}

function setGoalActive(value) {
  document.querySelectorAll('[data-field="goal"] .goal-card')
    .forEach((b) => b.classList.toggle('active', b.dataset.value === value));
}

// ── 表單綁定 ──────────────────────
function bindFormInputs() {
  // 性別
  document.querySelectorAll('[data-field="gender"] .seg-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.gender = btn.dataset.value;
      setSegmentActive('gender', STATE.gender);
      recalcMetrics();
      saveState();
    });
  });

  // 活動量
  document.querySelectorAll('[data-field="activity"] .activity-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.activity = btn.dataset.value;
      setActivityActive(STATE.activity);
      recalcMetrics();
      saveState();
    });
  });

  // 目標
  document.querySelectorAll('[data-field="goal"] .goal-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.goal = btn.dataset.value;
      setGoalActive(STATE.goal);
      recalcMetrics();
      saveState();
    });
  });

  // 數值輸入
  ['age', 'height', 'weight'].forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      const v = parseFloat(el.value);
      if (!isNaN(v)) STATE[id] = v;
      recalcMetrics();
      saveState();
    });
  });

  // 慢性病
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const cond = chip.dataset.condition;
      if (STATE.conditions.includes(cond)) {
        STATE.conditions = STATE.conditions.filter((c) => c !== cond);
      } else {
        STATE.conditions.push(cond);
      }
      chip.classList.toggle('active');
      saveState();
    });
  });
}

// ── 分頁切換 ──────────────────────
function bindNavigation() {
  document.querySelectorAll('.nav-item').forEach((nav) => {
    nav.addEventListener('click', () => {
      const tab = nav.dataset.tab;
      document.querySelectorAll('.nav-item').forEach((n) => n.classList.toggle('active', n === nav));
      document.querySelectorAll('.tab-content').forEach((c) =>
        c.classList.toggle('active', c.dataset.content === tab)
      );
      document.querySelector('.main').scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

// ── 即時生理指標計算 ────────────
function recalcMetrics() {
  const { gender, age, height, weight, activity } = STATE;
  if (!age || !height || !weight) return;

  const bmi = AIEngine.calcBMI(weight, height);
  const cls = AIEngine.classifyBMI(bmi);
  const bmr = AIEngine.calcBMR(gender, weight, height, age);
  const tdee = AIEngine.calcTDEE(bmr, activity);
  const ideal = 22 * (height / 100) ** 2;

  document.getElementById('bmiValue').textContent = bmi.toFixed(1);
  const tag = document.getElementById('bmiTag');
  tag.textContent = cls.label;
  tag.className = 'metric-tag ' + cls.tag;

  // BMI bar position (clamp 15~40)
  const pct = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));
  document.getElementById('bmiBar').style.width = pct + '%';

  document.getElementById('bmrValue').textContent = Math.round(bmr);
  document.getElementById('tdeeValue').textContent = Math.round(tdee);
  document.getElementById('idealWeight').textContent = ideal.toFixed(1);

  // Hero pills
  document.getElementById('heroBmi').textContent = bmi.toFixed(1);
  document.getElementById('heroTdee').textContent = Math.round(tdee);
}

// ── 生成建議 ──────────────────────
function bindGenerateButton() {
  document.getElementById('generateBtn').addEventListener('click', generate);
}

async function generate() {
  const btn = document.getElementById('generateBtn');
  btn.disabled = true;
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<div class="loader" style="width:18px;height:18px;border-width:2px;"></div><span>生成中…</span>';

  // 切到 AI 建議分頁並顯示載入
  document.querySelector('[data-tab="recommendation"]').click();
  const recoContent = document.getElementById('recommendationContent');
  recoContent.innerHTML = `
    <div class="loading-state">
      <div class="loader"></div>
      <div class="loading-text">${STATE.useOllama ? '正在連線本地 AI 模型分析…' : '正在綜合臨床指南分析…'}</div>
    </div>
  `;

  // 短暫延遲提升體驗
  await new Promise((r) => setTimeout(r, 400));

  let result = AIEngine.generate(STATE);

  // 嘗試 Ollama
  if (STATE.useOllama) {
    try {
      result = await AIEngine.generateWithOllama(STATE, result, STATE.ollamaEndpoint, STATE.ollamaModel);
      if (result.aiSource === 'ollama') showToast('已使用本地 AI 模型生成個人化建議');
    } catch (err) {
      console.warn('Ollama failed:', err);
      showToast('本地 AI 暫不可用，已切換到內建推論引擎');
    }
  }

  STATE.result = result;
  renderRecommendation(result);
  renderMealPlan(result);

  btn.disabled = false;
  btn.innerHTML = originalHtml;
}

// ── 渲染建議 ──────────────────────
function renderRecommendation(result) {
  const { metrics, profile, macros, sodiumLimit, intro } = result;
  const aiBadge = result.aiSource === 'ollama' ? '本地 AI · Ollama' : '內建推論引擎';

  const html = `
    <div class="report">
      <!-- Hero -->
      <div class="report-hero">
        <div class="report-badge">
          <span>AI 營養師建議</span>
          <span style="opacity:0.6;font-weight:500;margin-left:6px;">· ${aiBadge}</span>
        </div>
        <h2 class="report-title">您的個人化飲食策略</h2>
        <p class="report-intro">${intro}</p>
      </div>

      <!-- 熱量目標 -->
      <div class="report-section">
        <h3 class="section-title">每日熱量目標</h3>
        <div class="section-content">
          <p>若以「${goalLabel(STATE.goal)}」為目標，建議每日攝取熱量為：</p>
          <div style="display:flex;align-items:baseline;gap:8px;margin:14px 0;">
            <span style="font-size:42px;font-weight:800;letter-spacing:-0.03em;background:linear-gradient(135deg,var(--ios-blue),var(--ios-purple));-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;">${metrics.targetKcal}</span>
            <span style="font-size:15px;color:var(--text-tertiary);font-weight:500;">kcal / 天</span>
          </div>
          <p style="font-size:13.5px;color:var(--text-tertiary);">基於您的 BMR (${metrics.bmr}) × 活動係數 = TDEE (${metrics.tdee})${STATE.goal !== 'maintain' ? `，並依目標調整 ${metrics.targetKcal - metrics.tdee > 0 ? '+' : ''}${metrics.targetKcal - metrics.tdee} kcal` : ''}</p>
        </div>
      </div>

      <!-- 三大營養素 -->
      <div class="report-section">
        <h3 class="section-title">三大營養素比例</h3>
        <div class="section-content">
          <p>採用<strong>${profile.diet}</strong>的營養素分配原則：</p>
          <div class="macro-grid">
            <div class="macro-card macro-carbs">
              <div class="macro-header">
                <div>
                  <div class="macro-name">醣類 Carbs</div>
                  <div class="macro-grams">${macros.carbs.grams} g</div>
                </div>
                <div class="macro-percent">${macros.carbs.percent}<span style="font-size:13px;color:var(--text-tertiary);">%</span></div>
              </div>
              <div class="macro-bar"><div class="macro-bar-fill" style="width:${macros.carbs.percent}%;"></div></div>
            </div>
            <div class="macro-card macro-protein">
              <div class="macro-header">
                <div>
                  <div class="macro-name">蛋白質 Protein</div>
                  <div class="macro-grams">${macros.protein.grams} g</div>
                </div>
                <div class="macro-percent">${macros.protein.percent}<span style="font-size:13px;color:var(--text-tertiary);">%</span></div>
              </div>
              <div class="macro-bar"><div class="macro-bar-fill" style="width:${macros.protein.percent}%;"></div></div>
            </div>
            <div class="macro-card macro-fat">
              <div class="macro-header">
                <div>
                  <div class="macro-name">脂肪 Fat</div>
                  <div class="macro-grams">${macros.fat.grams} g</div>
                </div>
                <div class="macro-percent">${macros.fat.percent}<span style="font-size:13px;color:var(--text-tertiary);">%</span></div>
              </div>
              <div class="macro-bar"><div class="macro-bar-fill" style="width:${macros.fat.percent}%;"></div></div>
            </div>
          </div>
          <div class="warning-card" style="background:rgba(0,122,255,0.06);border-color:rgba(0,122,255,0.18);">
            <div class="warning-icon">🧂</div>
            <div class="warning-body"><strong>鈉攝取上限：</strong>每日不超過 <strong>${sodiumLimit} mg</strong>（約 ${(sodiumLimit / 400).toFixed(1)} 公克鹽）</div>
          </div>
        </div>
      </div>

      <!-- 飲食原則 -->
      <div class="report-section">
        <h3 class="section-title">飲食原則</h3>
        <div class="section-content">
          <ol>
            ${profile.principles.map((p) => `<li>${p}</li>`).join('')}
          </ol>
        </div>
      </div>

      <!-- 推薦與避免 -->
      <div class="report-section">
        <h3 class="section-title">食物紅綠燈</h3>
        <div class="food-list-grid">
          <div class="food-list good">
            <div class="food-list-title">✓ 推薦食用</div>
            <div class="food-tags">
              ${profile.recommend.map((f) => `<span class="food-tag">${f}</span>`).join('')}
            </div>
          </div>
          <div class="food-list bad">
            <div class="food-list-title">✗ 應避免</div>
            <div class="food-tags">
              ${profile.avoid.map((f) => `<span class="food-tag">${f}</span>`).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- 實用小撇步 -->
      <div class="report-section">
        <h3 class="section-title">日常實踐撇步</h3>
        <div class="tip-list">
          ${profile.tips.map((t) => `
            <div class="tip-item">
              <div class="tip-icon">${t.icon}</div>
              <div class="tip-text">${t.text}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 風險警示 -->
      ${STATE.conditions.length > 0 ? `
        <div class="report-section">
          <h3 class="section-title">⚠️ 重要提醒</h3>
          <div class="warning-card danger">
            <div class="warning-icon">🩺</div>
            <div class="warning-body">
              <strong>本系統提供的所有建議僅供參考，不能取代專業醫療診斷。</strong><br>
              請務必與您的主治醫師或臨床營養師討論，依個人實際狀況進行調整。若有藥物服用，飲食可能會影響藥效，請特別留意。
            </div>
          </div>
        </div>
      ` : ''}

      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:16px 0;">
        <button class="btn-primary" onclick="document.querySelector('[data-tab=meal-plan]').click()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          查看一日菜單
        </button>
        <button class="btn-secondary" onclick="document.querySelector('[data-tab=food-check]').click()">
          食物風險查詢
        </button>
        <button class="btn-secondary" onclick="window.print()">
          列印報告
        </button>
      </div>
    </div>
  `;

  document.getElementById('recommendationContent').innerHTML = html;
}

function renderMealPlan(result) {
  const { mealPlan, metrics } = result;
  const html = `
    <div class="report-hero" style="margin-bottom:20px;">
      <div class="report-badge"><span>個人化菜單</span></div>
      <h2 class="report-title">您的一日參考菜單</h2>
      <p class="report-intro">總熱量 <strong>${metrics.targetKcal} kcal</strong>，已依您的健康狀況調整食材選擇與烹調方式。實際食用份量可依您的飢餓感與活動量微調。</p>
    </div>

    <div class="meal-plan-grid">
      ${mealPlan.map((meal) => `
        <div class="meal-card">
          <div class="meal-header">
            <div class="meal-emoji">${meal.emoji}</div>
            <div>
              <div class="meal-name">${meal.name}</div>
              <div class="meal-kcal">約 ${meal.kcal} kcal</div>
            </div>
          </div>
          <div class="meal-items">
            ${meal.items.map((item) => `
              <div class="meal-item">
                <div class="meal-item-bullet"></div>
                <span>${item}</span>
              </div>
            `).join('')}
          </div>
          <div class="meal-tips">💡 ${meal.tips}</div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('mealPlanContent').innerHTML = html;
}

function goalLabel(g) {
  return { maintain: '維持體重', lose: '健康減重', gain: '健康增重', muscle: '增肌減脂' }[g] || '健康管理';
}

// ── 食物搜尋 ──────────────────────
function bindFoodSearch() {
  const input = document.getElementById('foodSearch');
  let timer = null;

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => doFoodSearch(input.value), 250);
  });

  document.querySelectorAll('.quick-food').forEach((btn) => {
    btn.addEventListener('click', () => {
      input.value = btn.dataset.food;
      doFoodSearch(btn.dataset.food);
    });
  });
}

function doFoodSearch(query) {
  const container = document.getElementById('foodResult');
  if (!query.trim()) {
    container.innerHTML = '';
    return;
  }

  const food = lookupFood(query);
  if (!food) {
    container.innerHTML = `
      <div class="food-result" style="text-align:center;">
        <div style="font-size:48px;margin-bottom:8px;">🔍</div>
        <h3 style="font-size:18px;margin-bottom:6px;">找不到「${escapeHtml(query)}」</h3>
        <p style="color:var(--text-tertiary);font-size:14px;">資料庫目前收錄約 50 種常見食物，可嘗試輸入：白飯、雞胸肉、珍珠奶茶等。</p>
      </div>
    `;
    return;
  }

  const risk = assessFoodRisk(food, STATE.conditions);
  const verdictText = { safe: '可安心食用', caution: '需注意份量', danger: '建議避免' };
  const verdictEmoji = { safe: '✅', caution: '⚠️', danger: '🚫' };

  container.innerHTML = `
    <div class="food-result ${risk.verdict}">
      <div class="food-result-header">
        <div class="food-result-icon">${verdictEmoji[risk.verdict]}</div>
        <div>
          <div class="food-result-name">${food.name}</div>
          <div class="food-result-verdict ${risk.verdict}">${verdictText[risk.verdict]}</div>
          <div style="font-size:12.5px;color:var(--text-tertiary);margin-top:4px;">類別：${food.data.category}</div>
        </div>
      </div>

      <div class="nutrition-grid">
        <div class="nutri-cell"><div class="nutri-label">熱量</div><div class="nutri-value">${food.data.kcal}<span class="nutri-unit">kcal</span></div></div>
        <div class="nutri-cell"><div class="nutri-label">醣類</div><div class="nutri-value">${food.data.carbs}<span class="nutri-unit">g</span></div></div>
        <div class="nutri-cell"><div class="nutri-label">蛋白質</div><div class="nutri-value">${food.data.protein}<span class="nutri-unit">g</span></div></div>
        <div class="nutri-cell"><div class="nutri-label">脂肪</div><div class="nutri-value">${food.data.fat}<span class="nutri-unit">g</span></div></div>
        <div class="nutri-cell"><div class="nutri-label">鈉</div><div class="nutri-value">${food.data.sodium}<span class="nutri-unit">mg</span></div></div>
        <div class="nutri-cell"><div class="nutri-label">糖</div><div class="nutri-value">${food.data.sugar}<span class="nutri-unit">g</span></div></div>
      </div>

      <p style="font-size:12px;color:var(--text-tertiary);margin-bottom:12px;">營養數據以每 100g 計</p>

      <div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">健康評估</div>
      <div class="advice-list">
        ${risk.reasons.map((r) => `
          <div class="advice-item ${r.level === 2 ? 'danger' : r.level === 1 ? 'warn' : 'good'}">
            <strong style="color:var(--text-primary);">${r.condition}：</strong>${r.text}
          </div>
        `).join('')}
      </div>

      ${risk.suggestions.length > 0 ? `
        <div style="margin-top:14px;font-size:14px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">建議</div>
        <ul style="padding-left:20px;font-size:14px;color:var(--text-secondary);line-height:1.7;">
          ${risk.suggestions.map((s) => `<li>${s}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
  `;
}

// ── 設定彈窗 ──────────────────────
function bindSettings() {
  const modal = document.getElementById('settingsModal');
  const openBtn = document.getElementById('settingsBtn');
  const closeBtn = document.getElementById('closeSettings');

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Ollama toggle
  document.getElementById('useOllama').addEventListener('change', (e) => {
    STATE.useOllama = e.target.checked;
    document.getElementById('ollamaSettings').classList.toggle('active', STATE.useOllama);
    updateAIStatus();
    saveState();
  });

  document.getElementById('ollamaEndpoint').addEventListener('input', (e) => {
    STATE.ollamaEndpoint = e.target.value;
    saveState();
  });

  document.getElementById('ollamaModel').addEventListener('input', (e) => {
    STATE.ollamaModel = e.target.value;
    saveState();
  });

  document.getElementById('testOllama').addEventListener('click', async () => {
    const btn = document.getElementById('testOllama');
    const result = document.getElementById('ollamaTestResult');
    btn.disabled = true;
    btn.textContent = '測試中…';
    result.innerHTML = '';

    const r = await AIEngine.checkOllama(STATE.ollamaEndpoint);
    btn.disabled = false;
    btn.textContent = '測試連線';

    if (r.ok) {
      const hasModel = r.models.some((m) => m.includes(STATE.ollamaModel) || STATE.ollamaModel.includes(m.split(':')[0]));
      result.innerHTML = `
        <div style="margin-top:8px;padding:10px 12px;background:rgba(52,199,89,0.1);border-radius:10px;font-size:13px;">
          <strong style="color:var(--ios-green);">✓ 連線成功</strong><br>
          可用模型：${r.models.join('、') || '（無）'}
          ${!hasModel && r.models.length > 0 ? `<br><span style="color:var(--ios-orange);">⚠️ 找不到「${STATE.ollamaModel}」模型，請從上方清單中選擇</span>` : ''}
        </div>
      `;
    } else {
      result.innerHTML = `
        <div style="margin-top:8px;padding:10px 12px;background:rgba(255,59,48,0.08);border-radius:10px;font-size:13px;">
          <strong style="color:var(--ios-red);">✗ 連線失敗</strong><br>
          請確認 Ollama 正在執行：終端機輸入 <code>ollama serve</code><br>
          並至少安裝一個模型：<code>ollama pull llama3.1</code>
        </div>
      `;
    }
  });

  // 使用者名稱
  document.getElementById('userName').addEventListener('input', (e) => {
    STATE.userName = e.target.value;
    document.getElementById('greetingName').textContent = e.target.value || '朋友';
    saveState();
  });

  // 主題
  document.querySelectorAll('[data-field="theme"] .seg-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.theme = btn.dataset.value;
      setSegmentActive('theme', STATE.theme);
      applyTheme();
      saveState();
    });
  });
}

function applyTheme() {
  if (STATE.theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', STATE.theme);
  }
}

function updateAIStatus() {
  const status = document.getElementById('aiStatus');
  const text = status.querySelector('.status-text');
  if (STATE.useOllama) {
    status.classList.add('ollama-connected');
    text.textContent = '本地 AI';
  } else {
    status.classList.remove('ollama-connected');
    text.textContent = '內建 AI';
  }
}

// ── 鍵盤捷徑 ──────────────────────
function bindKeyboard() {
  document.addEventListener('keydown', (e) => {
    // Cmd/Ctrl + Enter 生成
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      generate();
    }
    // ESC 關閉彈窗
    if (e.key === 'Escape') {
      document.getElementById('settingsModal').classList.remove('active');
    }
  });
}

// ── 工具函式 ──────────────────────
function showToast(message, duration = 2800) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
