// Merge guard: `npm run check` fails until every number in src/metrics.ts is filled,
// no TODO(claire) copy marker is left in src/, and resume.pdf exists. Pages serves main as built, so run this before merging.
import esbuild from "esbuild";
import fs from "node:fs";

await esbuild.build({ entryPoints: ["src/metrics.ts"], outfile: ".build/metrics.mjs", bundle: true, format: "esm", platform: "node", logLevel: "warning" });
const { missing } = await import(`./.build/metrics.mjs?${Date.now()}`);
const todos = fs.readdirSync("src").flatMap(f => fs.readFileSync(`src/${f}`, "utf8").split("\n")
  .map((line, i) => ({ at: `src/${f}:${i + 1}`, line: line.trim() })).filter(l => l.line.includes("TODO(claire)")));
const problems = [
  ...missing.map(k => `metric not filled: ${k} (src/metrics.ts)`),
  ...todos.map(t => `copy TODO left: ${t.at}`),
  ...(fs.existsSync("resume.pdf") ? [] : ["resume.pdf is missing from the repo root"]),
];
if (problems.length) {
  console.error(`Not ready to merge (${problems.length}):\n  ` + problems.join("\n  "));
  process.exit(1);
}
console.log("Ready to merge: all metrics filled, no copy TODOs, resume.pdf present.");
