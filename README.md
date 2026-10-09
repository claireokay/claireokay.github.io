# claireokay.github.io

Claire Knorr's personal site. Source is in `src/` (Svelte 5, TypeScript, GSAP).

`npm install && npm run build` pre-renders the page and writes the files GitHub Pages serves
(`index.html`, the section pages, and `assets/`). The page paints from that pre-rendered HTML,
then `assets/site.js` hydrates it.

Every number on the site lives in `src/metrics.ts`. `npm run check` fails until they are all filled in,
no `TODO(claire)` copy markers remain, and `resume.pdf` is in the repo root; run it before merging to `main`.

Brand icons: Font Awesome Free (CC BY 4.0), https://fontawesome.com/license/free
