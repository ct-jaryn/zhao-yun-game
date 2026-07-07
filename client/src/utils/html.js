/**
 * 转义 HTML 特殊字符，防止 XSS。
 * 对无法确定来源的文本（配置数据、用户输入、网络返回）统一使用此函数。
 */
export function escapeHtml(text) {
  if (text == null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 安全的模板标签：对插值自动转义，允许传入已信任的 HTML 片段（需手动标记）。
 * 用法：html`Hello ${name}`
 */
export function html(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = values[i];
    if (value === undefined || value === null) return result + str;
    if (Array.isArray(value)) {
      return result + str + value.map(v => (v && v.__html ? v.__html : escapeHtml(v))).join('');
    }
    if (value && value.__html) return result + str + value.__html;
    return result + str + escapeHtml(value);
  }, '');
}

/**
 * 标记一段 HTML 为已信任（例如由代码生成的固定结构）。
 * 仅用于确定不会包含用户/配置输入的片段。
 */
export function raw(htmlString) {
  return { __html: String(htmlString) };
}
