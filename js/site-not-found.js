(() => {
  const copy = {"en": {"title": "Page not found", "description": "The link may be outdated, or the address may be incorrect. Let’s get you back to the community.", "home": "Back to home", "events": "Browse events", "explore": "Explore 4Seas", "routes": ["Community events", "Coliving", "Residency programs", "Room booking"]}, "zh": {"title": "这个页面找不到了", "description": "链接可能已过期，或网址输入有误。你可以返回首页，或从这里继续探索 4Seas。", "home": "返回首页", "events": "查看活动", "explore": "继续探索 4Seas", "routes": ["社区活动", "共享居住", "驻留计划", "会议室预订"]}, "th": {"title": "ไม่พบหน้านี้", "description": "ลิงก์อาจหมดอายุหรือที่อยู่ไม่ถูกต้อง กลับไปที่หน้าแรกหรือสำรวจชุมชน 4Seas ต่อได้ที่นี่", "home": "กลับหน้าแรก", "events": "ดูกิจกรรม", "explore": "สำรวจ 4Seas", "routes": ["กิจกรรมชุมชน", "โคลิฟวิ่ง", "โปรแกรมพำนัก", "จองห้องประชุม"]}};
  const main = document.querySelector('.siteNotFound');
  if (!main) return;
  for (const button of main.querySelectorAll('[data-language]')) {
    button.addEventListener('click', () => {
      const language = button.dataset.language;
      const text = copy[language];
      if (!text) return;
      main.lang = language === 'zh' ? 'zh-CN' : language;
      for (const item of main.querySelectorAll('[data-language]')) item.setAttribute('aria-pressed', String(item === button));
      for (const item of main.querySelectorAll('[data-copy]')) item.textContent = text[item.dataset.copy];
      for (const item of main.querySelectorAll('[data-route]')) item.textContent = text.routes[Number(item.dataset.route)];
      main.querySelector('.errorRoutes').setAttribute('aria-label', text.explore);
    });
  }
})();
