import crypto from "node:crypto";
// Builds src/ into the files GitHub Pages serves from the repo root:
// index.html, assets/site.js, assets/theme.css, assets/fonts/*
import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import fs from "node:fs";

fs.mkdirSync("assets/fonts", { recursive: true });
fs.copyFileSync("node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2", "assets/fonts/fraunces.woff2");
for (const w of [500, 600, 700]) fs.copyFileSync(`node_modules/@fontsource/quicksand/files/quicksand-latin-${w}-normal.woff2`, `assets/fonts/quicksand-${w}.woff2`);
fs.copyFileSync("src/theme.css", "assets/theme.css");
const ssrPlugin = () => sveltePlugin({ compilerOptions: { generate: "server", css: "external" } });
fs.mkdirSync(".build", { recursive: true });
await esbuild.build({
  entryPoints: ["src/ssr.ts"], outfile: ".build/ssr.mjs", bundle: true, format: "esm", platform: "node", target: "node20", logLevel: "warning",
  plugins: [ssrPlugin()], mainFields: ["svelte", "module", "main"], conditions: ["svelte"],
});
const { body } = await import(`./.build/ssr.mjs?${Date.now()}`);

await esbuild.build({
  entryPoints: ["src/main.ts"], outfile: "assets/site.js", bundle: true, format: "iife", target: "es2020", minify: true, logLevel: "info",
  plugins: [sveltePlugin({ compilerOptions: { css: "external" } })],
  mainFields: ["svelte", "browser", "module", "main"], conditions: ["svelte", "browser"],
});

// Pre-rendered HTML: the page paints immediately with real content, then site.js hydrates it.
// Version the asset URLs by content hash so a browser never pairs a new page with an old stylesheet or script.
const ver = f => crypto.createHash("md5").update(fs.readFileSync(f)).digest("hex").slice(0, 8);
let tpl = fs.readFileSync("src/index.html", "utf8");
for (const f of ["assets/theme.css", "assets/site.css", "assets/site.js"]) tpl = tpl.replace(`/${f}"`, `/${f}?v=${ver(f)}"`);
const home = tpl.replace('<div id="app"></div>', `<div id="app">${body}</div>`);
fs.writeFileSync("index.html", home);
// Real pages at clean URLs (/about/, /experience/, ...) so direct links and refreshes return 200, not a 404 redirect.
const pages = { about: "About", experience: "Experience", certifications: "Certifications", education: "Education", contact: "Contact" };
for (const [dir, name] of Object.entries(pages)) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/index.html`, home
    .replace("<title>Claire Knorr | Product Manager</title>", `<title>${name} | Claire Knorr</title>`)
    .replace('content="Claire Knorr | Product Manager"', `content="${name} | Claire Knorr"`));
}
