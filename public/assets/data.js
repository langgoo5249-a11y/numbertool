/* ============================================================
   号通查 — 数据层
   红线：只收录可公开溯源的字段（入口 URL / 客服电话 / 供数终端 /
        材料要求 / 平台公开时效）。不含任何「通过率」「实测样本」
        「独家数据」类不可溯源指标。
   ============================================================ */
window.SITE = {
  siteName: '号通查',
  siteUrl: 'www.524900.xyz',
  // ⛔ 硬规定：合作方服务入口，原样保留，不得修改、替换或移除
  serviceUrls: {
    check: 'https://xbh5.open10086.com/?authorization=f91029a83a8758aa',
    clear: 'https://xbh5.open10086.com/?authorization=f91029a83a8758aa',
    verify: 'https://xbh5.open10086.com/factor/?authorization=f91029a83a8758aa#/pages/index/index'
  }
};

window.THRESHOLD_NOTE =
  '各平台对标记人数较多的号码审核更严：腾讯手机管家约 6 人以上开始展示标签、约 20 人以上要求补充号码使用证明。记录人数可直接决定后续该走快速申诉还是先备齐材料。';

window.MATERIALS_PERSONAL = [
  { key: 'idcard', label: '机主身份证正反面', required: true, note: '需与号码实名信息一致' },
  { key: 'ownership', label: '号码归属证明', required: true, note: '开户资料 / 缴费凭证 / 运营商账单，任选其一' },
  { key: 'screenshot', label: '错误标记截图', required: true, note: '用他人手机拨打后截图来电界面，这是最直接的证据' },
  { key: 'openDate', label: '号码开户时间', required: false, note: '新办号码 / 二次放号号码必须提供，用于证明标记非本人造成' }
];

window.MATERIALS_ENTERPRISE = [
  { key: 'license', label: '营业执照', required: true, note: '复印件需加盖公章' },
  { key: 'ownership', label: '号码归属证明', required: true, note: '运营商开具的号码使用证明，或与运营商签的电话服务协议' },
  { key: 'legalRep', label: '法人身份证 / 加盖公章的组织机构代码证', required: true, note: '二选一' },
  { key: 'screenshot', label: '错误标记截图', required: true, note: '建议提供 2 个以上不同品牌机型的截图' },
  { key: 'seal', label: '全部纸质材料加盖公章', required: true, note: '座机 / 400 / 95 号码无「机主收短信验证码」环节，完全依赖纸质材料审核' }
];

window.REJECT_REASONS = [
  '申诉理由只写「我没有骚扰行为」，缺少具体说明',
  '未提供号码归属证明，无法证明申诉人有权处理该号码',
  '标记人数超过 20 人但未补充号码使用证明',
  '企业号码用个人身份材料申诉，主体不一致',
  '上传的截图无法看清来电界面上的标记内容',
  '材料不清晰、遮挡关键信息或已过期',
  '号码确实存在高频陌生外呼行为，被判定为非误标',
  '把诈骗类标记当作误标记申诉（此类不在误标记清除范围）'
];

window.TYPE_NOTES = {
  mobile: '手机号必须查全：腾讯、泰迪熊这两家被大量安卓机型引用，最容易漏。同时用他人手机拨打截图——这是唯一能看到真实用户视角的方法。建议至少覆盖华为 / 小米或 OPPO / iPhone 三类机型，其中至少一台装了 360 手机卫士或腾讯手机管家。',
  landline: '座机号查询必须带区号（如 021-12345678），不带区号的结果不可信。座机没有「机主收验证码」环节，平台更依赖纸质材料，材料齐全是关键。',
  virtual: '170 / 171 / 162 / 165 / 167 等虚拟运营商号段，部分平台数据库无对应号段记录，可能出现「平台显示无标记、但终端仍展示标签」的情况，此时以他人手机实拨截图为准。',
  '400': '400 号码建议双线推进：一是各平台申诉，二是做企业号码认证。认证不是删除原标记，而是用审核过的企业名称覆盖它——展示优先级高于用户随手打的标签。',
  '95': '95 / 96 号码建议优先走信通院跨平台入口，并准备完整的营业执照 + 号码使用协议。'
};

window.MARKING_LEVELS = [
  { value: 'low', rank: 1, label: '身份／中性类', desc: '公司名 / 店铺名 / 快递送餐 / 房产中介' },
  { value: 'mid', rank: 2, label: '商业营销类', desc: '广告推销 / 疑似骚扰' },
  { value: 'high', rank: 3, label: '高风险类', desc: '疑似欺诈 / 诈骗电话' }
];

/* 号码用途选项（用于生成申诉说明，均由用户自己选择，不代为编造） */
window.NUMBER_PURPOSES = [
  { value: 'personal', label: '个人日常联系', desc: '此号码为本人日常联系使用，非营销外呼号码' },
  { value: 'aftersale', label: '企业售后回访', desc: '此号码用于企业售后服务回访，仅联系已有业务往来的客户' },
  { value: 'booking', label: '门店预约确认', desc: '此号码用于门店预约与到店时间确认，通话对象均为主动预约的客户' },
  { value: 'logistics', label: '物流配送通知', desc: '此号码用于物流配送通知，仅联系有在途订单的收件人' },
  { value: 'hotline', label: '客服热线外呼', desc: '此号码为企业客服热线，外呼对象均为前期主动来电报修 / 咨询的客户' },
  { value: 'other', label: '其它（自行补充）', desc: '' }
];

window.PLATFORMS = [
  {
    id: 'ctcc-opene164',
    name: '中国信通院码号服务推进组',
    kind: 'official',
    queryUrl: 'http://www.opene164.org.cn',
    terminals: '跨平台聚合（对接 360、腾讯、阿里、百度、搜狗、泰迪熊、电话邦等）',
    appliesTo: ['mobile', 'landline', 'virtual'],
    specialty: '国内少有的官方跨平台入口，一份申请可覆盖多家标记平台；中国联通手机号可一站式清除误标记',
    timing: '以平台公示为准，一般约 1-3 个工作日',
    contact: '',
    priority: 1,
    note: '移动 / 电信手机号可在此查询，清除以平台实际支持范围为准'
  },
  {
    id: '360',
    name: '360 手机卫士',
    kind: 'platform',
    queryUrl: 'https://haomashensu.360.cn',
    terminals: '360 手机、部分第三方 ROM',
    appliesTo: ['mobile', 'landline', 'virtual', '400', '95'],
    specialty: '有独立的号码申诉平台，查询与申诉同一入口',
    timing: '以平台公示为准，一般约 1-3 个工作日',
    contact: '010-89180702',
    priority: 2,
    note: '页面会直接显示「该号码无标记信息」或具体标记内容'
  },
  {
    id: 'tencent',
    name: '腾讯手机管家',
    kind: 'platform',
    queryUrl: 'https://yun.m.qq.com',
    terminals: '华为、荣耀、部分安卓机型',
    appliesTo: ['mobile', 'landline', 'virtual', '400'],
    specialty: '覆盖终端面最广的一档，华为 / 荣耀大量机型引用其数据',
    timing: '以平台公示为准，一般约 3-5 个工作日',
    contact: '0755-83765566',
    priority: 2,
    note: '需 QQ 或手机号登录；约 6 人以上标记开始展示标签，20 人以上要求补充号码使用证明'
  },
  {
    id: 'baidu',
    name: '百度号码认证',
    kind: 'platform',
    queryUrl: 'https://haoma.baidu.com',
    terminals: '百度系产品、部分安卓终端',
    appliesTo: ['mobile', 'landline', '400', '95'],
    specialty: '以企业认证为主，企业号信息较全',
    timing: '以平台公示为准，一般约 3-5 个工作日',
    contact: 'QQ 群 910251361',
    priority: 3,
    note: ''
  },
  {
    id: 'teddymobile',
    name: '泰迪熊移动',
    kind: 'platform',
    queryUrl: 'https://teddymobile.cn/numberComplain',
    terminals: '小米、OPPO、vivo 部分机型',
    appliesTo: ['mobile', 'landline', 'virtual', '400'],
    specialty: '普通用户认知度低，但被大量安卓机型内置引用，是漏清重灾区',
    timing: '以平台公示为准，一般约 3-5 个工作日',
    contact: '400-825-3666',
    priority: 2,
    note: '很多人申诉腾讯、360 都通过后标记仍在，就是漏了这一家'
  },
  {
    id: 'dianhua',
    name: '电话邦',
    kind: 'platform',
    queryUrl: 'https://www.dianhua.cn/appeal',
    terminals: '部分安卓终端、第三方应用',
    appliesTo: ['mobile', 'landline', 'virtual', '400'],
    specialty: '部分安卓第三方应用引用其数据',
    timing: '以平台公示为准，一般约 3-5 个工作日',
    contact: '400-061-8800',
    priority: 3,
    note: '知名度低，但同样是漏清高发平台'
  },
  {
    id: 'huawei',
    name: '华为本地黄页',
    kind: 'vendor',
    queryUrl: '手机「电话」App → 骚扰拦截 → 号码申诉',
    terminals: '华为终端本地库',
    appliesTo: ['mobile', 'landline'],
    specialty: '与腾讯标记库相互独立。清了腾讯不等于清了华为本地黄页',
    timing: '以终端提示为准，一般约 3-7 个工作日',
    contact: '',
    priority: 3,
    note: '华为手机的标记数据可能来自四个独立来源：腾讯标记库、华为本地黄页、号码百事通、360'
  },
  {
    id: 'sogou',
    name: '搜狗号码通',
    kind: 'platform',
    queryUrl: '邮件申诉（见联系方式）',
    terminals: '搜狗输入法 / 部分终端残留库',
    appliesTo: ['mobile', 'landline'],
    specialty: '已并入腾讯系，申诉走邮件',
    timing: '以平台回复为准，一般约 5-7 个工作日',
    contact: 'IMETS@tencent.com / 0515-69189017',
    priority: 4,
    note: '产品线已收缩，优先级最低，但如查询显示有标记仍需处理'
  },
  {
    id: 'truecaller',
    name: 'Truecaller',
    kind: 'overseas',
    queryUrl: 'https://www.truecaller.com/search',
    terminals: '海外安卓 / iOS 用户',
    appliesTo: ['mobile'],
    specialty: '全球最大来电识别应用，仅影响海外接听方',
    timing: '提交取消收录后一般 24-48 小时移除',
    contact: '',
    priority: 5,
    note: '号码无国际往来可跳过'
  }
];
