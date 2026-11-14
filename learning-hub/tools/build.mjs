import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked, Renderer } from 'marked';
import hljs from 'highlight.js';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const hubDir = path.resolve(toolsDir, '..');
const workspace = path.resolve(hubDir, '..');
const videoMap = JSON.parse(await fs.readFile(path.join(toolsDir, 'video-map.json'), 'utf8'));
const fmtTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
function videoChip(course, key) {
  const entry = videoMap[course.id]?.map?.[key];
  if (!entry) return '';
  return `<button type="button" class="video-chip" data-video="${entry.v}" data-time="${entry.t}" title="Xem video ${entry.v + 1} từ phút ${fmtTime(entry.t)}"><span aria-hidden="true">▶</span> Video ${entry.v + 1} · ${fmtTime(entry.t)}</button>`;
}
const courses = [
  {
    id: 'automation', folder: 'automation', chaptersExpected: 32,
    source: 'Giao-trinh-Automation-Selenium-Java-va-Playwright-JavaScript.md',
    title: 'Automation Testing', subtitle: 'Selenium + Java · Playwright + JavaScript',
    description: 'Học cách đọc, viết và sửa test qua từng thao tác được đặt cạnh nhau. Từ DOM và locator đến một dự án kiểm thử hoàn chỉnh.',
    other: '../javascript-performance/index.html', otherLabel: 'JavaScript cho Performance',
    groups: { 1: 'Nền tảng & thao tác đầu tiên', 9: 'Thao tác thực tế & độ tin cậy', 19: 'Hai dự án hoàn chỉnh', 25: 'Đọc code, tự luyện & tra cứu' },
  },
  {
    id: 'performance', folder: 'javascript-performance', chaptersExpected: 30,
    source: 'Giao-trinh-JavaScript-cho-Performance-Tester.md',
    title: 'JavaScript cho Performance Tester', subtitle: 'JavaScript căn bản · Kiểm thử hiệu năng · k6',
    description: 'Ôn lại JavaScript để hiểu code đang làm gì, biết thay đúng tham số và đọc được kết quả của một bài kiểm thử hiệu năng.',
    other: '../automation/index.html', otherLabel: 'Automation Testing',
    groups: { 1: 'Nền tảng JavaScript', 11: 'Tư duy kiểm thử hiệu năng', 16: 'k6 & cấu trúc source', 23: 'Đọc, chỉnh & tự luyện' },
  },
];

const escapeHtml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const unescapeHtml = value => String(value).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, '&');
const plainHtml = value => unescapeHtml(String(value).replace(/<[^>]+>/g, ''));
const aliases = { js: 'javascript', ts: 'typescript', html: 'xml', svg: 'xml', md: 'markdown', ps1: 'powershell', sh: 'bash', shell: 'bash', yml: 'yaml', txt: 'plaintext', text: 'plaintext', csv: 'plaintext', mermaid: 'plaintext' };
const labels = { javascript: 'JavaScript', java: 'Java', typescript: 'TypeScript', json: 'JSON', xml: 'HTML / XML', css: 'CSS', powershell: 'PowerShell', bash: 'Shell', yaml: 'YAML', plaintext: 'Văn bản', markdown: 'Markdown' };
let globalCodeCount = 0;

function highlightCode(source, requested = 'plaintext') {
  const lang = aliases[requested.toLowerCase()] ?? requested.toLowerCase();
  const language = hljs.getLanguage(lang) ? lang : 'plaintext';
  let value;
  try { value = hljs.highlight(source, { language, ignoreIllegals: true }).value; }
  catch { value = escapeHtml(source); }
  return { value, language };
}

function codeBlock(source, language, comparison = false, originalLanguage = '') {
  const text = String(source).replace(/\r\n/g, '\n').replace(/\n$/, '');
  const output = highlightCode(text, language);
  const label = originalLanguage === 'mermaid' ? 'Sơ đồ · Mermaid' : (labels[output.language] ?? output.language);
  globalCodeCount++;
  return `<div class="code-block${comparison ? ' compare-code' : ''}" data-language="${escapeHtml(output.language)}"><div class="code-toolbar"><span class="code-language">${escapeHtml(label)}</span><button type="button" class="copy-code" aria-label="Sao chép đoạn mã ${escapeHtml(label)}"><span aria-hidden="true">⧉</span> Sao chép</button></div><pre tabindex="0"><code class="hljs language-${escapeHtml(output.language)}">${output.value}</code></pre></div>`;
}

function rawCode(token) {
  const delimiter = token.raw?.match(/^(`+)/)?.[1];
  const raw = delimiter ? token.raw.slice(delimiter.length, -delimiter.length) : token.text;
  return raw.replace(/\\\|/g, '|');
}

function isWhitespace(token) {
  return token.type === 'text' && !token.text.trim();
}

function isBreak(token) {
  return token.type === 'br' || (token.type === 'html' && /^<br\s*\/?\s*>$/i.test(token.text.trim()));
}

function looksLikeStatement(source) {
  return /[;{}]|\b(?:const|let|var|String|WebElement|By|Locator|boolean|int|await|return|import|export|new|assertEquals)\b|[A-Za-z_$][\w.$]*\s*\(|\s=\s/.test(source);
}

function inferLanguage(source, fallback) {
  if (/^(?:k6\s|npm\s|npx\s|mvn\s|node\s|java\s|javac\s|\$env:|Remove-Item\s)/.test(source.trim())) return 'powershell';
  return fallback;
}

function renderCell(cell, language, compare, parser) {
  // Break only on real Markdown <br> tokens; literal HTML inside code remains code.
  const lines = [[]];
  for (const token of cell.tokens) {
    if (isBreak(token)) lines.push([]);
    else lines.at(-1).push(token);
  }
  const output = [];
  let codeLines = [];
  function flushCode() {
    if (!codeLines.length) return;
    const source = codeLines.join('\n');
    output.push(codeBlock(source, inferLanguage(source, language), compare));
    codeLines = [];
  }
  function prose(tokens) {
    if (!tokens.length) return;
    const html = parser.parseInline(tokens);
    if (plainHtml(html).trim()) output.push(`<p class="cell-prose">${html}</p>`);
  }
  for (const line of lines) {
    const substantive = line.filter(token => !isWhitespace(token));
    const pureCode = substantive.length > 0 && substantive.every(token => token.type === 'codespan');
    if (pureCode && (compare || substantive.some(token => looksLikeStatement(rawCode(token))))) {
      codeLines.push(substantive.map(rawCode).join(' '));
      continue;
    }
    const firstCode = line.findIndex(token => token.type === 'codespan');
    const before = firstCode < 0 ? [] : line.slice(0, firstCode);
    const beforeText = before.length ? plainHtml(parser.parseInline(before)).trim() : '';
    const candidate = firstCode < 0 ? null : line[firstCode];
    const prefixIsLabel = beforeText.length > 0 && beforeText.length < 100 && /[:：]$/.test(beforeText);
    const leadingStatement = candidate && looksLikeStatement(rawCode(candidate)) && (!beforeText || prefixIsLabel);
    if (leadingStatement) {
      if (beforeText) { flushCode(); prose(before); }
      codeLines.push(rawCode(candidate));
      const remainder = line.slice(firstCode + 1);
      if (remainder.some(token => !isWhitespace(token))) {
        flushCode();
        prose(remainder);
      }
    } else {
      flushCode();
      prose(line);
    }
  }
  flushCode();
  return output.join('\n');
}

function renderChapter(markdown, chapter, course) {
  const renderer = new Renderer();
  let headingIndex = 0;
  let headingNumber = chapter.number;
  const subsections = [];

  renderer.code = function (token) {
    const language = token.lang?.split(/\s+/)[0] || 'plaintext';
    return codeBlock(token.text, aliases[language] ?? language, false, language);
  };
  renderer.heading = function (token) {
    const content = this.parser.parseInline(token.tokens);
    const title = plainHtml(content);
    const id = `s-${chapter.number}-${++headingIndex}`;
    if (token.depth <= 4) subsections.push({ id, title, depth: token.depth });
    const isExercise = /(?:^|\.)\s*(?:Bài(?: tập| tự| đọc| thực hành)?|Tự kiểm tra|Năm câu hỏi)/i.test(title);
    const className = isExercise ? ' class="exercise-title"' : '';
    const depth = Math.max(2, token.depth);
    const sectionNumber = token.depth === 3 ? title.match(/^(\d+\.\d+)\b/)?.[1] : null;
    const chip = sectionNumber ? videoChip(course, sectionNumber) : '';
    return `<h${depth} id="${id}"${className}>${content}${chip}<a class="heading-anchor" href="#${id}" aria-label="Liên kết đến ${escapeHtml(title)}">#</a></h${depth}>\n`;
  };
  renderer.paragraph = function (token) {
    const content = this.parser.parseInline(token.tokens);
    if (/^\s*<strong[^>]*>\s*(?:Đáp án|Lời giải)/i.test(content)) {
      return `<aside class="answer-block" role="note"><p>${content}</p></aside>\n`;
    }
    if (/^\s*<strong[^>]*>\s*(?:Checkpoint|Tự kiểm tra|Lưu ý|Chú ý)/i.test(content)) {
      return `<div class="callout"><p>${content}</p></div>\n`;
    }
    return `<p>${content}</p>\n`;
  };
  renderer.strong = function (token) {
    const content = this.parser.parseInline(token.tokens);
    const cls = /^(?:Đáp án|Lời giải)/i.test(plainHtml(content)) ? ' class="answer-label"' : '';
    return `<strong${cls}>${content}</strong>`;
  };
  renderer.html = function (token) {
    if (/^\s*<!--/.test(token.text)) return '';
    if (/^\s*<br\s*\/?\s*>\s*$/i.test(token.text)) return '<br>';
    // All application examples are code; no executable document HTML is permitted.
    return escapeHtml(token.text);
  };
  renderer.link = function (token) {
    const content = this.parser.parseInline(token.tokens);
    const href = token.href;
    if (/^javascript:/i.test(href)) return content;
    const external = /^https?:\/\//i.test(href);
    return `<a href="${escapeHtml(href)}"${token.title ? ` title="${escapeHtml(token.title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${content}</a>`;
  };
  renderer.table = function (token) {
    const headers = token.header.map(cell => plainHtml(this.parser.parseInline(cell.tokens)));
    const compare = headers.length === 2 && /Selenium/i.test(headers[0]) && /Playwright/i.test(headers[1]);
    const defaultLanguage = course.id === 'automation' ? 'java' : 'javascript';
    const langs = headers.map((header, index) => compare ? (/JavaScript/i.test(header) ? 'javascript' : 'java') : defaultLanguage);
    const thead = token.header.map((cell, index) => `<th scope="col">${this.parser.parseInline(cell.tokens)}</th>`).join('');
    const rows = token.rows.map(row => `<tr>${row.map((cell, index) => `<td${compare ? ` data-column-label="${escapeHtml(headers[index])}"` : ''}>${compare ? `<span class="mobile-column-label" aria-hidden="true">${escapeHtml(headers[index])}</span>` : ''}${renderCell(cell, langs[index] ?? defaultLanguage, compare, this.parser)}</td>`).join('')}</tr>`).join('\n');
    return `<div class="${compare ? 'compare-table' : 'table-scroll'}"><table${compare ? ' class="comparison-table"' : ''}><thead><tr>${thead}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
  };

  const marked = new Marked({ renderer, gfm: true, breaks: false, async: false });
  let content = marked.parse(markdown);
  // Tight list items bypass the paragraph renderer. Keep their answer visible and styled.
  content = content.replace(/(<li(?:\s[^>]*)?>)\s*(<strong class="answer-label">[\s\S]*?)(?=<\/li>)/g, '$1<div class="answer-block">$2</div>');
  chapter.subsections = subsections;
  const kicker = chapter.number === 0 ? 'BẮT ĐẦU TỪ ĐÂY' : `CHƯƠNG ${String(chapter.number).padStart(2, '0')} / ${course.chaptersExpected}`;
  return `<article class="chapter" id="${chapter.id}" data-title="${escapeHtml(chapter.title)}" data-chapter="${chapter.number}"${chapter.number ? ' hidden' : ''} aria-labelledby="${chapter.id}-title"><header class="chapter-heading"><p class="chapter-kicker">${kicker}</p><h2 id="${chapter.id}-title">${escapeHtml(chapter.title)}</h2>${videoChip(course, String(chapter.number))}</header><div class="chapter-content">${content}</div></article>`;
}

function splitBook(markdown, course) {
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/^<a id="chuong-\d+"><\/a>\s*$/gm, '');
  const matches = [...normalized.matchAll(/^## (\d+)\. (.+)$/gm)];
  if (matches.length !== course.chaptersExpected) throw new Error(`${course.id}: expected ${course.chaptersExpected} chapters, got ${matches.length}`);
  let intro = normalized.slice(0, matches[0].index).replace(/^# .+\n+/, '');
  intro = intro.replace(/^## Mục lục\n[\s\S]*?(?=^### Phạm vi kiểm chứng|$(?![\s\S]))/m, '');
  const chapters = [{ id: 'gioi-thieu', number: 0, title: 'Cách học giáo trình này', markdown: intro }];
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const number = Number(match[1]);
    const bodyStart = match.index + match[0].length;
    const bodyEnd = i + 1 < matches.length ? matches[i + 1].index : normalized.length;
    chapters.push({ id: `chuong-${number}`, number, title: match[2].trim(), markdown: normalized.slice(bodyStart, bodyEnd) });
  }
  return chapters;
}

function createSidebar(course, chapters) {
  return `<aside class="sidebar" id="course-sidebar" aria-label="Mục lục giáo trình"><div class="sidebar-top"><a class="back-home" href="../indexHome.html">← Trang chủ</a><p class="sidebar-course-name">${escapeHtml(course.title)}</p><label class="search-box" for="course-search"><span aria-hidden="true">⌕</span><input id="course-search" type="search" placeholder="Tìm hàm, khái niệm, bài tập…" autocomplete="off"><kbd aria-hidden="true">/</kbd></label><p id="search-count" class="search-count" aria-live="polite"></p><div id="search-results" class="search-results" hidden aria-live="polite"></div></div><nav class="chapter-nav" aria-label="Danh sách chương">${chapters.map(chapter => `${course.groups[chapter.number] ? `<p class="nav-group-label">${escapeHtml(course.groups[chapter.number])}</p>` : ''}<a class="chapter-link${chapter.number === 0 ? ' active' : ''}" data-chapter="${chapter.number}" href="#${chapter.id}"${chapter.number === 0 ? ' aria-current="page"' : ''}><span class="chapter-number">${chapter.number === 0 ? '↗' : String(chapter.number).padStart(2, '0')}</span><span class="chapter-label">${escapeHtml(chapter.title)}</span><span class="chapter-status" aria-hidden="true"></span></a>`).join('\n')}</nav><div class="sidebar-bottom"><div class="progress-meta"><span id="progress-label">0 / ${course.chaptersExpected} chương đã đọc</span></div><div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="${course.chaptersExpected}" aria-valuenow="0" aria-label="Tiến độ học"><span id="progress-fill" class="progress-fill" style="width:0%"></span></div><a class="source-link" href="source.md" download>Tải bản Markdown ↗</a></div></aside>`;
}

function videoDock(course) {
  const info = videoMap[course.id];
  if (!info) return '';
  const options = info.videos.map((video, index) => `<option value="${index}">${escapeHtml(video.title)} (${fmtTime(video.dur)})</option>`).join('');
  return `<aside class="video-dock" id="video-dock" aria-label="Trình phát video bài giảng" hidden><div class="video-dock-bar"><select aria-label="Chọn video">${options}</select><button type="button" data-dock="size" aria-label="Phóng to hoặc thu nhỏ">⤢</button><button type="button" data-dock="close" aria-label="Đóng video">✕</button></div><video controls preload="metadata" playsinline></video></aside>`;
}

function createPage(course, chapters, articles) {
  const data = { id: course.id, title: course.title, subtitle: course.subtitle, chapters: chapters.map(({ markdown, ...chapter }) => chapter) };
  const safeData = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="description" content="${escapeHtml(course.description)}"><title>${escapeHtml(course.title)} · QA Study Hub</title><link rel="stylesheet" href="../assets/styles.css"><script>window.COURSE_DATA=${safeData};</script><script>window.VIDEO_DATA=${JSON.stringify(videoMap[course.id] ?? null).replace(/</g, '\\u003c')};</script><script defer src="../assets/app.js"></script></head>
<body class="reader-page" data-course="${course.id}"><a class="skip-link" href="#reader-main">Đến nội dung bài học</a><header class="topbar"><div class="topbar-left"><button id="sidebar-toggle" class="sidebar-toggle icon-button" type="button" aria-label="Mở mục lục" aria-controls="course-sidebar" aria-expanded="false">☰</button><a class="brand" href="../indexHome.html"><span class="brand-mark" aria-hidden="true">Q<span>·</span></span><span>QA Study Hub<small>Ghi chép để hiểu code</small></span></a></div><div class="topbar-right"><a class="course-switch" href="${course.other}">Đổi sang ${escapeHtml(course.otherLabel)} <span aria-hidden="true">↗</span></a><button class="icon-button theme-toggle" type="button" data-action="theme" aria-label="Đổi giao diện sáng/tối" title="Đổi giao diện sáng/tối"><span aria-hidden="true">◐</span></button></div></header>
<button class="sidebar-overlay" type="button" aria-label="Đóng mục lục" hidden></button><div class="reader-layout">${createSidebar(course, chapters)}<main class="reader-main" id="reader-main"><header class="course-hero"><p class="eyebrow">TỦ SÁCH THỰC HÀNH / ${course.id === 'automation' ? 'AUTOMATION' : 'PERFORMANCE'}</p><h1 class="course-title">${escapeHtml(course.title)}</h1><p class="course-description">${escapeHtml(course.description)}</p><div class="course-meta"><span>${course.chaptersExpected} chương</span><span>Đáp án ngay dưới bài tập</span><span>Đọc được ngoại tuyến</span></div></header><div class="reader-toolbar"><span class="chapter-position" id="chapter-position">Giới thiệu</span><div class="reading-controls" aria-label="Tùy chỉnh đọc"><button type="button" data-action="video-toggle" aria-label="Mở hoặc đóng trình phát video">▶ Video</button><button type="button" data-action="font-size" data-delta="-1" aria-label="Giảm cỡ chữ">A−</button><button type="button" data-action="font-size" data-delta="1" aria-label="Tăng cỡ chữ">A+</button><button type="button" data-action="print" aria-label="In giáo trình">In</button></div></div><div id="chapters">${articles.join('\n')}</div><footer class="chapter-footer"><button id="prev-chapter" class="nav-button" type="button" disabled><span aria-hidden="true">←</span> Chương trước</button><button id="mark-read" class="mark-read" type="button"><span aria-hidden="true">✓</span> Đánh dấu đã đọc</button><button id="next-chapter" class="nav-button primary" type="button">Chương tiếp <span aria-hidden="true">→</span></button></footer><p class="reader-footnote">Học từng đoạn nhỏ. Đọc code → dự đoán kết quả → đối chiếu lời giải.</p></main></div>${videoDock(course)}<div class="toast" id="toast" role="status" aria-live="polite" hidden></div></body></html>\n`;
}

const report = [];
for (const course of courses) {
  const markdown = await fs.readFile(path.join(workspace, course.source), 'utf8');
  const chapters = splitBook(markdown, course);
  const beforeCount = globalCodeCount;
  const articles = chapters.map(chapter => renderChapter(chapter.markdown, chapter, course));
  const html = createPage(course, chapters, articles);
  const target = path.join(hubDir, course.folder);
  await fs.mkdir(target, { recursive: true });
  await fs.writeFile(path.join(target, 'index.html'), html, 'utf8');
  await fs.writeFile(path.join(target, 'source.md'), markdown, 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) throw new Error(`${course.id}: duplicate IDs ${duplicateIds}`);
  const malformedCode = [...html.matchAll(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/g)].filter(match => /&lt;br\s*\/?&gt;/i.test(match[1]));
  // Literal HTML <br> is valid when explicitly taught; comparison separator defects aren't.
  if (malformedCode.length) console.warn(`${course.id}: ${malformedCode.length} code blocks contain a literal HTML br tag; inspect if intended.`);
  const allAnswers = (markdown.match(/\*\*(?:Đáp án|Lời giải)/g) ?? []).length;
  const renderedAnswers = (html.match(/class="answer-label"/g) ?? []).length;
  if (allAnswers !== renderedAnswers) throw new Error(`${course.id}: answers lost ${allAnswers} -> ${renderedAnswers}`);
  report.push({ course: course.id, chapters: chapters.length - 1, articles: chapters.length, codeBlocks: globalCodeCount - beforeCount, comparisonTables: (html.match(/class="comparison-table"/g) ?? []).length, answers: renderedAnswers, bytes: Buffer.byteLength(html) });
}
await fs.writeFile(path.join(hubDir, 'index.html'), '<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=indexHome.html"><title>QA Study Hub</title></head><body><p><a href="indexHome.html">Mở QA Study Hub</a></p></body></html>\n', 'utf8');
await fs.writeFile(path.join(toolsDir, 'build-report.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
