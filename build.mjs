// Builds src/ into the files GitHub Pages serves from the repo root:
// index.html, assets/site.js, assets/theme.css, assets/fonts/*
import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import fs from "node:fs";

fs.mkdirSync("assets/fonts", { recursive: true });
fs.copyFileSync("node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2", "assets/fonts/fraunces.woff2");
for (const w of [500, 600, 700]) fs.copyFileSync(`node_modules/@fontsource/quicksand/files/quicksand-latin-${w}-normal.woff2`, `assets/fonts/quicksand-${w}.woff2`);
fs.copyFileSync("src/theme.css", "assets/theme.css");
const home = fs.readFileSync("src/index.html", "utf8");
fs.writeFileSync("index.html", home);
// Real pages at clean URLs (/about/, /experience/, ...) so direct links and refreshes return 200, not a 404 redirect.
const pages = { about: "About", experience: "Experience", certifications: "Certifications", education: "Education", contact: "Contact" };
for (const [dir, name] of Object.entries(pages)) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(`${dir}/index.html`, home
    .replace("<title>Claire Knorr | Product Manager</title>", `<title>${name} | Claire Knorr</title>`)
    .replace('content="Claire Knorr | Product Manager"', `content="${name} | Claire Knorr"`));
}

await esbuild.build({
  entryPoints: ["src/main.ts"], outfile: "assets/site.js", bundle: true, format: "iife", target: "es2020", minify: true, logLevel: "info",
  plugins: [sveltePlugin({ compilerOptions: { css: "injected" } })],
  mainFields: ["svelte", "browser", "module", "main"], conditions: ["svelte", "browser"],
});
