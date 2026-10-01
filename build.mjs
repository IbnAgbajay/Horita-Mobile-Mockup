// Builds index.html (the GitHub Pages version of the mock-up) from the two
// screens in src/. Run: node build.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));

// Logos uploaded to the design canvas, and their copies in assets/.
const BLOBS = {
  '372e3e6128c6a63097fecbbf29dc31b0': 'assets/pssdc-logo.png',
  'f662e8542469c77d688a51856027882b': 'assets/trak-logo.png',
  '81b2e47755bdeecaad8ac741af410d67': 'assets/ekolearn-logo.png',
};

function load(file) {
  const src = fs.readFileSync(path.join(dir, 'src', file), 'utf8')
    .replace(/\/_blob\/([0-9a-f]{32})/g, (m, id) => BLOBS[id] ?? m);
  const markup = src.match(/<x-dc>([\s\S]*?)<\/x-dc>/)?.[1].replace(/<helmet>[\s\S]*?<\/helmet>/, '');
  const script = src.match(/<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/)?.[1];
  if (!markup || !script) throw new Error(`${file}: screen or script not found`);
  if (script.includes('</script')) throw new Error(`${file}: script contains </script>`);
  const missing = src.match(/\/_blob\/[0-9a-f]{32}/);
  if (missing) throw new Error(`${file}: no local copy for ${missing[0]}`);
  return { markup, script };
}

const phone = load('Phone.dc.html');
const computer = load('Computer.dc.html');
const page = fs.readFileSync(path.join(dir, 'page.html'), 'utf8')
  .replace('<!--PHONE_MARKUP-->', () => phone.markup)
  .replace('<!--COMPUTER_MARKUP-->', () => computer.markup)
  .replace('<!--PHONE_SCRIPT-->', () => phone.script)
  .replace('<!--COMPUTER_SCRIPT-->', () => computer.script);

fs.writeFileSync(path.join(dir, 'index.html'), page);
console.log(`index.html written (${Math.round(page.length / 1024)} KB)`);
