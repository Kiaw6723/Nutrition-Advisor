/* ============================================
 * 食物資料庫 (簡化版台灣常見食物)
 * 數值參考：衛福部食藥署食品營養成分資料庫 (約略值)
 * 單位：每 100g 可食部分 (除非另註)
 * ============================================ */

const FOOD_DATABASE = {
  // ── 主食類 ──────────────────────────
  '白飯':       { kcal: 183, carbs: 41,  protein: 3.1, fat: 0.3, sodium: 1,    fiber: 0.6, sugar: 0,   purine: 'low',    gi: 84, category: '主食' },
  '糙米飯':     { kcal: 178, carbs: 38,  protein: 3.5, fat: 1.3, sodium: 1,    fiber: 2.2, sugar: 0.3, purine: 'low',    gi: 56, category: '主食' },
  '白吐司':     { kcal: 297, carbs: 53,  protein: 9.0, fat: 5.0, sodium: 480,  fiber: 2.3, sugar: 5,   purine: 'low',    gi: 75, category: '主食' },
  '全麥吐司':   { kcal: 252, carbs: 43,  protein: 10,  fat: 4.2, sodium: 400,  fiber: 6,   sugar: 4,   purine: 'low',    gi: 51, category: '主食' },
  '地瓜':       { kcal: 121, carbs: 28,  protein: 1.3, fat: 0.2, sodium: 50,   fiber: 2.5, sugar: 7,   purine: 'low',    gi: 70, category: '主食' },
  '麵包':       { kcal: 290, carbs: 50,  protein: 9,   fat: 6,   sodium: 450,  fiber: 2,   sugar: 8,   purine: 'low',    gi: 75, category: '主食' },
  '泡麵':       { kcal: 450, carbs: 60,  protein: 9,   fat: 18,  sodium: 1800, fiber: 2,   sugar: 3,   purine: 'low',    gi: 73, category: '主食' },
  '陽春麵':     { kcal: 220, carbs: 42,  protein: 7,   fat: 2,   sodium: 800,  fiber: 1.5, sugar: 1,   purine: 'low',    gi: 60, category: '主食' },
  '牛肉麵':     { kcal: 480, carbs: 58,  protein: 28,  fat: 14,  sodium: 2300, fiber: 3,   sugar: 4,   purine: 'high',   gi: 65, category: '湯麵' },
  '燕麥':       { kcal: 389, carbs: 66,  protein: 17,  fat: 7,   sodium: 2,    fiber: 11,  sugar: 1,   purine: 'low',    gi: 55, category: '主食' },

  // ── 肉類 / 蛋白質 ─────────────────
  '雞胸肉':     { kcal: 110, carbs: 0,   protein: 23,  fat: 1.2, sodium: 60,   fiber: 0,   sugar: 0,   purine: 'medium', gi: 0,  category: '蛋白質' },
  '雞腿':       { kcal: 190, carbs: 0,   protein: 18,  fat: 13,  sodium: 80,   fiber: 0,   sugar: 0,   purine: 'medium', gi: 0,  category: '蛋白質' },
  '牛肉':       { kcal: 250, carbs: 0,   protein: 26,  fat: 17,  sodium: 60,   fiber: 0,   sugar: 0,   purine: 'high',   gi: 0,  category: '蛋白質' },
  '豬肉':       { kcal: 242, carbs: 0,   protein: 27,  fat: 14,  sodium: 60,   fiber: 0,   sugar: 0,   purine: 'medium', gi: 0,  category: '蛋白質' },
  '紅燒肉':     { kcal: 380, carbs: 8,   protein: 18,  fat: 30,  sodium: 900,  fiber: 0,   sugar: 8,   purine: 'high',   gi: 0,  category: '蛋白質' },
  '培根':       { kcal: 540, carbs: 1.4, protein: 37,  fat: 42,  sodium: 1700, fiber: 0,   sugar: 1,   purine: 'high',   gi: 0,  category: '加工肉' },
  '香腸':       { kcal: 350, carbs: 5,   protein: 14,  fat: 30,  sodium: 1200, fiber: 0,   sugar: 4,   purine: 'high',   gi: 0,  category: '加工肉' },
  '雞蛋':       { kcal: 143, carbs: 0.7, protein: 13,  fat: 9.5, sodium: 140,  fiber: 0,   sugar: 0,   purine: 'low',    gi: 0,  category: '蛋白質' },
  '豆腐':       { kcal: 81,  carbs: 1.9, protein: 8.1, fat: 4.8, sodium: 12,   fiber: 0.7, sugar: 0,   purine: 'low',    gi: 15, category: '蛋白質' },
  '黃豆':       { kcal: 446, carbs: 30,  protein: 36,  fat: 20,  sodium: 2,    fiber: 9,   sugar: 7,   purine: 'high',   gi: 18, category: '蛋白質' },

  // ── 海鮮 ─────────────────────────
  '鮭魚':       { kcal: 208, carbs: 0,   protein: 20,  fat: 13,  sodium: 50,   fiber: 0,   sugar: 0,   purine: 'medium', gi: 0,  category: '海鮮' },
  '蝦':         { kcal: 99,  carbs: 0.2, protein: 24,  fat: 0.3, sodium: 110,  fiber: 0,   sugar: 0,   purine: 'high',   gi: 0,  category: '海鮮' },
  '蛤蜊':       { kcal: 86,  carbs: 4.4, protein: 14,  fat: 1.0, sodium: 600,  fiber: 0,   sugar: 0,   purine: 'high',   gi: 0,  category: '海鮮' },
  '吻仔魚':     { kcal: 76,  carbs: 0,   protein: 16,  fat: 1.2, sodium: 700,  fiber: 0,   sugar: 0,   purine: 'high',   gi: 0,  category: '海鮮' },
  '鯖魚':       { kcal: 245, carbs: 0,   protein: 19,  fat: 18,  sodium: 90,   fiber: 0,   sugar: 0,   purine: 'high',   gi: 0,  category: '海鮮' },

  // ── 蔬菜 ────────────────────────
  '青菜':       { kcal: 22,  carbs: 3.6, protein: 2.5, fat: 0.3, sodium: 35,   fiber: 2.2, sugar: 1,   purine: 'low',    gi: 15, category: '蔬菜' },
  '青花菜':     { kcal: 28,  carbs: 4.4, protein: 3.7, fat: 0.2, sodium: 18,   fiber: 3.1, sugar: 1.5, purine: 'low',    gi: 15, category: '蔬菜' },
  '高麗菜':     { kcal: 23,  carbs: 4.8, protein: 1.3, fat: 0.1, sodium: 16,   fiber: 1.1, sugar: 3,   purine: 'low',    gi: 10, category: '蔬菜' },
  '菠菜':       { kcal: 18,  carbs: 2.4, protein: 2.2, fat: 0.5, sodium: 54,   fiber: 1.9, sugar: 0,   purine: 'medium', gi: 15, category: '蔬菜' },
  '番茄':       { kcal: 19,  carbs: 4.1, protein: 0.9, fat: 0.2, sodium: 9,    fiber: 1.2, sugar: 2.6, purine: 'low',    gi: 15, category: '蔬菜' },
  '香菇':       { kcal: 39,  carbs: 7.0, protein: 3.0, fat: 0.4, sodium: 8,    fiber: 3.8, sugar: 2.4, purine: 'high',   gi: 10, category: '蔬菜' },
  '蘆筍':       { kcal: 22,  carbs: 4.0, protein: 2.4, fat: 0.2, sodium: 4,    fiber: 1.4, sugar: 1.9, purine: 'high',   gi: 15, category: '蔬菜' },
  '紫菜':       { kcal: 250, carbs: 50,  protein: 26,  fat: 1.6, sodium: 530,  fiber: 30,  sugar: 0,   purine: 'high',   gi: 15, category: '蔬菜' },

  // ── 水果 ────────────────────────
  '蘋果':       { kcal: 52,  carbs: 14,  protein: 0.3, fat: 0.2, sodium: 1,    fiber: 2.4, sugar: 10,  purine: 'low',    gi: 36, category: '水果' },
  '香蕉':       { kcal: 85,  carbs: 22,  protein: 1.1, fat: 0.3, sodium: 1,    fiber: 1.6, sugar: 12,  purine: 'low',    gi: 51, category: '水果' },
  '芭樂':       { kcal: 38,  carbs: 9.9, protein: 0.7, fat: 0.1, sodium: 2,    fiber: 3.0, sugar: 6,   purine: 'low',    gi: 30, category: '水果' },
  '橘子':       { kcal: 40,  carbs: 10,  protein: 0.8, fat: 0.2, sodium: 2,    fiber: 1.5, sugar: 8,   purine: 'low',    gi: 43, category: '水果' },
  '葡萄':       { kcal: 64,  carbs: 17,  protein: 0.5, fat: 0.2, sodium: 2,    fiber: 0.5, sugar: 16,  purine: 'low',    gi: 53, category: '水果' },
  '西瓜':       { kcal: 30,  carbs: 8,   protein: 0.7, fat: 0.1, sodium: 1,    fiber: 0.4, sugar: 6,   purine: 'low',    gi: 72, category: '水果' },
  '芒果':       { kcal: 60,  carbs: 15,  protein: 0.6, fat: 0.3, sodium: 1,    fiber: 1.6, sugar: 14,  purine: 'low',    gi: 56, category: '水果' },

  // ── 飲料 ────────────────────────
  '珍珠奶茶':   { kcal: 230, carbs: 38,  protein: 2,   fat: 7,   sodium: 80,   fiber: 0.5, sugar: 28,  purine: 'low',    gi: 65, category: '飲料', portion: 500 },
  '可樂':       { kcal: 42,  carbs: 11,  protein: 0,   fat: 0,   sodium: 4,    fiber: 0,   sugar: 11,  purine: 'low',    gi: 63, category: '飲料' },
  '無糖茶':     { kcal: 1,   carbs: 0.3, protein: 0,   fat: 0,   sodium: 3,    fiber: 0,   sugar: 0,   purine: 'low',    gi: 0,  category: '飲料' },
  '牛奶':       { kcal: 63,  carbs: 4.8, protein: 3.2, fat: 3.6, sodium: 44,   fiber: 0,   sugar: 4.8, purine: 'low',    gi: 27, category: '乳品' },
  '優格':       { kcal: 75,  carbs: 6,   protein: 4.5, fat: 3.5, sodium: 50,   fiber: 0,   sugar: 6,   purine: 'low',    gi: 35, category: '乳品' },
  '啤酒':       { kcal: 43,  carbs: 3.6, protein: 0.5, fat: 0,   sodium: 4,    fiber: 0,   sugar: 0,   purine: 'high',   gi: 0,  category: '酒類' },

  // ── 油脂 / 點心 ────────────────
  '炸雞':       { kcal: 280, carbs: 12,  protein: 18,  fat: 18,  sodium: 600,  fiber: 0.5, sugar: 1,   purine: 'medium', gi: 0,  category: '油炸' },
  '薯條':       { kcal: 320, carbs: 41,  protein: 4,   fat: 16,  sodium: 280,  fiber: 3,   sugar: 0.3, purine: 'low',    gi: 75, category: '油炸' },
  '蛋糕':       { kcal: 350, carbs: 50,  protein: 5,   fat: 15,  sodium: 250,  fiber: 0.5, sugar: 30,  purine: 'low',    gi: 70, category: '甜點' },
  '巧克力':     { kcal: 535, carbs: 60,  protein: 7,   fat: 30,  sodium: 60,   fiber: 7,   sugar: 48,  purine: 'low',    gi: 49, category: '甜點' },
  '堅果':       { kcal: 600, carbs: 22,  protein: 18,  fat: 50,  sodium: 1,    fiber: 7,   sugar: 4,   purine: 'low',    gi: 15, category: '堅果' },
  '酪梨':       { kcal: 160, carbs: 9,   protein: 2,   fat: 15,  sodium: 7,    fiber: 7,   sugar: 0.7, purine: 'low',    gi: 10, category: '水果' },

  // ── 內臟（高普林） ────────────
  '豬肝':       { kcal: 119, carbs: 2.5, protein: 21,  fat: 3.4, sodium: 90,   fiber: 0,   sugar: 0,   purine: 'extreme',gi: 0,  category: '內臟' },
  '雞肝':       { kcal: 119, carbs: 0.7, protein: 17,  fat: 5,   sodium: 70,   fiber: 0,   sugar: 0,   purine: 'extreme',gi: 0,  category: '內臟' },
};

// 食物模糊比對（包含同義詞）
const FOOD_ALIASES = {
  '飯':       '白飯',
  '米飯':     '白飯',
  '麵包':     '麵包',
  '吐司':     '白吐司',
  '雞胸':     '雞胸肉',
  '雞':       '雞腿',
  '魚':       '鮭魚',
  '蛋':       '雞蛋',
  '茶':       '無糖茶',
  '奶茶':     '珍珠奶茶',
  '炸雞排':   '炸雞',
  '雞排':     '炸雞',
  '可樂':     '可樂',
  '咖啡':     '無糖茶',
  '燕麥片':   '燕麥',
  '糙米':     '糙米飯',
  '蔬菜':     '青菜',
  '青椒':     '青菜',
  '花椰菜':   '青花菜',
};

/**
 * 查詢食物（支援模糊比對）
 */
function lookupFood(query) {
  const q = (query || '').trim();
  if (!q) return null;

  // 完全比對
  if (FOOD_DATABASE[q]) {
    return { name: q, data: FOOD_DATABASE[q] };
  }

  // 別名比對
  if (FOOD_ALIASES[q]) {
    const realName = FOOD_ALIASES[q];
    return { name: realName, data: FOOD_DATABASE[realName] };
  }

  // 包含比對（query 包含資料庫的字 / 或反向）
  for (const [key, data] of Object.entries(FOOD_DATABASE)) {
    if (q.includes(key) || key.includes(q)) {
      return { name: key, data: data };
    }
  }

  // 別名包含比對
  for (const [alias, realName] of Object.entries(FOOD_ALIASES)) {
    if (q.includes(alias) || alias.includes(q)) {
      return { name: realName, data: FOOD_DATABASE[realName] };
    }
  }

  return null;
}

/**
 * 風險評估
 * 依使用者慢性病史，回傳該食物對應的風險等級與說明
 *
 * 回傳格式：
 * {
 *   verdict: 'safe' | 'caution' | 'danger',
 *   reasons: [{ level, text, condition }],
 *   suggestions: [string]
 * }
 */
function assessFoodRisk(food, conditions) {
  const data = food.data;
  const reasons = [];
  const suggestions = [];
  let maxLevel = 0; // 0=safe, 1=caution, 2=danger

  const has = (c) => conditions.includes(c);

  // 鈉含量評估 (每 100g)
  if (data.sodium >= 800) {
    if (has('hypertension') || has('cardiovascular') || has('ckd')) {
      reasons.push({ level: 2, text: `鈉含量極高 (${data.sodium}mg/100g)，遠超建議標準`, condition: '高血壓 / 心血管 / 腎臟病' });
      suggestions.push('建議完全避免，或選擇低鈉版本');
      maxLevel = Math.max(maxLevel, 2);
    } else {
      reasons.push({ level: 1, text: `鈉含量偏高 (${data.sodium}mg/100g)，每日鈉攝取應 < 2300mg`, condition: '一般注意' });
      maxLevel = Math.max(maxLevel, 1);
    }
  } else if (data.sodium >= 400) {
    if (has('hypertension') || has('cardiovascular')) {
      reasons.push({ level: 1, text: `鈉含量中等 (${data.sodium}mg/100g)，需控制份量`, condition: '高血壓 / 心血管' });
      maxLevel = Math.max(maxLevel, 1);
    }
  }

  // GI / 糖分評估
  if (data.sugar >= 15) {
    if (has('diabetes')) {
      reasons.push({ level: 2, text: `含糖量高 (${data.sugar}g/100g)，會明顯升高血糖`, condition: '糖尿病' });
      suggestions.push('糖尿病患者應避免或嚴格限制份量');
      maxLevel = Math.max(maxLevel, 2);
    } else if (has('fattyLiver')) {
      reasons.push({ level: 2, text: `含糖量高 (${data.sugar}g/100g)，加重肝臟負擔與脂肪堆積`, condition: '脂肪肝' });
      maxLevel = Math.max(maxLevel, 2);
    } else {
      reasons.push({ level: 1, text: `含糖量偏高 (${data.sugar}g/100g)`, condition: '注意' });
      maxLevel = Math.max(maxLevel, 1);
    }
  }

  if (data.gi >= 70 && data.carbs >= 20) {
    if (has('diabetes')) {
      reasons.push({ level: 1, text: `高升糖指數 (GI ${data.gi})，建議搭配蛋白質與纖維延緩血糖上升`, condition: '糖尿病' });
      maxLevel = Math.max(maxLevel, 1);
    }
  }

  // 飽和脂肪 / 總脂肪
  if (data.fat >= 20) {
    if (has('hyperlipidemia') || has('cardiovascular') || has('fattyLiver')) {
      reasons.push({ level: 2, text: `脂肪含量極高 (${data.fat}g/100g)`, condition: '高血脂 / 心血管 / 脂肪肝' });
      suggestions.push('建議改用蒸、烤、水煮方式烹調');
      maxLevel = Math.max(maxLevel, 2);
    }
  } else if (data.fat >= 10) {
    if (has('hyperlipidemia') || has('cardiovascular')) {
      reasons.push({ level: 1, text: `脂肪含量偏高 (${data.fat}g/100g)，建議控制份量`, condition: '高血脂 / 心血管' });
      maxLevel = Math.max(maxLevel, 1);
    }
  }

  // 普林（嘌呤）評估
  if (data.purine === 'extreme') {
    if (has('gout')) {
      reasons.push({ level: 2, text: `極高普林食物，急性發作期應完全禁止`, condition: '痛風' });
      suggestions.push('痛風患者應完全避免內臟類食物');
      maxLevel = Math.max(maxLevel, 2);
    } else {
      reasons.push({ level: 1, text: `普林含量極高，痛風高風險者注意`, condition: '注意' });
      maxLevel = Math.max(maxLevel, 1);
    }
  } else if (data.purine === 'high') {
    if (has('gout')) {
      reasons.push({ level: 2, text: `高普林食物，會誘發痛風發作`, condition: '痛風' });
      suggestions.push('每日普林攝取量應控制在 < 150mg');
      maxLevel = Math.max(maxLevel, 2);
    }
  }

  // 蛋白質（針對腎臟病）
  if (data.protein >= 20 && has('ckd')) {
    reasons.push({ level: 1, text: `高蛋白食物 (${data.protein}g/100g)，腎臟病患者每日蛋白質應限制在 0.6–0.8 g/kg`, condition: '慢性腎臟病' });
    suggestions.push('與營養師討論每日蛋白質份量');
    maxLevel = Math.max(maxLevel, 1);
  }

  // 加工肉品（針對多種疾病）
  if (data.category === '加工肉') {
    if (has('cardiovascular') || has('hypertension') || has('hyperlipidemia')) {
      reasons.push({ level: 2, text: `加工肉品含亞硝酸鹽與大量鈉、飽和脂肪`, condition: '心血管 / 高血壓' });
      suggestions.push('世界衛生組織列為一級致癌物，建議大幅減少');
      maxLevel = Math.max(maxLevel, 2);
    }
  }

  // 油炸食物
  if (data.category === '油炸') {
    if (has('hyperlipidemia') || has('cardiovascular') || has('fattyLiver') || has('diabetes')) {
      reasons.push({ level: 1, text: `油炸食物含反式脂肪與大量熱量`, condition: '多項慢性病' });
      suggestions.push('改以烤、蒸方式取代油炸');
      maxLevel = Math.max(maxLevel, 1);
    }
  }

  // 酒類
  if (data.category === '酒類') {
    if (has('fattyLiver') || has('gout') || has('hypertension') || has('hyperlipidemia')) {
      reasons.push({ level: 2, text: `酒精會直接加重肝臟負擔、升高血壓並誘發痛風`, condition: '脂肪肝 / 痛風 / 高血壓' });
      suggestions.push('建議完全戒酒');
      maxLevel = Math.max(maxLevel, 2);
    }
  }

  // 鉀含量（針對腎臟病）— 紫菜、香蕉等
  if ((food.name === '紫菜' || food.name === '香蕉' || food.name === '酪梨') && has('ckd')) {
    reasons.push({ level: 1, text: `富含鉀離子，腎功能不佳者需特別注意`, condition: '慢性腎臟病' });
    maxLevel = Math.max(maxLevel, 1);
  }

  // 沒有警示也沒有問題 → 安全
  if (reasons.length === 0) {
    reasons.push({ level: 0, text: '對您的健康狀況沒有特別警示，可正常食用', condition: '✓ 安全' });
    suggestions.push('仍須注意整體份量與均衡飲食');
  }

  const verdict = maxLevel === 0 ? 'safe' : maxLevel === 1 ? 'caution' : 'danger';

  return {
    verdict,
    reasons,
    suggestions: [...new Set(suggestions)],
  };
}

// 公開到全域
window.FOOD_DATABASE = FOOD_DATABASE;
window.lookupFood = lookupFood;
window.assessFoodRisk = assessFoodRisk;
