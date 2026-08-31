/**
 * 站外跳转入口集中配置
 * 所有"快速清除"与"号码核验"入口统一在此维护，改授权码只需改一处。
 */

/** 快速清除入口（全站所有"立即清除标记/快速清除"跳转目标） */
export const CLEAR_LINK = 'https://xbh5.open10086.com/#/?authorization=f91029a83a8758aa';

/** 号码核验入口（法人号码核验三要素校验跳转目标） */
export const VERIFY_LINK =
  'https://xbh5.open10086.com/factor/#/pages/index/index?authorization=f91029a83a8758aa';

/** 外链打开属性：新窗口打开并断开 opener，防止 window.opener 钓鱼 */
export const EXTERNAL_PROPS = {
  target: '_blank',
  rel: 'noopener noreferrer',
} as const;
