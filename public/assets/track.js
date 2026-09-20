// 号通查 转化事件埋点（基于已注入的百度统计 _hmt）
// 暴露 window.__hmtTrack(cat, act, label) 供工具页 app.js 调用（如预检提交成功）
(function () {
  function push(cat, act, label) {
    try {
      if (window._hmt) window._hmt.push(['_trackEvent', cat, act, label || '']);
    } catch (e) { /* 统计失败不阻塞业务 */ }
  }
  window.__hmtTrack = push;

  document.addEventListener('click', function (e) {
    var t = e.target;
    // 合作入口（xbh5.open10086.com，硬规定链接）点击
    var co = t.closest && t.closest('a[href*="xbh5.open10086.com"]');
    if (co) { push('cooperation', 'click', co.getAttribute('href') || 'xbh5'); return; }
    // 复制微信号
    var cp = t.closest && t.closest('[data-wechat-copy]');
    if (cp) {
      var wx = cp.getAttribute('data-wechat-copy') || 'SXLH-888';
      try { if (navigator.clipboard) navigator.clipboard.writeText(wx); } catch (_) {}
      push('wechat', 'copy', wx);
      return;
    }
    // 关闭加微悬浮条
    var cl = t.closest && t.closest('[data-wx-close]');
    if (cl) {
      var bar = document.getElementById('wx-cta-bar');
      if (bar) bar.style.display = 'none';
      push('wechat', 'close', 'float_bar');
    }
  });
})();
