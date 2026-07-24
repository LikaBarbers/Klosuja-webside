const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content", "materials");

function fail(message) {
  console.error(`\nGabim në katalog: ${message}\n`);
  process.exit(1);
}

function readMaterials() {
  if (!fs.existsSync(contentDir)) {
    fail("Mungon dosja content/materials.");
  }

  const files = fs.readdirSync(contentDir)
    .filter((name) => name.endsWith(".json"))
    .sort();

  if (!files.length) {
    fail("Nuk u gjet asnjë material.");
  }

  return files.map((filename) => {
    const fullPath = path.join(contentDir, filename);
    let data;

    try {
      data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (error) {
      fail(`${filename} nuk është JSON i vlefshëm: ${error.message}`);
    }

    const id = path.basename(filename, ".json");
    const required = ["name", "category", "image", "sq", "en"];

    for (const field of required) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        fail(`${filename}: mungon fusha “${field}”.`);
      }
    }

    if (!["mermer", "granit"].includes(data.category)) {
      fail(`${filename}: kategoria duhet të jetë “mermer” ose “granit”.`);
    }

    return { id, ...data };
  });
}

function localizedMaterial(item, locale) {
  const text = item[locale] || {};
  const isSq = locale === "sq";

  return {
    id: item.id,
    active: item.active !== false,
    order: Number(item.order || 100),
    name: item.name,
    category: item.category,
    category_label:
      item.category === "mermer"
        ? (isSq ? "Mermer" : "Marble")
        : (isSq ? "Granit" : "Granite"),
    tag: text.tag || "",
    image: item.image,
    image_alt: text.image_alt || item.name,
    summary: text.summary || "",
    description: text.description || text.summary || "",
    details_label: isSq ? "Shiko detajet →" : "View details →",
    specs: Array.isArray(text.specs) ? text.specs : [],
  };
}

const materials = readMaterials()
  .sort((a, b) => Number(a.order || 100) - Number(b.order || 100) || a.name.localeCompare(b.name));

const outputs = {
  "materials-sq.json": { materials: materials.map((item) => localizedMaterial(item, "sq")) },
  "materials-en.json": { materials: materials.map((item) => localizedMaterial(item, "en")) },
};

for (const [filename, data] of Object.entries(outputs)) {
  fs.writeFileSync(
    path.join(root, filename),
    `${JSON.stringify(data, null, 2)}\n`,
    "utf8"
  );
  console.log(`U krijua ${filename} me ${data.materials.length} materiale.`);
}
