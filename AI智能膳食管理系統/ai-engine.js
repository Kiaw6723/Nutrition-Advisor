/* ============================================
 * AI 膳食推論引擎
 *
 * 兩種模式：
 *   1. 內建模式（預設）：規則引擎 + 臨床指南
 *   2. Ollama 模式：呼叫本機 Ollama API，使用大型語言模型生成更個人化的對話式建議
 * ============================================ */

// ── 計算函式 ────────────────────────────────
function calcBMI(weightKg, heightCm) {
  const m = heightCm / 100;
  return weightKg / (m * m);
}

function classifyBMI(bmi) {
  if (bmi < 18.5) return { label: '體重過輕', tag: 'underweight' };
  if (bmi < 24)   return { label: '正常',     tag: 'normal' };
  if (bmi < 27)   return { label: '過重',     tag: 'overweight' };
  if (bmi < 30)   return { label: '輕度肥胖', tag: 'obese' };
  if (bmi < 35)   return { label: '中度肥胖', tag: 'obese' };
  return                 { label: '重度肥胖', tag: 'obese' };
}

// Mifflin-St Jeor Equation (1990) — 目前臨床公認最準確
function calcBMR(gender, weightKg, heightCm, age) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

const ACTIVITY_FACTORS = {
  sedentary:  1.2,
  light:      1.375,
  moderate:   1.55,
  active:     1.725,
  veryActive: 1.9,
};

function calcTDEE(bmr, activity) {
  return bmr * (ACTIVITY_FACTORS[activity] || 1.375);
}

function calcIdealWeight(heightCm, gender) {
  // 以 BMI 22 為目標
  const m = heightCm / 100;
  return 22 * m * m;
}

function adjustForGoal(tdee, goal) {
  switch (goal) {
    case 'lose':   return tdee - 500;
    case 'gain':   return tdee + 500;
    case 'muscle': return tdee + 300;
    default:       return tdee;
  }
}

// ── 慢性病臨床知識庫 ──────────────────────
const CONDITION_PROFILES = {
  diabetes: {
    name: '糖尿病',
    diet: 'ADA / 台灣糖尿病學會建議',
    macros: { carb: [45, 50], protein: [15, 20], fat: [25, 30] },
    sodiumLimit: 2300,
    principles: [
      '採低升糖負荷 (Low-GL) 飲食，優先選擇糙米、燕麥、全麥麵包等全穀類',
      '碳水化合物固定分配在三餐，避免單餐攝取過多',
      '蛋白質優先選擇魚類、豆製品與低脂肉類',
      '增加纖維攝取至每日 25–30g，有助穩定血糖',
      '完全避免含糖飲料與精製甜點',
    ],
    avoid: ['含糖飲料', '白吐司', '糖果', '蛋糕', '糯米飯', '果汁', '蜂蜜'],
    recommend: ['糙米飯', '燕麥', '全麥麵包', '青菜', '雞胸肉', '鮭魚', '豆腐', '蘋果'],
    tips: [
      { icon: '🩸', text: '<strong>監測時機</strong>：餐前與餐後 2 小時血糖目標分別為 80–130 mg/dL 與 < 180 mg/dL' },
      { icon: '🍚', text: '<strong>分量原則</strong>：餐盤法 — 1/2 蔬菜、1/4 全穀、1/4 蛋白質' },
      { icon: '⏰', text: '<strong>用餐間隔</strong>：規律三餐，間隔 4–5 小時，避免低血糖' },
    ],
  },

  hypertension: {
    name: '高血壓',
    diet: 'DASH 得舒飲食',
    macros: { carb: [50, 55], protein: [15, 20], fat: [25, 30] },
    sodiumLimit: 1500,
    principles: [
      '採用 DASH 飲食原則：富含蔬果、全穀、低脂乳品',
      '每日鈉攝取嚴格控制 < 1500–2300 mg（約 1 茶匙鹽）',
      '增加鉀、鎂、鈣攝取（深色蔬菜、低脂乳品）',
      '減少加工食品、醃漬品、罐頭與外食頻率',
      '建議減少飽和脂肪與紅肉，增加魚類攝取',
    ],
    avoid: ['泡麵', '香腸', '培根', '醃漬食物', '罐頭湯', '速食', '滷味'],
    recommend: ['新鮮蔬菜', '低脂牛奶', '香蕉', '燕麥', '鮭魚', '堅果', '青花菜'],
    tips: [
      { icon: '🧂', text: '<strong>讀標籤</strong>：每 100g 鈉 < 120mg 才算低鈉食品' },
      { icon: '🌿', text: '<strong>替代調味</strong>：用蔥、薑、蒜、檸檬、香草取代部分鹽分' },
      { icon: '💧', text: '<strong>每日飲水</strong>：1500–2000 ml，避免脫水誘發血壓波動' },
    ],
  },

  ckd: {
    name: '慢性腎臟病',
    diet: '低蛋白、低鈉、低磷、低鉀',
    macros: { carb: [50, 60], protein: [10, 15], fat: [30, 35] },
    sodiumLimit: 2000,
    principles: [
      '蛋白質攝取限制在每日 0.6–0.8 g/kg 體重（依分期調整）',
      '優先選擇高生物價蛋白質（蛋白、魚、瘦肉）',
      '限制磷（避免加工食品、可樂、奶製品過量）',
      '依血鉀數值調整鉀攝取（避免楊桃、香蕉、奇異果、菇類）',
      '充足熱量避免肌肉分解（依需求增加碳水與好油）',
    ],
    avoid: ['楊桃', '香蕉過量', '加工食品', '可樂', '香菇', '紫菜', '堅果過量', '黃豆製品過量'],
    recommend: ['白米飯', '蛋白', '冬瓜', '高麗菜', '蘋果', '蘿蔔', '白菜'],
    tips: [
      { icon: '🫘', text: '<strong>限磷小訣竅</strong>：肉類先汆燙再烹調可降低磷含量約 30%' },
      { icon: '🥬', text: '<strong>降鉀技巧</strong>：蔬菜切小塊水煮後不喝湯' },
      { icon: '⚖️', text: '<strong>蛋白質份量</strong>：以體重 60kg 為例，每日約 36–48g 蛋白質' },
    ],
  },

  hyperlipidemia: {
    name: '高血脂',
    diet: '地中海飲食',
    macros: { carb: [50, 55], protein: [15, 20], fat: [25, 30] },
    sodiumLimit: 2300,
    principles: [
      '減少飽和脂肪攝取（< 總熱量 7%）',
      '完全避免反式脂肪（人造奶油、酥油、油炸物）',
      '增加 omega-3 脂肪酸（鮭魚、亞麻仁油、堅果）',
      '每日膳食纖維 25–30g，水溶性纖維可降低 LDL',
      '採用植物固醇豐富的食物（豆類、蔬菜、全穀）',
    ],
    avoid: ['油炸食物', '肥肉', '奶油', '蛋糕', '酥皮類', '動物內臟', '椰子油'],
    recommend: ['鮭魚', '橄欖油', '酪梨', '燕麥', '堅果（無調味）', '青花菜', '深綠色蔬菜'],
    tips: [
      { icon: '🐟', text: '<strong>omega-3 來源</strong>：每週吃 2 次深海魚（鮭魚、鯖魚、秋刀魚）' },
      { icon: '🌾', text: '<strong>水溶性纖維</strong>：燕麥、豆類、蘋果可降低總膽固醇' },
      { icon: '🥑', text: '<strong>好油壞油</strong>：橄欖油、酪梨油取代豬油、奶油' },
    ],
  },

  gout: {
    name: '痛風',
    diet: '低普林飲食',
    macros: { carb: [55, 60], protein: [12, 15], fat: [25, 30] },
    sodiumLimit: 2300,
    principles: [
      '急性期：每日普林 < 150mg，完全避免動物內臟、肉湯、海鮮',
      '緩解期：每日普林 < 400mg，仍須限制高普林食物',
      '每日飲水量 2500–3000 ml，促進尿酸排出',
      '完全戒酒，特別是啤酒',
      '避免高果糖飲料（高果糖玉米糖漿會增加尿酸生成）',
    ],
    avoid: ['動物內臟', '海鮮', '啤酒', '濃肉湯', '香菇', '蘆筍', '黃豆過量', '含糖飲料'],
    recommend: ['雞蛋', '牛奶', '蔬菜', '水果', '糙米', '豆腐少量', '櫻桃'],
    tips: [
      { icon: '💧', text: '<strong>飲水重要性</strong>：每日 2500ml 以上，幫助尿酸排出' },
      { icon: '🍒', text: '<strong>櫻桃</strong>：研究顯示每日吃 10 顆櫻桃可降低痛風發作機率' },
      { icon: '🚫', text: '<strong>絕對禁忌</strong>：啤酒、烈酒、肉湯、動物內臟' },
    ],
  },

  cardiovascular: {
    name: '心血管疾病',
    diet: '地中海飲食 + DASH',
    macros: { carb: [50, 55], protein: [15, 20], fat: [25, 30] },
    sodiumLimit: 1500,
    principles: [
      '採地中海飲食或 DASH 飲食原則',
      '每日鈉攝取 < 1500–2300 mg',
      '減少飽和脂肪 < 6% 總熱量，避免反式脂肪',
      '每週至少 2 次深海魚（omega-3）',
      '增加蔬果、全穀、堅果攝取',
    ],
    avoid: ['加工肉品', '油炸食物', '醃漬品', '甜點', '反式脂肪', '紅肉過量'],
    recommend: ['鮭魚', '橄欖油', '深色蔬菜', '全穀類', '豆類', '堅果', '莓果'],
    tips: [
      { icon: '🏃', text: '<strong>飲食 + 運動</strong>：每週 150 分鐘中強度有氧運動' },
      { icon: '🍷', text: '<strong>酒精限制</strong>：男性 ≤ 2 杯/天、女性 ≤ 1 杯/天' },
      { icon: '🚭', text: '<strong>戒菸</strong>：吸菸是冠心病最強的可逆轉風險因子' },
    ],
  },

  fattyLiver: {
    name: '脂肪肝',
    diet: '減重 + 限糖飲食',
    macros: { carb: [40, 45], protein: [20, 25], fat: [30, 35] },
    sodiumLimit: 2300,
    principles: [
      '若 BMI > 24，建議減重 5–10% 即可顯著改善肝指數',
      '嚴格限制果糖與精製糖（高果糖玉米糖漿是脂肪肝主因之一）',
      '完全戒酒',
      '增加蛋白質與纖維，減少精製碳水',
      '採用低升糖飲食 + 規律運動',
    ],
    avoid: ['含糖飲料', '果糖', '酒精', '甜點', '白飯過量', '油炸食物'],
    recommend: ['雞胸肉', '魚', '青菜', '燕麥', '堅果', '雞蛋', '咖啡（無糖）'],
    tips: [
      { icon: '📉', text: '<strong>減重目標</strong>：每週減 0.5–1 kg，避免快速減重' },
      { icon: '☕', text: '<strong>咖啡</strong>：研究顯示每日 2–3 杯黑咖啡可降低脂肪肝風險' },
      { icon: '🏊', text: '<strong>運動</strong>：每週 150 分鐘有氧 + 2 次阻力訓練' },
    ],
  },

  osteoporosis: {
    name: '骨質疏鬆',
    diet: '高鈣、足量蛋白質',
    macros: { carb: [50, 55], protein: [18, 22], fat: [25, 30] },
    sodiumLimit: 2000,
    principles: [
      '每日鈣攝取 1000–1200 mg',
      '維生素 D：每日 800–1000 IU，多曬太陽',
      '足量蛋白質：每公斤體重 1.0–1.2g',
      '減少咖啡因（過量會增加鈣質流失）',
      '限制鈉攝取（高鈉飲食加速鈣流失）',
    ],
    avoid: ['過量咖啡因', '過量酒精', '高鈉食物', '可樂'],
    recommend: ['牛奶', '優格', '起司', '小魚乾', '芝麻', '深綠色蔬菜', '豆腐'],
    tips: [
      { icon: '🥛', text: '<strong>鈣質來源</strong>：每日 2 份乳製品（每份 240ml）約提供 600mg 鈣' },
      { icon: '☀️', text: '<strong>維生素 D</strong>：每日曬太陽 15 分鐘，或補充劑 800 IU' },
      { icon: '🏋️', text: '<strong>負重運動</strong>：行走、慢跑、阻力訓練可增加骨密度' },
    ],
  },

  anemia: {
    name: '貧血',
    diet: '高鐵、富含維生素 C',
    macros: { carb: [50, 55], protein: [18, 22], fat: [25, 30] },
    sodiumLimit: 2300,
    principles: [
      '增加血基質鐵食物（紅肉、肝臟、海鮮）',
      '搭配維生素 C 食物（柑橘、芭樂）提升鐵吸收',
      '避免與咖啡、茶、鈣片同時食用（抑制鐵吸收）',
      '若為惡性貧血需補充 B12',
      '葉酸缺乏者多攝取深綠色蔬菜',
    ],
    avoid: ['吃飯時喝濃茶', '吃飯時喝咖啡', '吃飯時補鈣'],
    recommend: ['紅肉', '雞肝', '蛤蜊', '菠菜', '芭樂', '橘子', '紅豆'],
    tips: [
      { icon: '🍊', text: '<strong>維生素 C 加成</strong>：飯後吃顆橘子，鐵吸收率提升 3 倍' },
      { icon: '☕', text: '<strong>避免時機</strong>：飯後 1–2 小時內勿喝茶或咖啡' },
      { icon: '🥩', text: '<strong>動物性鐵</strong>：吸收率約 20%，遠高於植物性鐵的 5%' },
    ],
  },
};

// ── 多病共管：衝突處理 ────────────────
function mergeProfiles(conditions) {
  if (conditions.length === 0) {
    return {
      name: '健康維持',
      diet: '均衡飲食',
      macros: { carb: [50, 55], protein: [15, 20], fat: [25, 30] },
      sodiumLimit: 2300,
      principles: [
        '採用均衡飲食原則，三大營養素比例：醣類 50–55%、蛋白質 15–20%、脂肪 25–30%',
        '每日蔬菜攝取 ≥ 3 份（生重 300g），水果 2 份',
        '優先全穀根莖類，減少精製糖與飽和脂肪',
        '每日飲水 1500–2000 ml',
        '規律運動：每週 150 分鐘中強度有氧',
      ],
      avoid: ['含糖飲料', '油炸食物', '加工食品'],
      recommend: ['糙米', '青菜', '魚', '雞胸肉', '豆腐', '水果', '堅果'],
      tips: [
        { icon: '🥗', text: '<strong>餐盤比例</strong>：1/2 蔬菜、1/4 全穀、1/4 蛋白質' },
        { icon: '💧', text: '<strong>水分</strong>：每日 1500–2000ml，運動時更多' },
        { icon: '🏃', text: '<strong>運動</strong>：每週 150 分鐘中強度有氧 + 2 次肌力訓練' },
      ],
    };
  }

  const profiles = conditions.map((c) => CONDITION_PROFILES[c]).filter(Boolean);

  // 取最嚴格的鈉限制
  const sodiumLimit = Math.min(...profiles.map((p) => p.sodiumLimit));

  // 取最嚴格的營養素範圍
  const carb    = [Math.max(...profiles.map((p) => p.macros.carb[0])),    Math.min(...profiles.map((p) => p.macros.carb[1]))];
  const protein = [Math.max(...profiles.map((p) => p.macros.protein[0])), Math.min(...profiles.map((p) => p.macros.protein[1]))];
  const fat     = [Math.max(...profiles.map((p) => p.macros.fat[0])),     Math.min(...profiles.map((p) => p.macros.fat[1]))];

  // 範圍若反轉（衝突）則取中位
  const fix = (range) => range[0] > range[1] ? [(range[0] + range[1]) / 2 - 2.5, (range[0] + range[1]) / 2 + 2.5] : range;

  const merged = {
    name: profiles.map((p) => p.name).join(' + '),
    diet: [...new Set(profiles.map((p) => p.diet))].join('、'),
    macros: { carb: fix(carb), protein: fix(protein), fat: fix(fat) },
    sodiumLimit,
    principles: [...new Set(profiles.flatMap((p) => p.principles))],
    avoid:      [...new Set(profiles.flatMap((p) => p.avoid))],
    recommend:  [...new Set(profiles.flatMap((p) => p.recommend))],
    tips:       profiles.flatMap((p) => p.tips),
    isMulti: profiles.length > 1,
  };

  // 多病共管特殊衝突處理
  if (conditions.includes('ckd') && conditions.includes('diabetes')) {
    merged.principles.unshift('⚠️ <strong>糖尿病合併腎臟病</strong>需平衡碳水化合物控制（避免高血糖）與蛋白質限制（保護腎功能），建議由營養師個別評估');
  }
  if (conditions.includes('gout') && conditions.includes('ckd')) {
    merged.principles.unshift('⚠️ <strong>痛風合併腎臟病</strong>：尿酸排泄不良風險高，務必嚴格控制普林與蛋白質');
  }
  if (conditions.includes('hypertension') && conditions.includes('ckd')) {
    merged.principles.unshift('⚠️ <strong>高血壓合併腎臟病</strong>：鈉攝取應 < 2000mg，並監測血鉀數值');
  }

  return merged;
}

// ── 建立每日菜單 ──────────────────────
function buildMealPlan(targetKcal, profile, gender) {
  // 三餐分配
  const breakfastKcal = Math.round(targetKcal * 0.25);
  const lunchKcal     = Math.round(targetKcal * 0.35);
  const dinnerKcal    = Math.round(targetKcal * 0.30);
  const snackKcal     = Math.round(targetKcal * 0.10);

  const recommend = profile.recommend;
  const conditions = profile.name;

  // 根據疾病類型挑選菜單
  const lowSodium = conditions.includes('高血壓') || conditions.includes('心血管') || conditions.includes('腎臟');
  const lowPurine = conditions.includes('痛風');
  const lowProtein = conditions.includes('腎臟');
  const lowSugar  = conditions.includes('糖尿病') || conditions.includes('脂肪肝');

  const breakfast = {
    name: '早餐',
    emoji: '🌅',
    kcal: breakfastKcal,
    items: [
      lowSugar  ? '燕麥粥 1 碗（無糖，加肉桂粉）' : '全麥吐司 2 片',
      '水煮蛋 1 顆',
      lowSodium ? '無糖豆漿 240ml' : '低脂牛奶 240ml',
      '蘋果 1 顆 或 芭樂 1/2 顆',
    ],
    tips: lowSugar ? '使用燕麥取代精製麵包，搭配蛋白質可穩定血糖' : '蛋白質 + 全穀組合提供整個上午能量',
  };

  const lunch = {
    name: '午餐',
    emoji: '☀️',
    kcal: lunchKcal,
    items: [
      lowPurine ? '糙米飯 7 分滿' : '糙米飯 1 碗',
      lowProtein ? '蒸魚（手掌心大小）' : (lowPurine ? '滷雞胸肉（去皮）' : '清蒸鮭魚 100g'),
      '清炒青菜 1 大碗（少油少鹽）',
      lowSodium ? '番茄豆腐湯（不加鹽）' : '海帶豆腐湯',
    ],
    tips: '主菜選擇蒸、烤、滷取代煎、炸；蔬菜量是主食的 1.5 倍',
  };

  const dinner = {
    name: '晚餐',
    emoji: '🌙',
    kcal: dinnerKcal,
    items: [
      '糙米飯 7 分滿',
      lowPurine ? '滷雞腿（去皮）1 隻' : '清蒸魚或炒雞胸肉',
      '燙青菜 1 碗（淋少許橄欖油）',
      lowSodium ? '冬瓜湯（清淡）' : '蔬菜湯',
    ],
    tips: '晚餐建議在睡前 3 小時前完成，份量略少於午餐',
  };

  const snack = {
    name: '點心',
    emoji: '🍎',
    kcal: snackKcal,
    items: [
      lowSugar ? '無調味堅果一小把（約 10 顆）' : '低脂優格 1 杯',
      '芭樂 1/2 顆 或 蘋果 1/2 顆',
    ],
    tips: '兩餐間如有飢餓感可補充，選擇低 GI 食物',
  };

  return [breakfast, lunch, dinner, snack];
}

// ── 主推論函式 ────────────────────────
function generateRecommendation(userData) {
  const { gender, age, height, weight, activity, goal, conditions } = userData;

  // 計算
  const bmi = calcBMI(weight, height);
  const bmiClass = classifyBMI(bmi);
  const bmr = calcBMR(gender, weight, height, age);
  const tdee = calcTDEE(bmr, activity);
  const targetKcal = adjustForGoal(tdee, goal);
  const idealWeight = calcIdealWeight(height, gender);

  // 合併慢性病檔案
  const profile = mergeProfiles(conditions);

  // 三大營養素克數計算
  const macroGrams = {
    carbs:   { percent: (profile.macros.carb[0] + profile.macros.carb[1]) / 2, kcalPerG: 4 },
    protein: { percent: (profile.macros.protein[0] + profile.macros.protein[1]) / 2, kcalPerG: 4 },
    fat:     { percent: (profile.macros.fat[0] + profile.macros.fat[1]) / 2, kcalPerG: 9 },
  };

  macroGrams.carbs.grams   = Math.round((targetKcal * macroGrams.carbs.percent   / 100) / macroGrams.carbs.kcalPerG);
  macroGrams.protein.grams = Math.round((targetKcal * macroGrams.protein.percent / 100) / macroGrams.protein.kcalPerG);
  macroGrams.fat.grams     = Math.round((targetKcal * macroGrams.fat.percent     / 100) / macroGrams.fat.kcalPerG);

  // 蛋白質特殊計算（腎臟病）
  if (conditions.includes('ckd')) {
    macroGrams.protein.grams = Math.round(weight * 0.7);
    macroGrams.protein.percent = Math.round((macroGrams.protein.grams * 4 / targetKcal) * 100);
  }

  // 一日菜單
  const mealPlan = buildMealPlan(targetKcal, profile, gender);

  return {
    metrics: {
      bmi: bmi.toFixed(1),
      bmiClass,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetKcal: Math.round(targetKcal),
      idealWeight: idealWeight.toFixed(1),
    },
    profile,
    macros: {
      carbs:   { grams: macroGrams.carbs.grams,   percent: Math.round(macroGrams.carbs.percent) },
      protein: { grams: macroGrams.protein.grams, percent: Math.round(macroGrams.protein.percent) },
      fat:     { grams: macroGrams.fat.grams,     percent: Math.round(macroGrams.fat.percent) },
    },
    sodiumLimit: profile.sodiumLimit,
    mealPlan,
    intro: buildIntro(userData, bmi, bmiClass, profile),
  };
}

function buildIntro(userData, bmi, bmiClass, profile) {
  const { gender, age, conditions, goal } = userData;
  const goalText = { maintain: '維持目前體重', lose: '健康減重', gain: '健康增重', muscle: '增肌' }[goal];

  let intro = `您好，我是您的 AI 營養師。針對您的個人數據`;
  if (conditions.length > 0) intro += `及<strong>${profile.name}</strong>病史`;
  intro += `，提供以下專業飲食與生活建議。`;

  intro += `<br><br>您的 BMI 為 <strong>${bmi.toFixed(1)}</strong>，屬於<strong>「${bmiClass.label}」</strong>範圍`;
  intro += `，目前的飲食重點放在「<strong>${goalText}</strong>」`;

  if (conditions.length > 0) {
    intro += `以及「<strong>透過${profile.diet}原則控管慢性病</strong>」。`;
  } else {
    intro += `與「<strong>維持長期均衡營養</strong>」。`;
  }

  return intro;
}

// ── Ollama 整合 ───────────────────────
async function tryOllama(endpoint, model, prompt) {
  try {
    const response = await fetch(`${endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.6, num_predict: 1500 },
      }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.response;
  } catch (err) {
    console.warn('Ollama 連線失敗：', err);
    return null;
  }
}

async function checkOllama(endpoint) {
  try {
    const r = await fetch(`${endpoint}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!r.ok) return { ok: false, models: [] };
    const data = await r.json();
    return { ok: true, models: (data.models || []).map((m) => m.name) };
  } catch {
    return { ok: false, models: [] };
  }
}

async function generateWithOllama(userData, baseResult, endpoint, model) {
  const { gender, age, height, weight, activity, goal, conditions } = userData;
  const condText = conditions.map((c) => CONDITION_PROFILES[c]?.name).filter(Boolean).join('、') || '無';
  const goalText = { maintain: '維持體重', lose: '減重', gain: '增重', muscle: '增肌' }[goal];

  const prompt = `你是一位專業的臨床營養師。請用繁體中文（台灣用語），以親切、溫暖的口吻為以下使用者提供 3-4 段個人化飲食建議。

【使用者資料】
- 性別：${gender === 'male' ? '男' : '女'}，${age} 歲
- 身高：${height} cm，體重：${weight} kg
- BMI：${baseResult.metrics.bmi} (${baseResult.metrics.bmiClass.label})
- 活動量：${activity}
- 目標：${goalText}
- 慢性病史：${condText}
- 每日熱量目標：${baseResult.metrics.targetKcal} kcal

【你的回答應包含】
1. 對使用者的問候與整體健康評估（1 段）
2. 針對其慢性病/目標的具體飲食策略（2 段）
3. 日常實用小撇步（1 段）

請避免條列式，用溫暖、易讀的散文格式，每段 80-120 字。不要重複我給你的數據，直接給建議。`;

  const text = await tryOllama(endpoint, model, prompt);
  if (text) {
    baseResult.intro = text.replace(/\n/g, '<br>');
    baseResult.aiSource = 'ollama';
  }
  return baseResult;
}

// 公開
window.AIEngine = {
  generate: generateRecommendation,
  generateWithOllama,
  checkOllama,
  calcBMI,
  classifyBMI,
  calcBMR,
  calcTDEE,
  CONDITION_PROFILES,
};
