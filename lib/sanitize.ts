import DOMPurify from "isomorphic-dompurify";

const SANITIZE_CONFIG = {
    ALLOWED_TAGS: [
        "a", "b", "blockquote", "br", "code", "del", "div", "em", "h1", "h2", "h3",
        "h4", "h5", "h6", "hr", "i", "img", "li", "mark", "ol", "p", "pre", "s",
        "span", "strong", "sub", "sup", "table", "tbody", "td", "th", "thead", "tr", "u", "ul"
    ],
    ALLOWED_ATTR: [
        "href", "target", "rel", "data-color", "class", "src", "alt", "title", "width", "height"
    ],
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "style"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "javascript:"],
};

/**
 * Sanitizes rich-text HTML string, stripping XSS vectors (scripts, event handlers)
 * while preserving safe formatting, custom highlights, marks, and tables.
 */
export function sanitizeHtml(html: string): string {
    if (!html || typeof html !== "string") {
        return "";
    }
    return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}
