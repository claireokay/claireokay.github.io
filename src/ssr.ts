import { render } from "svelte/server";
import App from "./App.svelte";
// Used by build.mjs to pre-render the page into index.html.
export const body: string = render(App).body;
