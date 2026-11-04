(() => {
  'use strict';

  const storage = {
    get(key, fallback = null) {
      try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, value); } catch { /* Reading still works without storage. */ }
    },
    json(key, fallback) {
      try { return JSON.parse(this.get(key, 'null')) ?? fallback; } catch { return fallback; }
    },
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const normalize = (value) => String(value).normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  const plain = (value) => String(value).replace(/\s+/g, ' ').trim();

  let theme = storage.get('qa-study-theme', 'light');
  if (!['light', 'dark'].includes(theme)) theme = 'light';
  let fontScale = Number(storage.get('qa-study-font-scale', '1'));
  if (!Number.isFinite(fontScale) || fontScale < 0.9 || fontScale > 1.3) fontScale = 1;

  function applyPreferences() {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
    $$('[data-action="theme"]').forEach((button) => {
      button.setAttribute('aria-label', theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
      button.setAttribute('aria-pressed', String(theme === 'dark'));
      const label = $('[data-theme-label]', button);
      if (label) label.textContent = theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối';
    });
    const fontLabel = $('#font-size-label');
    if (fontLabel) fontLabel.textContent = `${Math.round(fontScale * 100)}%`;
    $$('[data-action="font-size"]').forEach((button) => {
      const direction = Number(button.dataset.delta);
      button.disabled = direction < 0 ? fontScale <= 0.9 : fontScale >= 1.3;
    });
  }
  applyPreferences();

  let toastTimer;
  function notify(message) {
    let toast = $('#hub-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'hub-toast';
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2500);
  }

  async function copyCode(button) {
    const code = $('pre code', button.closest('.code-block') || button.parentElement);
    if (!code) return;
    const content = code.textContent.replace(/\n$/, '');
    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try { await navigator.clipboard.writeText(content); copied = true; } catch { /* Try local-file fallback. */ }
    }
    if (!copied) {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.setAttribute('readonly', '');
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;';
      document.body.append(textarea);
      textarea.select();
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      textarea.remove();
      button.focus({ preventScroll: true });
    }
    if (copied) {
      const oldLabel = button.innerHTML;
      button.textContent = 'Đã sao chép';
      button.dataset.copied = 'true';
      setTimeout(() => { button.innerHTML = oldLabel; delete button.dataset.copied; }, 1600);
      notify('Đã sao chép code, giữ nguyên xuống dòng.');
    } else {
      notify('Trình duyệt chưa cho phép sao chép. Bạn có thể chọn code và nhấn Ctrl+C.');
    }
  }

  document.addEventListener('click', (event) => {
    const copyButton = event.target.closest('.copy-code');
    if (copyButton) { copyCode(copyButton); return; }
    const control = event.target.closest('[data-action]');
    if (!control) return;
    if (control.dataset.action === 'theme') {
      theme = theme === 'dark' ? 'light' : 'dark';
      storage.set('qa-study-theme', theme);
      applyPreferences();
    } else if (control.dataset.action === 'font-size') {
      fontScale = Math.max(0.9, Math.min(1.3, Math.round((fontScale + Math.sign(Number(control.dataset.delta)) * 0.1) * 10) / 10));
      storage.set('qa-study-font-scale', String(fontScale));
      applyPreferences();
    } else if (control.dataset.action === 'print') {
      window.print();
    }
  });

  // The home page also uses this file for theme and saved progress.
  $$('[data-course-progress]').forEach((element) => {
    const course = element.dataset.courseProgress;
    const saved = storage.json(`qa-study-progress:${course}`, []);
    const count = Array.isArray(saved) ? saved.length : 0;
    element.textContent = count ? `${count} chương đã học` : 'Sẵn sàng bắt đầu';
  });

  const course = window.COURSE_DATA;
  if (!course || !Array.isArray(course.chapters)) return;
  const articles = $$('article.chapter');
  if (!articles.length) return;
  const chapters = course.chapters;
  const numberOfChapters = chapters.filter((item) => Number(item.number) > 0).length;
  const progressKey = `qa-study-progress:${course.id}`;
  const lastKey = `qa-study-last:${course.id}`;
  const savedProgress = storage.json(progressKey, []);
  const completed = new Set((Array.isArray(savedProgress) ? savedProgress : [])
    .map(Number).filter((number) => Number.isInteger(number) && number > 0 && number <= numberOfChapters));
  let currentArticle = articles[0];
  let currentIndex = 0;
  const searchInput = $('#course-search');
  const searchResults = $('#search-results');
  const searchCount = $('#search-count');
  const sidebarToggle = $('#sidebar-toggle');

  let overlay = $('.sidebar-overlay');
  if (!overlay) {
    overlay = document.createElement('button');
    overlay.type = 'button';
    overlay.className = 'sidebar-overlay';
    overlay.setAttribute('aria-label', 'Đóng mục lục');
    overlay.tabIndex = -1;
    document.body.append(overlay);
  }
  function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    overlay.hidden = true;
    if (sidebarToggle) sidebarToggle.setAttribute('aria-expanded', 'false');
  }
  if (sidebarToggle) sidebarToggle.addEventListener('click', () => {
    const opened = document.body.classList.toggle('sidebar-open');
    overlay.hidden = !opened;
    sidebarToggle.setAttribute('aria-expanded', String(opened));
    if (opened) setTimeout(() => searchInput?.focus(), 50);
  });
  overlay.addEventListener('click', closeSidebar);

  function updateProgress() {
    const percent = numberOfChapters ? (completed.size / numberOfChapters) * 100 : 0;
    const fill = $('#progress-fill');
    if (fill) fill.style.width = `${percent}%`;
    const progress = $('#progress-label');
    if (progress) progress.textContent = `${completed.size}/${numberOfChapters} chương đã học`;
    const progressTrack = $('.progress-track');
    if (progressTrack) {
      progressTrack.setAttribute('role', 'progressbar');
      progressTrack.setAttribute('aria-valuemin', '0');
      progressTrack.setAttribute('aria-valuemax', String(numberOfChapters));
      progressTrack.setAttribute('aria-valuenow', String(completed.size));
      progressTrack.setAttribute('aria-label', 'Tiến độ học');
    }
    $$('.chapter-link[data-chapter]').forEach((link) => {
      const done = completed.has(Number(link.dataset.chapter));
      link.classList.toggle('complete', done);
      link.classList.toggle('is-read', done);
      const label = $('.chapter-label', link)?.textContent || '';
      link.setAttribute('aria-label', `${label}${done ? ' — Đã học' : ''}`);
    });
    const mark = $('#mark-read');
    if (mark) {
      const number = Number(currentArticle.dataset.chapter);
      mark.disabled = number === 0;
      const done = completed.has(number);
      mark.classList.toggle('is-read', done);
      mark.setAttribute('aria-pressed', String(done));
      mark.textContent = done ? '✓ Đã học chương này' : 'Đánh dấu đã học';
    }
  }

  function activateFromHash(shouldFocus = false) {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { id = ''; }
    if (!id) id = storage.get(lastKey, 'gioi-thieu');
    let target = document.getElementById(id);
    let article = target?.closest('article.chapter');
    if (!article) { article = articles[0]; target = article; }
    articles.forEach((item) => { item.hidden = item !== article; });
    currentArticle = article;
    currentIndex = articles.indexOf(article);
    const number = Number(article.dataset.chapter);
    document.body.classList.toggle('reading-chapter', number > 0);
    const meta = chapters.find((item) => Number(item.number) === number);
    $$('.chapter-link[data-chapter]').forEach((link) => {
      const active = Number(link.dataset.chapter) === number;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    const position = $('#chapter-position');
    if (position) position.textContent = number ? `Chương ${number} / ${numberOfChapters}` : 'Hướng dẫn sử dụng';
    const previous = $('#prev-chapter');
    const next = $('#next-chapter');
    if (previous) previous.disabled = currentIndex <= 0;
    if (next) next.disabled = currentIndex >= articles.length - 1;
    document.title = `${meta?.title || article.dataset.title || 'Giáo trình'} · ${course.title}`;
    storage.set(lastKey, article.id);
    updateProgress();
    closeSidebar();
    requestAnimationFrame(() => {
      if (target && target !== article) target.scrollIntoView({ block: 'start' });
      else window.scrollTo({ top: 0, behavior: 'instant' });
      if (shouldFocus) {
        article.tabIndex = -1;
        article.focus({ preventScroll: true });
      }
    });
  }

  $('#prev-chapter')?.addEventListener('click', () => {
    if (currentIndex > 0) location.hash = articles[currentIndex - 1].id;
  });
  $('#next-chapter')?.addEventListener('click', () => {
    if (currentIndex < articles.length - 1) location.hash = articles[currentIndex + 1].id;
  });
  $('#mark-read')?.addEventListener('click', () => {
    const number = Number(currentArticle.dataset.chapter);
    if (number <= 0) return;
    if (completed.has(number)) completed.delete(number);
    else completed.add(number);
    storage.set(progressKey, JSON.stringify([...completed].sort((a, b) => a - b)));
    updateProgress();
    notify(completed.has(number) ? 'Đã lưu chương đã học trên trình duyệt này.' : 'Đã bỏ đánh dấu chương này.');
  });
  window.addEventListener('hashchange', () => activateFromHash(true));

  const searchIndex = [];
  for (const article of articles) {
    const content = $('.chapter-content', article) || article;
    let entry = { id: article.id, chapter: Number(article.dataset.chapter), title: article.dataset.title || '', text: '' };
    searchIndex.push(entry);
    for (const element of content.children) {
      if (/^H[2-4]$/.test(element.tagName) && element.id) {
        entry = { id: element.id, chapter: Number(article.dataset.chapter), title: plain(element.textContent), text: '' };
        searchIndex.push(entry);
      } else {
        entry.text += ' ' + plain(element.textContent);
      }
    }
  }
  searchIndex.forEach((entry) => {
    entry.text = plain(entry.text);
    entry.normalized = normalize(`${entry.title} ${entry.text}`);
  });

  function performSearch() {
    if (!searchInput || !searchResults) return;
    const query = normalize(searchInput.value.trim());
    const chapterNav = $('.chapter-nav');
    if (chapterNav) chapterNav.hidden = query.length >= 2;
    searchResults.replaceChildren();
    if (query.length < 2) {
      searchResults.hidden = true;
      if (searchCount) searchCount.textContent = query ? 'Nhập ít nhất 2 ký tự' : 'Tìm trong toàn bộ giáo trình';
      return;
    }
    const words = query.split(/\s+/).filter(Boolean);
    const matches = searchIndex.filter((entry) => words.every((word) => entry.normalized.includes(word)));
    matches.sort((left, right) => Number(normalize(right.title).includes(query)) - Number(normalize(left.title).includes(query)));
    if (searchCount) searchCount.textContent = `${matches.length} mục phù hợp${matches.length > 40 ? ' · hiển thị 40 mục đầu' : ''}`;
    searchResults.hidden = false;
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Chưa tìm thấy. Thử tên hàm, thuật ngữ hoặc từ khóa ngắn hơn.';
      searchResults.append(empty);
      return;
    }
    for (const entry of matches.slice(0, 40)) {
      const result = document.createElement('a');
      result.className = 'search-result';
      result.href = `#${entry.id}`;
      const label = document.createElement('small');
      label.textContent = entry.chapter ? `CHƯƠNG ${entry.chapter}` : 'GIỚI THIỆU';
      const title = document.createElement('strong');
      title.textContent = entry.title;
      const excerpt = document.createElement('span');
      const hit = normalize(entry.text).indexOf(words[0]);
      const start = Math.max(0, hit - 35);
      excerpt.textContent = `${start ? '…' : ''}${entry.text.slice(start, start + 135)}${entry.text.length > start + 135 ? '…' : ''}`;
      result.append(label, title, excerpt);
      result.addEventListener('click', () => { if (result.hash === location.hash) activateFromHash(true); });
      searchResults.append(result);
    }
  }
  let searchTimer;
  searchInput?.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(performSearch, 120);
  });
  document.addEventListener('keydown', (event) => {
    const editing = event.target.closest('input,textarea,select,[contenteditable="true"]');
    if ((event.key === '/' && !editing) || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k')) {
      event.preventDefault();
      document.body.classList.add('sidebar-open');
      overlay.hidden = false;
      sidebarToggle?.setAttribute('aria-expanded', 'true');
      searchInput?.focus();
      searchInput?.select();
    } else if (event.key === 'Escape') {
      if (searchInput && document.activeElement === searchInput && searchInput.value) {
        searchInput.value = '';
        performSearch();
      } else closeSidebar();
    }
  });
  let printing = false;
  window.addEventListener('beforeprint', () => {
    printing = true;
    articles.forEach((article) => { article.hidden = false; });
  });
  window.addEventListener('afterprint', () => {
    if (printing) articles.forEach((article) => { article.hidden = article !== currentArticle; });
    printing = false;
  });
  performSearch();
  activateFromHash();
})();
