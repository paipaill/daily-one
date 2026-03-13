
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
const FALLBACK_QUOTES = [
  { cn: "在隆冬，我终于知道，我身上有一个不可战胜的夏天。", en: "In the midst of winter, I found there was, within me, an invincible summer.", author: "阿尔贝·加缪", sub: "Albert Camus · 1913–1960 · 法国", img: "https://images.unsplash.com/photo-1491466424936-e304919aada7?w=1200&q=90&fit=crop" },
  { cn: "我们必须想象西西弗斯是幸福的。", en: "One must imagine Sisyphus happy.", author: "阿尔贝·加缪", sub: "Albert Camus · 1913–1960 · 法国", img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=90&fit=crop" },
  { cn: "存在先于本质。", en: "Existence precedes essence.", author: "萨特", sub: "Jean-Paul Sartre · 1905–1980 · 法国", img: "https://images.unsplash.com/photo-1536152470836-b943b246224c?w=1200&q=90&fit=crop" },
  { cn: "那杀不死我的，使我更强大。", en: "That which does not kill me makes me stronger.", author: "尼采", sub: "Friedrich Nietzsche · 1844–1900 · 德国", img: "https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=1200&q=90&fit=crop" },
  { cn: "书必须是解冻我们内心冰封之海的一把斧子。", en: "A book must be the axe for the frozen sea within us.", author: "卡夫卡", sub: "Franz Kafka · 1883–1924 · 奥地利", img: "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=1200&q=90&fit=crop" }
];

// Unsplash image pool — curated minimal/dark
const IMG_POOL = [
  "https://images.unsplash.com/photo-1491466424936-e304919aada7?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1536152470836-b943b246224c?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1519659528534-7fd733a832a0?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1418985991508-e47386d96a71?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=1200&q=90&fit=crop",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=90&fit=crop"
];

async function fetchAIQuotes(username) {
  const cacheKey = userKey(username, `quotes_${todayKey()}`);

  // 返回今日缓存（避免重复调用 API）
  try {
    const cached = JSON.parse(safeGetItem(cacheKey) || 'null');
    if (cached && Array.isArray(cached) && cached.length === DAILY_COUNT) return cached;
  } catch (e) { }

  // 未配置 key 时降级到内置语句
  const apiKey = typeof window !== 'undefined' ? window.ZHIPU_API_KEY : null;
  if (!apiKey || apiKey === '__ZHIPU_API_KEY__' || apiKey === '') {
    console.warn('未配置 ZHIPU_API_KEY，使用内置语句');
    return shuffledFallback();
  }

  try {
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    // 智谱 AI 对话接口
    const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    const API_KEY = typeof window !== 'undefined' ? window.ZHIPU_API_KEY : ''; // Set via Render Environment Variables
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "glm-4",
        messages: [
          {
            "role": "system",
            "content": "你是一个充满智慧和诗意的文学摘要引擎。\n目标：每天为我精选或感悟 3 条高质量、简短、直击人心的短句（可以是名言、诗句、哲理）。\n返回格式：必须且只能是一个JSON数组，包含 3 个对象，每个对象有 'cn' (中文), 'en' (优美的英文翻译), 'author' (作者姓名), 'sub' (头衔或出处)。\n不要有任何其它的Markdown代码块或前后语。"
          },
          {
            "role": "user",
            "content": `今天是 ${new Date().toLocaleDateString()}，请为我生成今天的 3 句话，主题随机（如：孤独、爱、自由、时间、自然）。`
          }
        ],
        temperature: 0.9,
        max_tokens: 2000
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GLM API ${res.status}: ${errText} `);
    }

    const data = await res.json();
    // 智谱返回格式：data.choices[0].message.content
    const raw = data.choices?.[0]?.message?.content || '';

    // 提取 JSON 数组（兼容模型可能返回 markdown 代码块的情况）
    const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('响应中未找到 JSON 数组');

    let quotes = JSON.parse(match[0]);
    if (!Array.isArray(quotes) || quotes.length < DAILY_COUNT)
      throw new Error('JSON 数组格式不正确');

    // 为每条语录绑定背景图（按日期+位置循环取图）
    quotes = quotes.slice(0, DAILY_COUNT).map((q, i) => ({
      ...q,
      img: IMG_POOL[(seed + i) % IMG_POOL.length]
    }));

    // 缓存今日结果
    safeSetItem(cacheKey, JSON.stringify(quotes));
    return quotes;

  } catch (err) {
    console.error('GLM 获取语句失败，降级到内置语句:', err);
    return shuffledFallback();
  }
}

function shuffledFallback() {
  // Shuffle fallback by today's date for some variety
  const d = new Date();
  const seed = d.getDate() + d.getMonth() * 31;
  const arr = [...FALLBACK_QUOTES];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (seed * (i + 1)) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, DAILY_COUNT);
}
