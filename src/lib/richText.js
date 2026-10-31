/**
 * Utility helpers for course learning materials:
 * - Rich text & Markdown rendering
 * - YouTube Video ID extraction
 * - Reading time estimation
 */

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

  // Strip html tags for word count
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const words = clean ? clean.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    minutes,
    text: `${minutes} min read (${words} words)`,
  };
}

/**
 * Render Markdown & HTML content to clean, structured HTML.
 */
export function renderRichText(content, { dark = false } = {}) {
  if (!content || typeof content !== 'string') return '';

  let text = content.trim();

  // Check if content is already rich HTML (has common HTML block tags)
  const hasBlockHtml = /<(p|div|h[1-6]|ul|ol|table|blockquote)[\s>]/i.test(text);

  if (hasBlockHtml) {
    // Return HTML as is, ensuring safe styling attributes
    return text;
  }

  const headingColor = dark ? 'text-white' : 'text-slate-900';
  const textColor = dark ? 'text-slate-300' : 'text-slate-700';
  const mutedColor = dark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = dark ? 'border-slate-800' : 'border-slate-200';
  const codeBg = dark ? 'bg-navy-950 text-gold-300' : 'bg-slate-100 text-slate-800';
  const quoteBg = dark ? 'bg-gold-500/10 border-gold-500/40 text-gold-200' : 'bg-amber-50 border-amber-400 text-amber-900';

  // Code blocks: ```language ... ```
  text = text.replace(/```([a-z0-9_-]*)\n([\s\S]*?)```/gim, (match, lang, code) => {
    return `<pre class="my-4 p-4 rounded-xl ${codeBg} font-mono text-xs overflow-x-auto border ${borderColor}"><code>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code: `code`
  text = text.replace(/`([^`]+)`/gim, `<code class="px-1.5 py-0.5 rounded text-xs font-mono ${codeBg}">$1</code>`);

  // Headings
  text = text.replace(/^### (.*$)/gim, `<h3 class="text-lg font-serif font-bold ${headingColor} mt-6 mb-2">$1</h3>`);
  text = text.replace(/^## (.*$)/gim, `<h2 class="text-xl font-serif font-bold ${headingColor} mt-8 mb-3 pb-1 border-b ${borderColor}">$1</h2>`);
  text = text.replace(/^# (.*$)/gim, `<h1 class="text-2xl font-serif font-bold ${headingColor} mt-10 mb-4 pb-2 border-b ${borderColor}">$1</h1>`);

  // Horizontal rules
  text = text.replace(/^(?:---|\*\*\*|___)\s*$/gim, `<hr class="my-6 ${borderColor}">`);

  // Blockquotes / Callout notes
  text = text.replace(/^>\s*\[!NOTE\]\s*(.*$)/gim, `<div class="my-4 p-4 rounded-xl ${quoteBg} border-l-4 text-xs font-medium"><strong>Note:</strong> $1</div>`);
  text = text.replace(/^>\s*\[!TIP\]\s*(.*$)/gim, `<div class="my-4 p-4 rounded-xl bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-200 text-xs font-medium"><strong>Tip:</strong> $1</div>`);
  text = text.replace(/^>\s*\[!WARNING\]\s*(.*$)/gim, `<div class="my-4 p-4 rounded-xl bg-red-500/10 border-l-4 border-red-500 text-red-200 text-xs font-medium"><strong>Warning:</strong> $1</div>`);
  text = text.replace(/^>\s*(.*$)/gim, `<blockquote class="my-3 pl-4 border-l-2 border-gold-500 italic ${mutedColor}">$1</blockquote>`);

  // Formatting: Bold, Italic, Strikethrough
  text = text.replace(/\*\*(.*?)\*\*/gim, `<strong class="font-bold ${headingColor}">$1</strong>`);
  text = text.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  text = text.replace(/~~(.*?)~~/gim, '<del class="line-through opacity-70">$1</del>');

  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, `<a href="$2" target="_blank" rel="noopener noreferrer" class="text-gold-400 underline hover:text-gold-300 font-medium">$1</a>`);

  // Unordered list items: - or *
  text = text.replace(/^[\-\*]\s+(.*$)/gim, `<li class="ml-5 list-disc ${textColor} my-1">$1</li>`);

  // Ordered list items: 1.
  text = text.replace(/^\d+\.\s+(.*$)/gim, `<li class="ml-5 list-decimal ${textColor} my-1">$1</li>`);

  // Wrap loose lines in paragraph tags
  const paragraphs = text.split(/\n{2,}/).map(para => {
    const trimmed = para.trim();
    if (!trimmed) return '';
    if (/^<(h[1-6]|pre|blockquote|div|hr|li|ul|ol)/i.test(trimmed)) {
      return trimmed;
    }
    // Convert single newlines inside paragraph to <br>
    const withBreaks = trimmed.replace(/\n/g, '<br>');
    return `<p class="${textColor} leading-relaxed my-3">${withBreaks}</p>`;
  });

  return paragraphs.filter(Boolean).join('\n');
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

