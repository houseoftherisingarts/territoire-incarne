// One-time image optimization for Territoire Incarné.
// Downloads each PNG from GCS, generates WebP variants at 360/960/1920 widths,
// and writes them to scripts/output/ ready to upload to gs://salondesinconnus/territoireincarne/optimized/

import sharp from "sharp";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const BASE = "https://storage.googleapis.com/salondesinconnus/territoireincarne";
const OUTPUT = new URL("./output/", import.meta.url).pathname;

// Map of source filename → output base name (URL-safe, no spaces)
const IMAGES = [
  { src: "elise%20main.png",                              name: "elise-main"  },
  { src: "Elise%20field.png",                             name: "elise-field" },
  { src: "Gemini_Generated_Image_7xqaqz7xqaqz7xqa.png",   name: "global-bg"   },
  { src: "Gemini_Generated_Image_3kge2o3kge2o3kge.png",   name: "therapie"    },
  { src: "Gemini_Generated_Image_jm4kgyjm4kgyjm4k.png",   name: "boutique"    },
  { src: "Gemini_Generated_Image_1lmib01lmib01lmi.png",   name: "writings"    },
  { src: "transparent%20rock.png",                        name: "zen-stone"   },
];

const WIDTHS = [360, 960, 1920];
const QUALITY = 80;

await mkdir(OUTPUT, { recursive: true });

let totalIn = 0;
let totalOut = 0;

for (const img of IMAGES) {
  const url = `${BASE}/${img.src}`;
  process.stdout.write(`\n→ ${img.name} … `);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`FAILED (${res.status})`);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  totalIn += buf.length;
  const meta = await sharp(buf).metadata();
  console.log(`${meta.width}×${meta.height}, ${(buf.length / 1024 / 1024).toFixed(1)} MB`);

  // Keep original as a high-quality WebP fallback (full resolution)
  const fullOut = join(OUTPUT, `${img.name}-full.webp`);
  await sharp(buf).webp({ quality: QUALITY }).toFile(fullOut);
  const fullStat = await stat(fullOut);
  totalOut += fullStat.size;
  console.log(`   full   → ${(fullStat.size / 1024).toFixed(0).padStart(5)} KB`);

  for (const w of WIDTHS) {
    if (w >= (meta.width ?? 0)) continue;
    const out = join(OUTPUT, `${img.name}-${w}.webp`);
    await sharp(buf)
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out);
    const s = await stat(out);
    totalOut += s.size;
    console.log(`   ${String(w).padStart(4)}w → ${(s.size / 1024).toFixed(0).padStart(5)} KB`);
  }
}

console.log("\n──────────────────────────────────────────────");
console.log(`  Source total: ${(totalIn / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Output total: ${(totalOut / 1024 / 1024).toFixed(1)} MB`);
console.log(`  Reduction:    ${((1 - totalOut / totalIn) * 100).toFixed(1)} %`);
console.log("──────────────────────────────────────────────");
console.log(`\nFiles ready in: ${OUTPUT}`);
console.log(`\nUpload with:`);
console.log(`  gsutil -m -h "Cache-Control:public,max-age=31536000,immutable" \\`);
console.log(`    cp scripts/output/*.webp \\`);
console.log(`    gs://salondesinconnus/territoireincarne/optimized/`);
