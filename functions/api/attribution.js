// 号码归属地查询 API（Cloudflare Pages Function）
// 路由: /api/attribution?phone=13800138000
//
// 数据源（按优先级）：
//   1. 聚合数据接口（需配置环境变量 LOOKUP_API_KEY，返回信息最全）
//   2. 360 手机号码归属地接口（免费、无需 Key，返回省份/城市/运营商）
//   3. 本地号段表降级（离线，返回基础运营商判断）
//
// 说明：归属地属于运营商公开的号段分配信息，与号码是否被标记无关。
// 本接口不落库、不记录请求日志，只在内存中处理单次请求。

const UA = 'numbertool/1.0 (+https://524900.xyz)';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const phone = (url.searchParams.get('phone') || '').trim();

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!phone) {
    return json({ ok: false, error: '请输入手机号码' }, 400, corsHeaders);
  }

  // 清理号码：去掉 +86 等前缀，只保留数字
  let cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.startsWith('86') && cleaned.length > 11) {
    cleaned = cleaned.slice(2);
  }

  const prefix7 = cleaned.slice(0, 7);
  const isMobile = /^1[3-9]\d{9}$/.test(cleaned);

  if (cleaned.length < 7) {
    return json({ ok: false, error: '号码格式不正确，请输入 11 位手机号或带区号的固话' }, 400, corsHeaders);
  }

  // ---- 优先级 1：配置了聚合数据 Key 时使用（信息更全） ----
  if (env && env.LOOKUP_API_KEY) {
    try {
      const apiUrl = `https://apis.juhe.cn/mobile/get?key=${encodeURIComponent(env.LOOKUP_API_KEY)}&phone=${encodeURIComponent(prefix7)}&dtype=json`;
      const resp = await fetch(apiUrl, { headers: { 'User-Agent': UA } });
      const data = await resp.json();
      if (data.error_code === 0 && data.result) {
        return json({
          ok: true,
          source: 'juhe',
          phone: cleaned,
          province: data.result.province || '',
          city: data.result.city || '',
          areacode: data.result.areacode || '',
          zip: data.result.zip || '',
          company: data.result.company || '',
          card: data.result.card || '',
        }, 200, corsHeaders);
      }
    } catch {
      // 失败则继续降级到 360 接口
    }
  }

  // ---- 优先级 2：360 免费归属地接口（手机号） ----
  if (isMobile) {
    try {
      const resp360 = await fetch(
        `https://cx.shouji.360.cn/phonearea.php?number=${encodeURIComponent(cleaned)}`,
        { headers: { 'User-Agent': UA, 'Referer': 'https://cx.shouji.360.cn/' } }
      );
      const data360 = await resp360.json();
      if (data360.code === 0 && data360.data) {
        const d = data360.data;
        // 直辖市的 province 有值、city 为空，这里用 province 兜底
        return json({
          ok: true,
          source: '360',
          phone: cleaned,
          province: d.province || '',
          city: d.city || d.province || '',
          company: d.sp || '',
          areacode: '',
          zip: '',
          card: '',
        }, 200, corsHeaders);
      }
    } catch {
      // 失败则降级到本地号段表
    }
  }

  // ---- 优先级 3：本地号段判断（无需网络） ----
  const localResult = localLookup(cleaned, isMobile);
  return json({
    ok: true,
    source: 'local',
    phone: cleaned,
    province: localResult.province,
    city: localResult.city,
    company: localResult.company,
    areacode: localResult.areacode,
    zip: '',
    note: localResult.note,
  }, 200, corsHeaders);
}

// 本地号段判断（基于公开号段分配表）
function localLookup(phone, isMobile) {
  if (!isMobile) return landlineLookup(phone);
  return {
    province: '',
    city: '',
    company: getCarrierByPrefix(phone.slice(0, 3)),
    areacode: '',
    note: '在线接口暂不可用，仅返回运营商信息（基于号段分配表）。请稍后重试获取完整归属地。',
  };
}

function getCarrierByPrefix(prefix) {
  const mobile = ['134', '135', '136', '137', '138', '139', '147', '148', '150', '151', '152', '157', '158', '159', '172', '178', '182', '183', '184', '187', '188', '195', '197', '198'];
  const unicom = ['130', '131', '132', '145', '146', '155', '156', '166', '167', '171', '175', '176', '185', '186', '196'];
  const telecom = ['133', '149', '153', '173', '174', '177', '180', '181', '189', '190', '191', '193', '199'];
  const virtual = ['162', '165', '170', '171'];
  if (mobile.includes(prefix)) return '中国移动';
  if (unicom.includes(prefix)) return '中国联通';
  if (telecom.includes(prefix)) return '中国电信';
  if (virtual.includes(prefix)) return '虚拟运营商';
  return '未知';
}

// 固话区号 → 省份映射（主要城市）
function landlineLookup(phone) {
  const areaCodeMap = {
    '010': ['北京', '北京'], '021': ['上海', '上海'], '022': ['天津', '天津'], '023': ['重庆', '重庆'],
    '020': ['广东', '广州'], '024': ['辽宁', '沈阳'], '025': ['江苏', '南京'], '027': ['湖北', '武汉'],
    '028': ['四川', '成都'], '029': ['陕西', '西安'],
    '0755': ['广东', '深圳'], '0756': ['广东', '珠海'], '0757': ['广东', '佛山'], '0760': ['广东', '中山'], '0769': ['广东', '东莞'],
    '0571': ['浙江', '杭州'], '0574': ['浙江', '宁波'], '0577': ['浙江', '温州'],
    '0510': ['江苏', '无锡'], '0512': ['江苏', '苏州'],
    '0531': ['山东', '济南'], '0532': ['山东', '青岛'],
    '0591': ['福建', '福州'], '0592': ['福建', '厦门'],
    '0371': ['河南', '郑州'], '0311': ['河北', '石家庄'], '0351': ['山西', '太原'],
    '0431': ['吉林', '长春'], '0451': ['黑龙江', '哈尔滨'],
    '0471': ['内蒙古', '呼和浩特'], '0472': ['内蒙古', '包头'],
    '0731': ['湖南', '长沙'], '0791': ['江西', '南昌'], '0771': ['广西', '南宁'],
    '0898': ['海南', '海口'], '0851': ['贵州', '贵阳'], '0871': ['云南', '昆明'],
    '0931': ['甘肃', '兰州'], '0951': ['宁夏', '银川'], '0971': ['青海', '西宁'],
    '0901': ['新疆', '乌鲁木齐'], '0891': ['西藏', '拉萨'],
  };
  for (const len of [4, 3]) {
    const code = phone.slice(0, len);
    if (areaCodeMap[code]) {
      const [province, city] = areaCodeMap[code];
      return { province, city, company: '电信 / 联通 / 铁通', areacode: code, note: '固话归属地（基于区号匹配）' };
    }
  }
  return { province: '', city: '', company: '', areacode: '', note: '固话区号未识别，请确认号码是否正确。' };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers });
}
