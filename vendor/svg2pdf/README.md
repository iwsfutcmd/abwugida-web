# svg2pdf (vendored)

`index.mjs` is a single self-contained ESM bundle of:

- [jsPDF](https://github.com/parallax/jsPDF) `2.5.2`
- [svg2pdf.js](https://github.com/yWorks/svg2pdf.js) `2.2.4`

Both are bundled into one file on purpose: svg2pdf.js works by augmenting the
jsPDF prototype with a `.svg()` method (a side-effect import), so jsPDF and
svg2pdf.js must share the *same* jsPDF instance. The bundle re-exports `jsPDF`,
which already has `.svg()` attached.

## Rebuilding

```sh
mkdir build && cd build && npm init -y
npm install jspdf@2.5.2 svg2pdf.js@2.2.4 esbuild
cat > entry.mjs <<'EOF'
import { jsPDF } from "jspdf";
import "svg2pdf.js";
export { jsPDF };
EOF
./node_modules/.bin/esbuild entry.mjs --bundle --format=esm \
  --platform=browser --target=es2020 --legal-comments=none --minify \
  --outfile=index.mjs
```

## Usage

```js
const { jsPDF } = await import("./vendor/svg2pdf/index.mjs");
const doc = new jsPDF({ unit: "pt", format: [w, h] });
await doc.svg(svgElement, { width: w, height: h });
const blob = doc.output("blob");
```
