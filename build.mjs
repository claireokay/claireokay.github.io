// Builds src/ into the files GitHub Pages serves from the repo root:
// index.html, assets/site.js, assets/theme.css, assets/fonts/*
import esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";
import fs from "node:fs";

fs.mkdirSync("assets/fonts", { recursive: true });
fs.copyFileSync("node_modules/@fontsource-variable/fraunces/files/fraunces-latin-full-normal.woff2", "assets/fonts/fraunces.woff2");
for (const w of [500, 600, 700]) fs.copyFileSync(`node_modules/@fontsource/quicksand/files/quicksand-latin-${w}-normal.woff2`, `assets/fonts/quicksand-${w}.woff2`);
fs.copyFileSync("src/theme.css", "assets/theme.css");
fs.copyFileSync("src/index.html", "index.html");

await esbuild.build({
  entryPoints: ["src/main.ts"], outfile: "assets/site.js", bundle: true, format: "iife", target: "es2020", minify: true, logLevel: "info",
  plugins: [sveltePlugin({ compilerOptions: { css: "injected" } })],
  mainFields: ["svelte", "browser", "module", "main"], conditions: ["svelte", "browser"],
});
