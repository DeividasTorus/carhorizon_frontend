import fs from "fs";
import path from "path";

const CATEGORY_ID = 2;
const OUT_DIR = path.join(process.cwd(), "src", "config", "cars");
const MODELS_DIR = path.join(OUT_DIR, "models");
const MAKES_PATH = path.join(OUT_DIR, "makes.json");
const INDEX_PATH = path.join(OUT_DIR, "modelsIndex.js");

const CONCURRENCY = 5;
const DELAY_MS = 220;
const RETRIES = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function dcUrl(params) {
  const base = "https://en.autoplius.lt/importhandler";
  const qs = new URLSearchParams(params);
  return `${base}?${qs.toString()}`;
}

async function fetchAuto(url, attempt = 1) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        Accept: "application/json, text/xml, application/xml, text/plain, */*",
        "Accept-Encoding": "identity",
        "Accept-Language": "lt,en;q=0.9",
      },
      redirect: "follow",
    });

    const contentType = res.headers.get("content-type") || "";
    const finalUrl = res.url;

    let text = await res.text();
    text = text.replace(/^\uFEFF/, "").replace(/^ï»¿/i, "");

    const trimmed = (text || "").trim();

    const meta = {
      status: res.status,
      ok: res.ok,
      contentType,
      finalUrl,
      length: trimmed.length,
      first80: JSON.stringify(trimmed.slice(0, 80)),
    };

    if (!res.ok) throw new Error(`HTTP ${res.status} :: ${JSON.stringify(meta)}`);

    if (!trimmed) return { type: "empty", data: "", raw: "", meta };

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      return { type: "json", data: JSON.parse(trimmed), raw: trimmed, meta };
    }

    if (trimmed.startsWith("<") || trimmed.startsWith("<?xml")) {
      return { type: "xml", data: trimmed, raw: trimmed, meta };
    }

    return { type: "text", data: trimmed, raw: trimmed, meta };
  } catch (e) {
    if (attempt < RETRIES) {
      await sleep(600 * attempt);
      return fetchAuto(url, attempt + 1);
    }
    throw new Error(`Fetch failed: ${url} (${e.message})`);
  }
}

async function getDropdowns({ makeId } = {}) {
  await sleep(DELAY_MS);
  const url = dcUrl({
    datacollector: 1,
    category_id: CATEGORY_ID,
    ...(makeId ? { make_id: makeId } : {}),
  });
  return await fetchAuto(url);
}

/* ========= XML parsing for <tag><item><id>..</id><title>..</title></item></tag> ========= */

function decodeXmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTagBlockXml(xml, tagName) {
  const re = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const m = xml.match(re);
  return m ? m[1] : null;
}

function parseItemsFromTagXml(xml, tagName) {
  const block = extractTagBlockXml(xml, tagName);
  if (!block) return [];

  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;

  let im;
  while ((im = itemRe.exec(block)) !== null) {
    const itemXml = im[1];
    const idMatch = itemXml.match(/<id>([\s\S]*?)<\/id>/i);
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);

    const id = idMatch ? idMatch[1].trim() : null;
    const nameRaw = titleMatch ? titleMatch[1].trim() : "";
    const name = decodeXmlEntities(nameRaw);

    if (id && name) items.push({ id, name });
  }

  return items;
}

// Randa visus tagus, kurie turi <item><id>..</id><title>..</title></item>
function findItemTags(xml) {
  const tags = new Set();
  // paimame tik paprastus top-level tag pavadinimus (warranty_type_id, make_id, model_id ir pan.)
  const re = /<([a-zA-Z0-9_]+)>\s*<item>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const tag = m[1];
    if (tag && tag.toLowerCase() !== "item") tags.add(tag);
  }
  return Array.from(tags);
}

function getMakesFromXml(xml) {
  return parseItemsFromTagXml(xml, "make_id");
}

// Bandome automatiškai aptikti, kuriame tage yra modeliai
function detectModelsTag(xml) {
  const candidates = findItemTags(xml).map((t) => t.toLowerCase());

  // prioritetas tipiniams pavadinimams
  const priority = ["model_id", "model", "models", "model_name", "models_id"];

  for (const p of priority) {
    const idx = candidates.indexOf(p);
    if (idx !== -1) return findItemTags(xml)[idx];
  }

  // jei nėra – bandom rasti bet ką, kas turi "model" tekste
  const rawTags = findItemTags(xml);
  const modelLike = rawTags.find((t) => t.toLowerCase().includes("model"));
  if (modelLike) return modelLike;

  // jei ir tada nėra – grąžinam null
  return null;
}

function bucketKeyForMake(makeName) {
  const c = (makeName || "").trim().charAt(0).toUpperCase();
  if (!c) return "0_9";
  if (c >= "A" && c <= "Z") return c;
  if (c >= "0" && c <= "9") return "0_9";
  return "0_9";
}

async function runPool(items, worker, concurrency) {
  const queue = [...items];
  const workers = new Array(concurrency).fill(null).map(async () => {
    while (queue.length) {
      const item = queue.shift();
      await worker(item);
    }
  });
  await Promise.all(workers);
}

function ensureDirs() {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

function writeJson(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
}

function writeIndexJs(buckets) {
  const lines = [];
  lines.push(`export const MODELS_BY_BUCKET = {`);
  for (const b of buckets) {
    lines.push(`  "${b}": require("./models/models_${b}.json"),`);
  }
  lines.push(`};\n`);
  fs.writeFileSync(INDEX_PATH, lines.join("\n"), "utf8");
}

async function main() {
  ensureDirs();

  console.log("Fetching makes...");
  const base = await getDropdowns();

  console.log("BASE META:", base.meta);

  if (base.type !== "xml") {
    console.error("❌ Tikėjausi XML, bet gavau:", base.type);
    console.error("META:", base.meta);
    console.error("RAW first 500:\n", (base.raw || "").slice(0, 500));
    process.exit(1);
  }

  const makes = getMakesFromXml(base.data);
  if (!makes.length) {
    console.error("❌ Neradau <make_id> XML'e.");
    console.error("RAW first 1200:\n", (base.raw || "").slice(0, 1200));
    process.exit(1);
  }

  const makeNames = makes.map((m) => m.name).sort((a, b) => a.localeCompare(b));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeJson(MAKES_PATH, makeNames);
  console.log(`✅ Saved makes: ${MAKES_PATH} (${makeNames.length})`);

  // ✅ Aptinkam modelių tagą pagal pirmą markę, kad nereiktų spėlioti
  const sampleMake = makes[0];
  console.log("Detecting models tag using sample make:", sampleMake.name, sampleMake.id);

  const sampleResp = await getDropdowns({ makeId: sampleMake.id });
  if (sampleResp.type !== "xml") {
    console.error("❌ Sample make models response not XML:", sampleResp.type, sampleResp.meta);
    process.exit(1);
  }

  const detectedModelsTag = detectModelsTag(sampleResp.data);
  if (!detectedModelsTag) {
    console.error("❌ Nepavyko automatiškai aptikti modelių tag'o.");
    console.error("Galimi tag'ai su <item>:", findItemTags(sampleResp.data));
    console.error("RAW first 1500:\n", (sampleResp.raw || "").slice(0, 1500));
    process.exit(1);
  }

  console.log("✅ Detected models tag:", detectedModelsTag);

  const bucketMap = new Map();
  const allBuckets = new Set();

  let done = 0;

  await runPool(
    makes,
    async (mk) => {
      const resp = await getDropdowns({ makeId: mk.id });

      if (resp.type !== "xml") {
        console.log(`⚠️ Not XML for ${mk.name}:`, resp.type, resp.meta);
        return;
      }

      const modelsRaw = parseItemsFromTagXml(resp.data, detectedModelsTag).map((x) => x.name);

      const uniq = Array.from(new Set(modelsRaw))
        .map((s) => String(s).trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      if (uniq.length) {
        const bucket = bucketKeyForMake(mk.name);
        allBuckets.add(bucket);
        if (!bucketMap.has(bucket)) bucketMap.set(bucket, {});
        bucketMap.get(bucket)[mk.name] = uniq;
      }

      done++;
      if (done % 25 === 0) console.log(`Processed ${done}/${makes.length} makes...`);
    },
    CONCURRENCY
  );

  const bucketsSorted = Array.from(allBuckets).sort((a, b) => {
    if (a === "0_9") return -1;
    if (b === "0_9") return 1;
    return a.localeCompare(b);
  });

  if (!bucketsSorted.length) {
    console.error("❌ Nesugeneruota nei viena models bucket byla (modelių nerasta).");
    console.error("Patikrink, ar detected tag tikrai turi modelius. Detected:", detectedModelsTag);
    process.exit(1);
  }

  for (const bucket of bucketsSorted) {
    const data = bucketMap.get(bucket) || {};
    const sortedObj = {};
    Object.keys(data)
      .sort((a, b) => a.localeCompare(b))
      .forEach((k) => (sortedObj[k] = data[k]));

    const filePath = path.join(MODELS_DIR, `models_${bucket}.json`);
    writeJson(filePath, sortedObj);
    console.log(`✅ Saved: models_${bucket}.json`);
  }

  writeIndexJs(bucketsSorted);
  console.log(`✅ Saved: ${INDEX_PATH}`);
  console.log("DONE ✅");
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});


