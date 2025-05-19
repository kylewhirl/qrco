import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url';
// Define __dirname and __filename for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Turn strings like "c++" or "till-io" into PascalCase ("CPlusPlus", "TillIo")
function pascalCase(str) {
  return str
    .replace(/(^\w|[_\s]\w)/g, m => m.trim().replace(/[_\s]/, '').toUpperCase())
    .replace(/[.\-&+]/g, '')  // remove any remaining punctuation
}

// 1) Load your JSON file
const raw = fs.readFileSync(
  path.join(__dirname, 'simple-icons.json'),
  'utf8'
)
const brands = JSON.parse(raw)

// 2) Map into your desired shape
const iconsData = brands.map(brand => {
  // Determine a base identifier: prefer slug, otherwise title
  let base = brand.slug ?? brand.title

  // Remove diacritics (e.g., é → e, ü → u)
  base = base.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  // Normalizations:
  base = base
    .replace(/\./g, 'dot')   // dot → “dot”
    .replace(/&/g, 'and')    // & → “and”
    .replace(/\+/g, 'plus')  // + → “plus”
    .replace(/-/g, '')       // remove dashes
    .replace(/\s+/g, '')     // remove spaces
    .replace(/\/+/g, '')     // remove slashes
    .toLowerCase()

  // Collect tags
  const akaTags = Array.isArray(brand.aliases?.aka) ? brand.aliases.aka : []
  const dupTags = Array.isArray(brand.aliases?.dup)
    ? brand.aliases.dup.map(d => d.title)
    : []
  const titleTag = brand.title

  return {
    // Prefix “Si” + PascalCase of normalized base, then capitalize “dot” after digits
    name: ('Si' + pascalCase(base)).replace(/(\d)([a-z])/g, (_, d, c) => d + c.toUpperCase()),
    categories: ['brands'],
    tags: [titleTag, ...akaTags, ...dupTags],
    hex: '#' + brand.hex
  }
})

// 3) Emit a TypeScript file
const out = `// AUTO-GENERATED — do not edit by hand
export interface IconEntry {
  name: string
  categories: string[]
  tags: string[]
  hex?: string
}

export const iconsData: IconEntry[] = ${JSON.stringify(iconsData, null, 2)};
`

fs.writeFileSync(
  path.join(__dirname, 'test-icons-data.ts'),
  out,
  'utf8'
)

console.log(`Wrote ${iconsData.length} icons to icons-data.ts`)