import { useEffect, useRef, useState } from "react";
import {
  Type, Image as ImageIcon, ArrowUp, ArrowDown, MoveLeft, MoveRight,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Heading,
  Bold, Italic, Trash2, Upload,
} from "lucide-react";
import type { BlockColumn, BlockRow, FontSize } from "../../../types/blog";
import { uploadMediaFile } from "../../../lib/storage";

const SIZE_CYCLE: FontSize[] = ["p", "lead", "h1", "h2", "h3", "quote"];
const uid = () => Math.random().toString(36).slice(2, 10);

const getStyle = (col: BlockColumn): string => {
  const sizeClass: Record<FontSize, string> = {
    p: "text-base",
    lead: "text-lg leading-relaxed",
    h1: "text-3xl font-light",
    h2: "text-2xl font-light",
    h3: "text-xl font-light",
    quote: "text-lg italic",
  };
  const fontClass = col.fontFamily === "serif" ? "font-serif" : "font-sans";
  const alignClass = `text-${col.align ?? "left"}`;
  return `${sizeClass[col.fontSize ?? "p"]} ${fontClass} ${alignClass}`;
};

interface Props {
  value: string; // JSON.stringify(BlockRow[])
  onChange: (json: string) => void;
}

export const BlockEditor = ({ value, onChange }: Props) => {
  const [rows, setRows] = useState<BlockRow[]>([]);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialMount = useRef(true);

  // Init once
  useEffect(() => {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setRows(parsed);
        return;
      }
      throw new Error("empty");
    } catch {
      setRows([
        {
          id: `row-${uid()}`,
          columns: [{ id: `col-${uid()}`, type: "text", value: "", align: "left", fontFamily: "serif", fontSize: "p" }],
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push changes up
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    onChangeRef.current(JSON.stringify(rows));
  }, [rows]);

  const addRow = () =>
    setRows([
      ...rows,
      {
        id: `row-${uid()}`,
        columns: [{ id: `col-${uid()}`, type: "text", value: "", align: "left", fontFamily: "serif", fontSize: "p" }],
      },
    ]);
  const deleteRow = (rowId: string) => setRows(rows.filter((r) => r.id !== rowId));
  const moveRow = (i: number, dir: "up" | "down") => {
    const next = [...rows];
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
  };
  const addColumn = (rowId: string, type: "text" | "image") =>
    setRows(rows.map((r) => r.id === rowId && r.columns.length < 3
      ? { ...r, columns: [...r.columns, type === "text"
          ? { id: `col-${uid()}`, type, value: "", align: "left", fontFamily: "serif", fontSize: "p" }
          : { id: `col-${uid()}`, type, value: "" }
        ] }
      : r));
  const deleteColumn = (rowId: string, colId: string) =>
    setRows(rows.map((r) => r.id === rowId ? { ...r, columns: r.columns.filter((c) => c.id !== colId) } : r));
  const moveColumn = (rowId: string, idx: number, dir: "left" | "right") =>
    setRows(rows.map((r) => {
      if (r.id !== rowId) return r;
      const next = [...r.columns];
      const j = dir === "left" ? idx - 1 : idx + 1;
      if (j < 0 || j >= next.length) return r;
      [next[idx], next[j]] = [next[j], next[idx]];
      return { ...r, columns: next };
    }));
  const updateCol = (rowId: string, colId: string, patch: Partial<BlockColumn>) =>
    setRows(rows.map((r) => r.id === rowId
      ? { ...r, columns: r.columns.map((c) => c.id === colId ? { ...c, ...patch } : c) }
      : r));
  const cycleSize = (rowId: string, colId: string, current: FontSize) => {
    const next = SIZE_CYCLE[(SIZE_CYCLE.indexOf(current) + 1) % SIZE_CYCLE.length];
    updateCol(rowId, colId, { fontSize: next });
  };
  const wrapSelection = (rowId: string, colId: string, wrap: string) => {
    const ta = textareaRefs.current[colId];
    if (!ta) return;
    const { selectionStart, selectionEnd, value: v } = ta;
    const sel = v.substring(selectionStart, selectionEnd);
    const next = `${v.substring(0, selectionStart)}${wrap}${sel}${wrap}${v.substring(selectionEnd)}`;
    updateCol(rowId, colId, { value: next });
  };

  return (
    <div className="space-y-3">
      {rows.map((row, ri) => (
        <div key={row.id} className="bg-white/40 dark:bg-black/20 border border-stone-200 dark:border-white/5 rounded-2xl p-4 relative group">
          <div className={`grid gap-4 ${row.columns.length === 3 ? "md:grid-cols-3" : row.columns.length === 2 ? "md:grid-cols-2" : "grid-cols-1"}`}>
            {row.columns.map((col, ci) => (
              <div key={col.id} className="relative group/col">
                {col.type === "text" ? (
                  <div>
                    <div className="flex items-center gap-1 mb-2 flex-wrap">
                      {(["left", "center", "right", "justify"] as const).map((a) => {
                        const Icon = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }[a];
                        return (
                          <button key={a} onClick={() => updateCol(row.id, col.id, { align: a })}
                            className={`p-1 rounded hover:text-rust ${col.align === a ? "text-rust" : "opacity-60"}`}>
                            <Icon size={13} />
                          </button>
                        );
                      })}
                      <span className="w-px h-3 bg-stone-300 mx-1" />
                      <button onClick={() => updateCol(row.id, col.id, { fontFamily: col.fontFamily === "serif" ? "sans" : "serif" })}
                        className="p-1 rounded hover:text-rust opacity-60" title="Famille">
                        <Type size={13} />
                      </button>
                      <button onClick={() => cycleSize(row.id, col.id, col.fontSize ?? "p")}
                        className="p-1 px-2 rounded hover:text-rust opacity-60 text-[10px] uppercase font-bold tracking-widest">
                        <Heading size={11} className="inline mr-1" />{col.fontSize ?? "p"}
                      </button>
                      <span className="w-px h-3 bg-stone-300 mx-1" />
                      <button onClick={() => wrapSelection(row.id, col.id, "**")}
                        className="p-1 rounded hover:text-rust opacity-60"><Bold size={13} /></button>
                      <button onClick={() => wrapSelection(row.id, col.id, "_")}
                        className="p-1 rounded hover:text-rust opacity-60"><Italic size={13} /></button>
                    </div>
                    <textarea
                      ref={(el) => { textareaRefs.current[col.id] = el; }}
                      placeholder="Écrivez ici…"
                      value={col.value}
                      onChange={(e) => updateCol(row.id, col.id, { value: e.target.value })}
                      className={`w-full min-h-[120px] bg-transparent focus:outline-none resize-y ${getStyle(col)}`}
                    />
                  </div>
                ) : (
                  <ImageBlock value={col.value} onChange={(url) => updateCol(row.id, col.id, { value: url })} />
                )}
                {row.columns.length > 1 && (
                  <div className="absolute top-1 right-1 flex gap-1 bg-white/80 dark:bg-black/60 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                    <button onClick={() => moveColumn(row.id, ci, "left")} className="p-1 hover:text-rust"><MoveLeft size={12} /></button>
                    <button onClick={() => moveColumn(row.id, ci, "right")} className="p-1 hover:text-rust"><MoveRight size={12} /></button>
                    <button onClick={() => deleteColumn(row.id, col.id)} className="p-1 hover:text-rust"><Trash2 size={12} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="absolute top-2 -right-9 hidden md:flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => moveRow(ri, "up")} className="p-1 bg-white dark:bg-stone-800 rounded-full hover:text-rust shadow-sm"><ArrowUp size={12} /></button>
            <button onClick={() => moveRow(ri, "down")} className="p-1 bg-white dark:bg-stone-800 rounded-full hover:text-rust shadow-sm"><ArrowDown size={12} /></button>
          </div>

          <div className="flex items-center gap-3 pt-3 mt-3 border-t border-stone-200 dark:border-white/10 text-[10px] font-sans uppercase tracking-widest opacity-60">
            <button onClick={() => addColumn(row.id, "text")} disabled={row.columns.length >= 3} className="flex items-center gap-1 hover:opacity-100 hover:text-rust disabled:opacity-30">
              <Type size={11} /> Texte
            </button>
            <button onClick={() => addColumn(row.id, "image")} disabled={row.columns.length >= 3} className="flex items-center gap-1 hover:opacity-100 hover:text-rust disabled:opacity-30">
              <ImageIcon size={11} /> Image
            </button>
            <button onClick={() => deleteRow(row.id)} className="ml-auto flex items-center gap-1 hover:text-rust">
              <Trash2 size={11} /> Supprimer ligne
            </button>
          </div>
        </div>
      ))}

      <button onClick={addRow} className="w-full bg-stone-100 dark:bg-white/5 border border-dashed border-stone-300 dark:border-white/10 rounded-xl py-3 text-sm font-sans uppercase tracking-widest opacity-60 hover:opacity-100 hover:border-rust transition-colors">
        + Ajouter une ligne
      </button>
    </div>
  );
};

const ImageBlock = ({ value, onChange }: { value: string; onChange: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 10 * 1024 * 1024) {
      if (file) alert("Image trop volumineuse (max 10 MB)");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadMediaFile(file, "posts");
      onChange(url);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="relative">
      {value ? (
        <img src={value} alt="" className="w-full rounded-xl object-cover max-h-96" />
      ) : (
        <div className="aspect-[4/3] bg-stone-200 dark:bg-stone-800 rounded-xl flex items-center justify-center">
          <ImageIcon size={32} className="opacity-30" />
        </div>
      )}
      <label className="absolute bottom-3 right-3 inline-flex items-center gap-2 bg-black/60 text-white px-3 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-bold cursor-pointer hover:bg-rust transition-colors">
        <Upload size={11} /> {uploading ? "…" : value ? "Remplacer" : "Téléverser"}
        <input type="file" accept="image/*" onChange={onFile} className="hidden" disabled={uploading} />
      </label>
    </div>
  );
};
