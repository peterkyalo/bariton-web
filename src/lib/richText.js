/**
 * Utility helpers for course learning materials:
 * - Rich text & Markdown rendering
 * - Media URL normalization for uploaded covers & inline editor images
 * - YouTube Video ID extraction
 * - Reading time estimation
 */

const DEFAULT_API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'http://localhost:8000';

/**
 * Resolve an uploaded media URL or storage path so it always points to a valid URL.
 * Keeps root-relative `/storage/...` URLs as-is in unit test environments when appropriate,
 * or resolves relative storage paths (`course-covers/...`, `http://localhost/storage/...`) against the API origin.
 */
export function resolveMediaUrl(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  // Fix APP_URL mismatch where port :8000 was omitted (e.g. http://localhost/storage/...)
  if (/^https?:\/\/localhost\/storage\//i.test(trimmed)) {
    return trimmed.replace(/^https?:\/\/localhost\/storage\//i, `${DEFAULT_API_URL.replace(/\/$/, '')}/storage/`);
  }

  // Already a full http(s), data, or blob URL
  if (/^(https?:\/\/|blob:|data:)/i.test(trimmed)) {
    return trimmed;
  }

  // Raw storage disk path without /storage/ prefix (e.g. "course-covers/abc.png")
  if (/^(course-covers|module-covers|editor-images|course-materials)\//i.test(trimmed)) {
    return `${DEFAULT_API_URL.replace(/\/$/, '')}/storage/${trimmed}`;
  }

  return trimmed;
}

/**
 * Extract 11-character YouTube video ID from URL or raw ID string.
 */
export function extractYouTubeId(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();

  // If already standard 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Common YouTube URL variations
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }

  return trimmed;
}

/**
 * Return YouTube thumbnail image URL.
 */
export function getYouTubeThumbnail(videoId, quality = 'mqdefault') {
  const id = extractYouTubeId(videoId);
  if (!id) return '';
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

/**
 * Estimate word count and reading time.
 */
export function estimateReadingTime(text) {
  if (!text || typeof text !== 'string') {
    return { words: 0, minutes: 0, text: 'Less than 1 min read' };
  }

  // Strip html tags and markdown image syntax for word count
  const clean = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*~`>-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    minutes,
    text: `${minutes} min read (${words} words)`,
  };
}

/**
 * Apply inline Markdown formatting (images, links, bold, italic, strikethrough, inline code).
 */
function applyInlineFormatting(str, { headingColor, codeBg, borderColor }) {
  let text = str;

  // Inline code: `code`
  text = text.replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 rounded text-xs font-mono ${codeBg}">$1</code>`);

  // Images: ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, rawUrl) => {
    const src = resolveMediaUrl(rawUrl);
    return `<figure class="my-4"><img src="${src}" alt="${escapeHtml(alt)}" loading="lazy" class="max-w-full h-auto rounded-xl border ${borderColor}"></figure>`;
  });

  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold-400 underline hover:text-gold-300 font-medium">$1</a>`);

  // Bold, Italic, Strikethrough
  text = text.replace(/\*\*([\s\S]+?)\*\*/g, `<strong class="font-bold ${headingColor}">$1</strong>`);
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  text = text.replace(/~~([\s\S]+?)~~/g, '<del class="line-through opacity-70">$1</del>');

  return text;
}

/**
 * Render Markdown & HTML content to clean, structured HTML.
 */
function renderRichTextRaw(content, { dark = false } = {}) {
  if (!content || typeof content !== 'string') return '';

  // Normalize CRLF (\r\n) and CR (\r) to LF (\n) so Windows line endings never break parsing
  let text = content.replace(/\r\n?/g, '\n').trim();
  if (!text) return '';

  const headingColor = dark ? 'text-white' : 'text-slate-900';
  const textColor = dark ? 'text-slate-200' : 'text-slate-700';
  const mutedColor = dark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = dark ? 'border-slate-800' : 'border-slate-200';
  const codeBg = dark ? 'bg-navy-950 text-gold-300' : 'bg-slate-100 text-slate-800';
  const quoteBg = dark ? 'bg-gold-500/10 border-gold-500/40 text-gold-200' : 'bg-amber-50 border-amber-400 text-amber-900';

  const inlineOpts = { headingColor, codeBg, borderColor };

  // Extract fenced code blocks first so their contents are not altered
  const codeBlocks = [];
  text = text.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gi, (_, lang, code) => {
    const idx = codeBlocks.length;
    codeBlocks.push(
      `<pre class="my-4 p-4 rounded-xl ${codeBg} font-mono text-xs overflow-x-auto border ${borderColor}"><code>${escapeHtml(code.trim())}</code></pre>`
    );
    return `\n@@CODE_BLOCK_${idx}@@\n`;
  });

  // If the input already contains block HTML tags, still apply inline Markdown (images, bold, italic, links)
  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|table|blockquote|figure)[\s>]/i.test(text);
  if (hasBlockHtml) {
    let html = applyInlineFormatting(text, inlineOpts);
    html = html.replace(/@@CODE_BLOCK_(\d+)@@/g, (_, idx) => codeBlocks[Number(idx)] || '');
    return html;
  }

  // Line-by-line block parser for headings, lists, blockquotes, horizontal rules, and paragraphs
  const lines = text.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i++;
      continue;
    }

    // Code block placeholder
    const codeMatch = line.match(/^@@CODE_BLOCK_(\d+)@@$/);
    if (codeMatch) {
      blocks.push(codeBlocks[Number(codeMatch[1])] || '');
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(?:---|\*\*\*|___)$/.test(line)) {
      blocks.push(`<hr class="my-6 ${borderColor}">`);
      i++;
      continue;
    }

    // Headings (#, ##, ###)
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      blocks.push(`<h3 class="text-lg font-serif font-bold ${headingColor} mt-6 mb-2">${applyInlineFormatting(h3[1], inlineOpts)}</h3>`);
      i++;
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      blocks.push(`<h2 class="text-xl font-serif font-bold ${headingColor} mt-8 mb-3 pb-1 border-b ${borderColor}">${applyInlineFormatting(h2[1], inlineOpts)}</h2>`);
      i++;
      continue;
    }
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) {
      blocks.push(`<h1 class="text-2xl font-serif font-bold ${headingColor} mt-8 mb-4 pb-2 border-b ${borderColor}">${applyInlineFormatting(h1[1], inlineOpts)}</h1>`);
      i++;
      continue;
    }

    // Callout / Blockquote (> [!NOTE], > [!TIP], > [!WARNING], > ...)
    if (line.startsWith('>')) {
      const noteMatch = line.match(/^>\s*\[!NOTE\]\s*(.*)$/i);
      const tipMatch = line.match(/^>\s*\[!TIP\]\s*(.*)$/i);
      const warnMatch = line.match(/^>\s*\[!WARNING\]\s*(.*)$/i);
      if (noteMatch) {
        blocks.push(`<div class="my-4 p-4 rounded-xl ${quoteBg} border-l-4 text-xs font-medium"><strong>Note:</strong> ${applyInlineFormatting(noteMatch[1], inlineOpts)}</div>`);
      } else if (tipMatch) {
        blocks.push(`<div class="my-4 p-4 rounded-xl bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-200 text-xs font-medium"><strong>Tip:</strong> ${applyInlineFormatting(tipMatch[1], inlineOpts)}</div>`);
      } else if (warnMatch) {
        blocks.push(`<div class="my-4 p-4 rounded-xl bg-red-500/10 border-l-4 border-red-500 text-red-200 text-xs font-medium"><strong>Warning:</strong> ${applyInlineFormatting(warnMatch[1], inlineOpts)}</div>`);
      } else {
        const quoteText = line.replace(/^>\s*/, '');
        blocks.push(`<blockquote class="my-3 pl-4 border-l-2 border-gold-500 italic ${mutedColor}">${applyInlineFormatting(quoteText, inlineOpts)}</blockquote>`);
      }
      i++;
      continue;
    }

    // Unordered list (- item or * item)
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, '');
        items.push(`<li class="my-1 ${textColor}">${applyInlineFormatting(itemText, inlineOpts)}</li>`);
        i++;
      }
      blocks.push(`<ul class="list-disc pl-6 my-3 space-y-1 ${textColor}">${items.join('')}</ul>`);
      continue;
    }

    // Ordered list (1. item)
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push(`<li class="my-1 ${textColor}">${applyInlineFormatting(itemText, inlineOpts)}</li>`);
        i++;
      }
      blocks.push(`<ol class="list-decimal pl-6 my-3 space-y-1 ${textColor}">${items.join('')}</ol>`);
      continue;
    }

    // Standalone image line ![alt](url)
    if (/^!\[([^\]]*)\]\(([^)\s]+)\)$/.test(line)) {
      blocks.push(applyInlineFormatting(line, inlineOpts));
      i++;
      continue;
    }

    // Regular paragraph (collect consecutive non-special lines)
    const paraLines = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !/^(#{1,3}\s+|[-*]\s+|\d+\.\s+|>\s*|---|\*\*\*|___|@@CODE_BLOCK_\d+@@$)/.test(lines[i].trim())
    ) {
      paraLines.push(applyInlineFormatting(lines[i].trim(), inlineOpts));
      i++;
    }
    if (paraLines.length) {
      blocks.push(`<p class="${textColor} leading-relaxed my-3">${paraLines.join('<br>')}</p>`);
    }
  }

  return blocks.join('\n');
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const DROP_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'button', 'textarea', 'select', 'svg', 'math', 'base'];

/**
 * Defence-in-depth sanitizer for HTML that is rendered with v-html.
 * The API already sanitizes rich text on save; this protects against legacy / tampered content.
 */
export function sanitizeHtml(html) {
  if (!html || typeof html !== 'string') return '';
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, '');

  const doc = new DOMParser().parseFromString(`<div id="sanitize-root">${html}</div>`, 'text/html');
  const root = doc.getElementById('sanitize-root');
  if (!root) return '';

  root.querySelectorAll(DROP_TAGS.join(',')).forEach((el) => el.remove());

  root.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.replace(/[\u0000-\u0020\u007f]+/g, '').toLowerCase();
      const isUrlAttr = name === 'href' || name === 'src';
      if (name.startsWith('on') || name === 'style' || name === 'srcdoc') {
        el.removeAttribute(attr.name);
      } else if (isUrlAttr && /^(javascript|data|vbscript):/.test(value)) {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === 'IMG' && el.getAttribute('src')) {
      el.setAttribute('src', resolveMediaUrl(el.getAttribute('src')));
    }
    if (el.tagName === 'A' && el.getAttribute('href')) {
      el.setAttribute('rel', 'noopener noreferrer');
      el.setAttribute('target', '_blank');
    }
  });

  return root.innerHTML;
}

/**
 * Render Markdown & HTML content to clean, sanitized HTML safe for v-html.
 */
export function renderRichText(content, options = {}) {
  return sanitizeHtml(renderRichTextRaw(content, options));
}
