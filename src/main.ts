import { hydrate } from "svelte";
import App from "./App.svelte";
// The page ships pre-rendered (see build.mjs); this attaches the behavior to that HTML.
hydrate(App, { target: document.getElementById("app")! });
