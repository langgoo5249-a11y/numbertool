/* ============================================================
   号通查 · 号通查 — 公共脚本
   红线：
   1. 不自造任何标记数据。号码标记是各厂商私有库，本脚本只做
      格式识别、号段判断、平台清单筛选、文本组装——不产生任何
      「你的号码被标记了」的结论。
   2. 身份证号等敏感信息只在浏览器本地校验，不上传、不存储。
   ============================================================ */
(function () {
  'use strict';

  var NK = {};

  /* ---------------- 工具：DOM / 文本 ---------------- */
  NK.$ = function (sel, root) { return (root || document).querySelector(sel); };
  NK.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  NK.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  NK.toast = function (msg) {
    var el = document.getElementById('nk-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'nk-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove('show'); }, 2200);
  };

  NK.copy = function (text, okMsg) {
    var done = function () { NK.toast(okMsg || '已复制到剪贴板'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { NK.fallbackCopy(text, done); });
    } else {
      NK.fallbackCopy(text, done);
    }
  };

  NK.fallbackCopy = function (text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) { NK.toast('复制失败，请手动选中复制'); }
    document.body.removeChild(ta);
  };

  /* ---------------- 号码类型识别（纯格式判断，不含任何查询） ---------------- */
  var VIRTUAL_PREFIX = ['162', '165', '167', '170', '171'];

  NK.detectType = function (raw) {
    var digits = String(raw || '').replace(/[^\d]/g, '');
    if (digits.indexOf('86') === 0 && digits.length > 11) digits = digits.slice(2);
    if (/^1[3-9]\d{9}$/.test(digits)) {
      var p3 = digits.slice(0, 3);
      return { type: VIRTUAL_PREFIX.indexOf(p3) >= 0 ? 'virtual' : 'mobile', digits: digits, prefix3: p3 };
    }
    if (/^400\d{7}$/.test(digits)) return { type: '400', digits: digits, prefix3: digits.slice(0, 3) };
    if (/^9[5-6]\d{3,7}$/.test(digits)) return { type: '95', digits: digits, prefix3: digits.slice(0, 3) };
    if (/^0\d{9,11}$/.test(digits)) {
      var m = digits.match(/^(0\d{2,3})(\d{7,8})$/);
      return { type: 'landline', digits: digits, areacode: m ? m[1] : digits.slice(0, 3) };
    }
    return null;
  };

  NK.TYPE_LABEL = {
    mobile: '手机号',
    landline: '固定电话（座机）',
    virtual: '虚拟运营商号段',
    '400': '400 企业号码',
    '95': '95 / 96 号码'
  };

  /* ---------------- 本地号段降级（接口不可用时使用） ---------------- */
  NK.lookupLocal = function (digits, type) {
    if (type === 'landline') {
      return { carrier: '固定电话（以区号判断）', province: '', city: '', areacode: (digits.match(/^(0\d{2,3})/) || ['', ''])[1] };
    }
    var p3 = digits.slice(0, 3);
    var p7 = digits.slice(0, 7);
    var carrier = (window.PREFIX3_OPERATOR || {})[p3] || '';
    var area = null;
    var table = window.PREFIX7_AREA || [];
    for (var i = 0; i < table.length; i++) {
      if (table[i].prefix === p7) { area = table[i]; break; }
    }
    if (!area) {
      // 退化到前 4 位模糊匹配（号段库节选，未收录时按前缀相近取）
      for (var j = 0; j < table.length; j++) {
        if (table[j].prefix.slice(0, 4) === p7.slice(0, 4)) { area = table[j]; break; }
      }
    }
    return {
      carrier: (area && area.carrier) || carrier || '',
      province: area ? area.province : '',
      city: area ? area.city : '',
      areacode: area ? (area.areacode || '') : ''
    };
  };

  /* ---------------- 归属地查询：调线上真实接口，失败降级本地号段库 ---------------- */
  // 同源接口（Cloudflare Pages Function: functions/api/attribution.js）
  // 走同源而非跨站，接口不可用时页面会自动降级到本地号段库
  NK.ATTRIBUTION_API = '/api/attribution?phone=';

  NK.fetchAttribution = function (digits) {
    // 接口面向 11 位手机号 / 座机号码；95、400 等短号码没有号段归属，
    // 直接走本地库，避免发出必然失败的请求。
    if (!/^\d{11}$/.test(String(digits || ''))) {
      return Promise.resolve({ ok: false, source: 'local' });
    }
    return fetch(NK.ATTRIBUTION_API + encodeURIComponent(digits), { headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error('bad payload');
        return {
          ok: true,
          source: d.source || 'online',
          carrier: d.company || '',
          province: d.province || '',
          city: d.city || '',
          areacode: d.areacode || '',
          zip: d.zip || ''
        };
      })
      .catch(function () { return { ok: false, source: 'local' }; });
  };

  /* ---------------- 身份证号校验（GB 11643-1999 校验位算法，纯本地） ---------------- */
  var ID_WEIGHT = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  var ID_CHECK = '10X98765432';

  NK.checkIdCard = function (id) {
    var s = String(id || '').trim().toUpperCase();
    var res = { ok: false, level: 'error', msg: '' };
    if (!s) { res.msg = '未填写'; return res; }
    if (s.length !== 18) { res.msg = '长度应为 18 位，当前 ' + s.length + ' 位'; return res; }

    if (!/^\d{17}[\dX]$/.test(s)) { res.msg = '末位只能是数字或大写 X，且前 17 位必须是数字'; return res; }

    var birth = s.slice(6, 14);
    var y = +birth.slice(0, 4), m = +birth.slice(4, 6), d = +birth.slice(6, 8);
    if (y < 1900 || y > new Date().getFullYear()) { res.msg = '出生年份异常（' + y + '）'; return res; }
    if (m < 1 || m > 12) { res.msg = '出生月份异常（' + m + '）'; return res; }
    var dim = new Date(y, m, 0).getDate();
    if (d < 1 || d > dim) { res.msg = '出生日期异常（' + y + '-' + m + '-' + d + '）'; return res; }

    var sum = 0;
    for (var i = 0; i < 17; i++) sum += (+s[i]) * ID_WEIGHT[i];
    var expect = ID_CHECK[sum % 11];
    if (expect !== s[17]) {
      res.msg = '校验位不匹配（按加权算法应为「' + expect + '」，实际是「' + s[17] + '」）';
      return res;
    }
    res.ok = true;
    res.level = 'ok';
    res.msg = '格式与校验位均通过（出生日期 ' + y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0') + '）';
    res.gender = (+s[16]) % 2 === 1 ? '男' : '女';
    return res;
  };

  /* ---------------- 其它预检 ---------------- */
  NK.checkName = function (name) {
    var s = String(name || '').trim();
    if (!s) return { ok: false, level: 'error', msg: '未填写' };
    if (s.length < 2) return { ok: false, level: 'error', msg: '姓名至少 2 个字' };
    if (s.length > 20) return { ok: false, level: 'error', msg: '姓名过长，请核对' };
    if (!/^[\u4e00-\u9fa5][\u4e00-\u9fa5·]{0,19}$/.test(s)) {
      return { ok: false, level: 'warn', msg: '含非中文字符。少数民族姓名含「·」可忽略此提示' };
    }
    return { ok: true, level: 'ok', msg: '格式正常' };
  };

  NK.checkCompany = function (name) {
    var s = String(name || '').trim();
    if (!s) return { ok: false, level: 'error', msg: '未填写' };
    if (s.length < 4) return { ok: false, level: 'error', msg: '企业全称通常不少于 4 个字' };
    if (s.length > 60) return { ok: false, level: 'error', msg: '企业名称过长，请核对' };
    var suffixes = ['有限公司', '有限责任公司', '股份有限公司', '分公司', '个体工商户', '中心', '厂', '店', '事务所', '合作社', '工作室', '经营部'];
    var hit = suffixes.some(function (x) { return s.indexOf(x) >= 0; });
    if (!hit) {
      return { ok: true, level: 'warn', msg: '未识别到常见企业组织形式后缀（如「有限公司」）。核验一般要求填工商登记全称，简称可能不匹配' };
    }
    return { ok: true, level: 'ok', msg: '格式正常，含企业组织形式后缀' };
  };

  NK.maskPhone = function (digits) {
    var d = String(digits || '');
    if (d.length <= 7) return d;
    return d.slice(0, 3) + '****' + d.slice(-4);
  };

  NK.highlight = function (el, res) {
    el.classList.remove('alert-ok', 'alert-warn', 'alert-error', 'hidden');
    if (res.level === 'ok') { el.classList.add('alert-ok'); el.textContent = '✓ ' + res.msg; }
    else if (res.level === 'warn') { el.classList.add('alert-warn'); el.textContent = '! ' + res.msg; }
    else { el.classList.add('alert-error'); el.textContent = '✕ ' + res.msg; }
  };

  NK.printArea = function (selector) {
    var node = document.querySelector(selector);
    if (!node) { window.print(); return; }
    var w = window.open('', '_blank', 'width=860,height=900');
    if (!w) { NK.toast('弹窗被拦截，请允许后重试'); return; }
    var css = '<link rel="stylesheet" href="' + new URL('assets/style.css', location.href).href + '">';
    w.document.write('<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<title>打印 · 号通查</title>' + css +
      '<style>body{background:#fff;padding:24px}.no-print{display:none!important}</style>' +
      '</head><body>' + node.innerHTML + '</body></html>');
    w.document.close();
    w.focus();
    setTimeout(function () { w.print(); }, 350);
  };

  window.NK = NK;
})();
