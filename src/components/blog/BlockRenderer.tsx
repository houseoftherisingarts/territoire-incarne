import type { BlockColumn, BlockRow, FontSize } from "../../types/blog";

const SIZE_CLASS: Record<FontSize, string> = {
  p: "text-base leading-relaxed",
  lead: "text-xl leading-relaxed font-light",
  h1: "text-4xl md:text-5xl font-light leading-tight",
  h2: "text-3xl md:text-4xl font-light leading-tight",
  h3: "text-2xl md:text-3xl font-light leading-tight",
  quote: "text-xl italic leading-relaxed border-l-2 border-rust pl-6",
};

const parseRichText = (text: string): string => {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="text-rust">$1</strong>');
  html = html.replace(/_(.+?)_/g, "<em>$1</em>");
  html = html.replace(/\n/g, "<br />");
  return html;
};

const styleFor = (col: BlockColumn) => {
  const size = SIZE_CLASS[col.fontSize ?? "p"];
  const font = col.fontFamily === "sans" ? "font-sans" : "font-serif";
  const align = `text-${col.align ?? "left"}`;
  return `${size} ${font} ${align}`;
};

export const BlockRenderer = ({ content }: { content: string }) => {
  let rows: BlockRow[] = [];
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    // Plain text fallback
    return <p className="font-serif text-base leading-relaxed whitespace-pre-wrap">{content}</p>;
  }

  return (
    <>
      {rows.map((row) => (
        <div
          key={row.id}
          className={`grid gap-6 md:gap-10 mb-8 md:mb-12 ${
            row.columns.length === 3 ? "md:grid-cols-3" :
            row.columns.length === 2 ? "md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {row.columns.map((col) => (
            <div key={col.id} className="min-w-0">
              {col.type === "text" ? (
                <div
                  className={`text-stone-700 dark:text-stone-200 ${styleFor(col)}`}
                  dangerouslySetInnerHTML={{ __html: parseRichText(col.value) }}
                />
              ) : col.value ? (
                <img
                  src={col.value}
                  alt=""
                  className="w-full h-auto rounded-2xl shadow-lg"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
            </div>
          ))}
        </div>
      ))}
    </>
  );
};
