<script lang="ts">
  import { onMount, tick } from "svelte";
  import { gsap } from "gsap";
  // Brand icons: Font Awesome Free (CC BY 4.0), https://fontawesome.com/license/free
  import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
  const ICONS = { github: faGithub.icon, linkedin: faLinkedin.icon };

  type Role = { id: string; title: string; org: string; when: string; points: string[]; tags: string[] };
  const roles: Role[] = [
    { id: "panw", title: "Product Manager, Licensing and Activation", org: "Palo Alto Networks", when: "Aug 2025 to present",
      points: ["Built and scaled a 0-1 credit management platform across cybersecurity products, credit currencies, and offerings (subscriptions, SaaS activations, and bundles), unlocking new revenue streams for customers with highly reliable activation.",
               "Launched usage metering for credit products, positioning the credit platform as the activation orchestrator so every billable event is captured at the source and billing stays accurate.",
               "Shipped an LLM feature that summarizes activation failures and proactively opens support cases, resolving issues faster and reducing manual case creation.",
               "Led New Product Introduction and go-to-market for multiple launches, aligning cross-functional teams (Engineering, UX, Finance, Pricing, and more) to bring each to market quickly.",
               "Led a product-led growth trial flow designed to replace a lengthy approval process with instant activation, with automated trial value reports for Sales and GTM.",
               "Sharply cut activation-related support tickets by redesigning onboarding across products, asking admins for far fewer inputs.",
               "Conducted customer discovery interviews with network security admins, prioritizing pain points into net-new roadmap features by severity and support volume."],
      tags: ["0-1 platforms", "Generative AI", "Usage metering", "Product-led growth", "Roadmapping"] },
    { id: "wmt", title: "Product Manager Intern", org: "Walmart", when: "Summer 2024",
      points: ["Authored a PRD and presented findings to leadership, driving the shipment of new ML models and metadata inputs to measure inspiration-score effectiveness.",
               "Defined the production metrics for a homepage inspiration score measuring personalization content, adopted by Data Science.",
               "Validated the score against shopper click-through data in Tableau, Looker, and Excel.",
               "Built a content prioritization framework with Data Science, Business, and Merchandising to guide campaign and content decisions."],
      tags: ["PRDs", "Metrics definition", "Tableau", "Looker"] },
    { id: "amex", title: "Software Engineer Intern", org: "American Express", when: "Summer 2023 and Jan 2023",
      points: ["Led the migration of shell-script workflows to Python, creating a compliance automation adopted org-wide that saved hours of manual work every day.",
               "Built a React.js login authentication system for the Corporate Technology team, and drove sprint planning as technical lead on the compliance automation.",
               "In an earlier January 2023 sprint, redesigned the interface of an internal banking tool used by thousands of employees daily, delivering a full front-end overhaul in a single sprint using HTML, CSS, and JavaScript."],
      tags: ["Python", "React.js", "HTML/CSS", "JavaScript", "Compliance automation"] },
  ];
  const tools = ["Python", "React.js", "JavaScript", "SQL", "Tableau", "Looker", "Excel"];

  const lead = [
    { t: "Director", s: "Technica, UMD's hackathon for underrepresented genders" },
    { t: "Undergraduate Teaching Assistant", s: "CHSE205 (Disability Studies)" },
    { t: "Guided Study Sessions (GSS)", s: "INST326: Introduction to Object Oriented Programming" },
  ];
  const clubs = ["Alpha Lambda Delta Honor Society", "Omicron Delta Kappa Honor Society (ODK)", "Maryland Club Figure Skating"];
  type Cmd = { label: string; hint: string; action: () => void };


  // ---- Platform map: a left-to-right flow with fixed positions; CSS does the motion
  type Tone = "deep" | "lilac" | "blush" | "plum" | "wash";
  interface Story { id: string; label: string; title: string; text: string; r: number; tone: Tone }
  interface GNode extends Story { x: number; y: number }
  interface GLink { source: GNode; target: GNode; d: string }
  const STORIES: Story[] = [
    { id: "trial", label: "Trial request", title: "Product-led growth trial", r: 30, tone: "wash", text: "Instant activation replaces a lengthy approval, with automated trial value reports that tell Sales and GTM who to follow up with." },
    { id: "activation", label: "Activation", title: "Activation orchestrator", r: 34, tone: "lilac", text: "Subscriptions, SaaS activations, and bundles all activate through one flow, reliably." },
    { id: "platform", label: "Credit platform", title: "Credit management platform", r: 52, tone: "deep", text: "A 0-1 platform shared by cybersecurity products, credit currencies, and offerings." },
    { id: "ai", label: "LLM support", title: "LLM-assisted support", r: 34, tone: "plum", text: "A generative AI feature summarizes activation failures and opens support cases before customers ask. Issues get resolved faster, with less manual case creation." },
    { id: "metering", label: "Usage metering", title: "Usage metering", r: 36, tone: "blush", text: "Every billable event is captured at the source, so billing stays accurate." },
    { id: "onboarding", label: "Onboarding", title: "Onboarding redesign", r: 30, tone: "lilac", text: "Far fewer required inputs, and a sharp drop in activation-related support tickets." },
  ];

  // Flow: Trial request -> Activation -> (Credit platform, LLM support); Credit platform -> (Usage metering, Onboarding)
  const EDGES: [string, string, string?][] = [["trial","activation"],["activation","platform"],["activation","ai"],["platform","metering"],["platform","onboarding"],["activation","onboarding","curve"]];
  const FILL: Record<Tone, string> = { deep: "#7d55c7", lilac: "#c9b3f0", blush: "#ffb8d9", plum: "#2d1b4e", wash: "#f1e9fd" };
  const W = 640, H = 430;
  const POS: Record<string, [number, number]> = { trial: [72, 215], activation: [212, 215], platform: [380, 140], ai: [380, 330], metering: [566, 70], onboarding: [566, 215] };
  const gnodes: GNode[] = STORIES.map(s => ({ ...s, x: POS[s.id][0], y: POS[s.id][1] }));
  const byId = Object.fromEntries(gnodes.map(n => [n.id, n]));
  // Arrows run from circle edge to circle edge so the heads are visible.
  const glinks: GLink[] = EDGES.map(([a, b, kind]) => {
    const s = byId[a], t = byId[b];
    // Straight edges aim at the other circle; the curved one bows below the platform so it doesn't cross its label.
    const cx = kind === "curve" ? (s.x + t.x) / 2 : null, cy = kind === "curve" ? (s.y + t.y) / 2 + 50 : null;
    const unit = (fx: number, fy: number, tx: number, ty: number) => { const dx = tx - fx, dy = ty - fy, l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
    const [sx, sy] = unit(s.x, s.y, cx ?? t.x, cy ?? t.y), [ex, ey] = unit(cx ?? s.x, cy ?? s.y, t.x, t.y);
    const x1 = s.x + sx * (s.r + 4), y1 = s.y + sy * (s.r + 4), x2 = t.x - ex * (t.r + 10), y2 = t.y - ey * (t.r + 10);
    return { source: s, target: t, d: cx === null ? `M${x1},${y1} L${x2},${y2}` : `M${x1},${y1} Q${cx},${cy} ${x2},${y2}` };
  });
  const FLOW_TEXT = "Flow: a trial request leads to activation. Activation leads to the credit management platform, to LLM-assisted support, and to onboarding. The credit management platform leads to usage metering and onboarding.";
  let selected = "platform";
  $: active = gnodes.find(n => n.id === selected)!;
  const nodeKey = (e: KeyboardEvent, id: string) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selected = id; } };

  // GSAP-morphing blob: every path has the same command structure so strings tween.
  const shapes = [
    "M300,60 C420,40 540,130 545,260 C550,400 440,520 300,530 C160,540 55,430 55,290 C55,160 170,80 300,60 Z",
    "M310,50 C440,70 520,170 535,290 C550,410 420,545 290,535 C150,525 70,420 70,280 C70,150 190,30 310,50 Z",
    "M290,70 C400,30 550,150 540,280 C530,410 450,510 310,520 C170,530 40,400 60,270 C75,160 180,100 290,70 Z",
  ];
  let blobPath: SVGPathElement;
  let tl: gsap.core.Timeline | undefined;
  let snap: HTMLDivElement;
  let idx = 0;
  const cardsOf = () => Array.from(snap?.children ?? []) as HTMLElement[];
  function curIdx() {
    const cs = cardsOf(); if (!cs.length) return 0;
    const base = cs[0].offsetLeft; let best = 0, d = Infinity;
    cs.forEach((c, i) => { const x = Math.abs(c.offsetLeft - base - snap.scrollLeft); if (x < d) { d = x; best = i; } });
    return best;
  }
  function goCard(i: number) {
    const cs = cardsOf(); const n = Math.max(0, Math.min(cs.length - 1, i));
    snap.scrollTo({ left: cs[n].offsetLeft - cs[0].offsetLeft, behavior: reduce ? "auto" : "smooth" });
  }
  function snapKey(e: KeyboardEvent) {
    if (e.key === "ArrowRight") { e.preventDefault(); goCard(curIdx() + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goCard(curIdx() - 1); }
  }
  let paletteOpen = false;
  let query = "";
  let input: HTMLInputElement;
  let sel = 0;
  let mapH = 0;
  let boxH = 0;
  // Anything that depends on the browser starts at its server-safe default and is set in onMount, so the pre-rendered HTML always matches.
  let userView: "map" | "list" | null = null;
  let narrow = false;
  $: view = userView ?? (narrow ? "list" : "map");
  $: if (view === "map" && boxH) mapH = boxH;
  let paused = false;
  let opener: HTMLElement | null = null;
  let isMac = false;
  $: tl && (paused ? tl.pause() : tl.play());
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PATHS: Record<string, string> = { main: "/", about: "/about/", experience: "/experience/", certifications: "/certifications/", education: "/education/", contact: "/contact/" };
  const TITLES: Record<string, string> = { main: "Claire Knorr | Product Manager", about: "About | Claire Knorr", experience: "Experience | Claire Knorr", certifications: "Certifications | Claire Knorr", education: "Education | Claire Knorr", contact: "Contact | Claire Knorr" };
  const idFromPath = (p: string) => Object.keys(PATHS).find(k => PATHS[k] === (p.endsWith("/") ? p : p + "/")) ?? "main";
  function show(id: string, smooth: boolean) {
    const behavior = smooth && !reduce ? "smooth" : "auto";
    if (id === "main") window.scrollTo({ top: 0, behavior }); else document.getElementById(id)?.scrollIntoView({ behavior });
  }
  // Clean URLs: scroll to the section, then update the address bar (/experience/ instead of /#experience).
  function go(id: string) {
    show(id, true);
    try { if (location.pathname !== PATHS[id]) history.pushState({}, "", PATHS[id]); } catch { /* file:// previews */ }
    document.title = TITLES[id];
  }
  function nav(e: MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // let "open in new tab" work normally
    e.preventDefault(); go(idFromPath((e.currentTarget as HTMLAnchorElement).pathname));
  }
  function skipToMain(e: Event) { e.preventDefault(); document.getElementById("main")?.focus(); }
  const commands: Cmd[] = [
    { label: "Go to Experience", hint: "section", action: () => go("experience") },
    { label: "Go to About", hint: "section", action: () => go("about") },
    { label: "Go to Certifications", hint: "section · Palo Alto Networks", action: () => go("certifications") },
    { label: "Go to Education", hint: "section · leadership, honors", action: () => go("education") },
    { label: "Go to Contact", hint: "section", action: () => go("contact") },
    ...STORIES.map<Cmd>(s => ({ label: s.title, hint: "platform case study", action: () => { selected = s.id; document.getElementById("platform")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); } })),
    ...roles.map<Cmd>(r => ({ label: `${r.title}, ${r.org}`, hint: "role · " + r.tags.join(", "), action: () => go("experience") })),
    ...tools.map<Cmd>(s => ({ label: s, hint: "tool", action: () => go("about") })),
    { label: "LinkedIn", hint: "link · opens new tab", action: () => { window.open("https://linkedin.com/in/claire-knorr", "_blank", "noopener"); } },
    { label: "GitHub", hint: "link · opens new tab", action: () => { window.open("https://github.com/claireokay", "_blank", "noopener"); } },
    { label: "Email Claire", hint: "mailto", action: () => { location.href = "mailto:clairepknorr@gmail.com"; } },
  ];
  $: results = commands.filter(c => (c.label + " " + c.hint).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 7);
  $: if (sel >= results.length) sel = 0;

  async function open() { opener = document.activeElement as HTMLElement; paletteOpen = true; query = ""; sel = 0; await tick(); input?.focus(); }
  function close() { paletteOpen = false; opener?.focus(); }
  function key(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); paletteOpen ? close() : open(); return; }
    if (!paletteOpen) return;
    if (e.key === "Escape") close();
    else if (e.key === "Tab") { e.preventDefault(); input?.focus(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(results.length, 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel - 1 + results.length) % Math.max(results.length, 1); }
    else if (e.key === "Enter" && results[sel]) { results[sel].action(); close(); }
  }

  onMount(() => {
    isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    paused = reduce;
    const mq = matchMedia("(max-width: 600px)"); narrow = mq.matches;
    const onMq = () => (narrow = mq.matches); mq.addEventListener("change", onMq);
    const landing = idFromPath(location.pathname);
    if (landing !== "main") {
      document.title = TITLES[landing];
      const land = () => show(landing, false);
      addEventListener("load", () => setTimeout(land, 150), { once: true });
      if (document.readyState === "complete") setTimeout(land, 150);
    }
    const pop = () => { const id = idFromPath(location.pathname); document.title = TITLES[id]; show(id, false); };
    addEventListener("popstate", pop);
    if (!reduce) {
      tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 3.2, ease: "sine.inOut" } });
      tl.to(blobPath, { attr: { d: shapes[1] } }).to(blobPath, { attr: { d: shapes[2] } }).to(blobPath, { attr: { d: shapes[0] } });
    }
    return () => { mq.removeEventListener("change", onMq); removeEventListener("popstate", pop); tl?.kill(); };
  });
</script>

<svelte:window on:keydown={key} />

<a class="skip" href="#main" on:click={skipToMain}>Skip to main content</a>

<header class="nav-wrap">
  <nav class="nav" aria-label="Main">
    <div class="left">
      <a class="brand" href="/" on:click={nav}>Claire Knorr<small>Product Manager</small></a>
      <button class="kbd" on:click={open} aria-keyshortcuts="Control+K Meta+K" aria-haspopup="dialog"><span>Search</span><kbd aria-hidden="true">{isMac ? "⌘K" : "Ctrl K"}</kbd></button>
    </div>
    <ul>
      <li><a href="/about/" on:click={nav}>About</a></li><li><a href="/experience/" on:click={nav}>Experience</a></li><li><a href="/education/" on:click={nav}>Education</a></li>
      <li class="soc"><a href="https://linkedin.com/in/claire-knorr" target="_blank" rel="noopener noreferrer"><svg class="ico" viewBox="0 0 {ICONS.linkedin[0]} {ICONS.linkedin[1]}" aria-hidden="true" focusable="false"><path d={String(ICONS.linkedin[4])} fill="currentColor" /></svg>LinkedIn</a></li>
      <li class="soc"><a href="https://github.com/claireokay" target="_blank" rel="noopener noreferrer"><svg class="ico" viewBox="0 0 {ICONS.github[0]} {ICONS.github[1]}" aria-hidden="true" focusable="false"><path d={String(ICONS.github[4])} fill="currentColor" /></svg>GitHub</a></li>
      <li><a class="cta" href="/contact/" on:click={nav}>Connect</a></li>
    </ul>
  </nav>
</header>

<main id="main" tabindex="-1">
  <section class="hero">
    <div class="art">
      <svg viewBox="0 0 600 580" role="img" aria-label="Portrait of Claire Knorr smiling, wearing a black top with ruffled sleeves">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9b3f0"/><stop offset="1" stop-color="#ffb8d9"/></linearGradient>
          <clipPath id="clip"><path bind:this={blobPath} d={shapes[0]} /></clipPath></defs>
        <g clip-path="url(#clip)"><rect width="600" height="580" fill="url(#g)"/>
          <image href="/assets/images/claire-headshot.jpg" x="30" y="20" width="540" height="540" preserveAspectRatio="xMidYMid slice"/></g>
      </svg>
      <button class="motion in-art" class:off={paused} on:click={() => (paused = !paused)}>
          <span class="mi" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12">{#if paused}<path d="M4.5 2.5v11l9-5.5z" fill="currentColor"/>{:else}<rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/>{/if}</svg></span>
          <span>{paused ? "Play motion" : "Pause motion"}</span></button>
    </div>
    <div class="copy">
      <h1>Claire Knorr</h1>
      <p class="role">Product Manager at Palo Alto Networks · San Francisco Bay Area</p>
      <p class="lede">I own licensing and activation for Palo Alto Networks' cybersecurity products, from the credit platform customers buy with to the usage metering behind their bills.</p>
      <div class="actions"><a class="btn solid" href="/resume.pdf" target="_blank" rel="noopener">Résumé<span class="sr"> (PDF, opens in new tab)</span></a><a class="btn" href="mailto:clairepknorr@gmail.com">Email me</a>
        <button class="motion in-actions" class:off={paused} on:click={() => (paused = !paused)}>
          <span class="mi" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12">{#if paused}<path d="M4.5 2.5v11l9-5.5z" fill="currentColor"/>{:else}<rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor"/>{/if}</svg></span>
          <span>{paused ? "Play motion" : "Pause motion"}</span></button></div>
    </div>
  </section>

  <section id="about" class="about wrap">
    <div class="about-grid">
      <div class="about-text">
        <h2>About</h2>
        <p>I care about building products anyone can use. When we redesigned activation for the credit management platform, we put it through an accessibility assessment, cut back on animation, and made sure every part of the page had a clear label.</p>
        <p>I also build my own Claude skills for analysis. They let me take thousands of data points and turn them into a customer journey I can act on.</p>
      </div>
      <dl class="facts">
        <div><dt>Tools</dt><dd>{tools.join(" · ")}</dd></div>
        <div><dt>Favorite trails</dt><dd><ul class="trails"><li>San Bruno Mountain</li><li>Stevens Creek Canyon Trail</li><li>Almaden Quicksilver Park</li><li>Glen Canyon Park</li></ul></dd></div>
      </dl>
    </div>
  </section>

  <section id="experience" class="exp wrap">
    <h2>Career</h2>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="snap" bind:this={snap} on:scroll={() => (idx = curIdx())} on:keydown={snapKey} role="region" aria-label="Roles, scrollable. Use the arrow buttons or left and right arrow keys." tabindex="0">
      {#each roles as r, ri}
        <article class="card" class:wide={ri === 0}>
          <p class="when">{r.when}</p>
          <h3>{r.title}</h3>
          <p class="org">{r.org}</p>
          <ul>{#each r.points as p}<li>{p}</li>{/each}</ul>
          <ul class="chips">{#each r.tags as t}<li>{t}</li>{/each}</ul>
        </article>
      {/each}
    </div>
    <div class="ctl">
      <button on:click={() => goCard(idx - 1)} disabled={idx === 0} aria-label="Previous role"><span aria-hidden="true">&larr;</span></button>
      <button on:click={() => goCard(idx + 1)} disabled={idx === roles.length - 1} aria-label="Next role"><span aria-hidden="true">&rarr;</span></button>
      <span class="count" aria-live="polite">{idx + 1} of {roles.length}</span>
    </div>
  </section>

  <section id="platform" class="plat wrap">
    <h2>The platform I built</h2>
    <p class="sub">How the parts I work on at Palo Alto Networks connect, from a trial request through activation to billing.</p>
    <div class="map" data-view={userView} class:fixed={view === "list" && mapH > 0} style={view === "list" && mapH > 0 ? `height:${mapH}px` : ""} bind:offsetHeight={boxH} role="region" aria-label="Interactive map of the platform">
      <div class="cap"><span class="ctrls"><button class="pausebtn" on:click={() => (paused = !paused)}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">{#if paused}<path d="M4 2.5v11l9-5.5z" fill="currentColor"/>{:else}<rect x="3" y="2.5" width="3.5" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor"/>{/if}</svg>
        <span>{paused ? "Play" : "Pause"}<span class="sr"> animation</span></span></button><span class="seg" role="group" aria-label="View"><button aria-pressed={view === "map"} on:click={() => (userView = "map")}>Map</button><button aria-pressed={view === "list"} on:click={() => (userView = "list")}>List</button></span></span></div>
      <div class="listview">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="plwrap" tabindex="0" role="region" aria-label="Platform parts, scrollable"><ul class="plist">{#each gnodes as n}<li><h3>{n.title}</h3><p>{n.text}</p></li>{/each}</ul></div>
      </div>
      <div class="mapview">
      <p class="sr" id="flowdesc">{FLOW_TEXT}</p>
      <p class="hint" id="maphint">Select a part to read about it. Use Tab to move between parts, and Enter or Space to select.</p>
      <svg viewBox="0 0 {W} {H}" role="group" aria-label="Platform diagram" aria-describedby="maphint flowdesc">
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#9b80d8"/></marker>
          <marker id="ahh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#7d55c7"/></marker>
        </defs>
        {#each glinks as l, i}
          {@const hot = l.source.id === selected || l.target.id === selected}
          <path d={l.d} fill="none" stroke={hot ? "#7d55c7" : "#9b80d8"} stroke-width={hot ? 3 : 2} stroke-linecap="round" marker-end={hot ? "url(#ahh)" : "url(#ah)"} />
          {#if !paused}{#each [0, 1] as k}
            {@const dur = 3 + (i % 3) * 0.5}
            <!-- Dots travel 90% of each arrow (stopping before the arrowhead) and fade in and out, so none pop or pile up on a circle. -->
            <circle class="dot" r={hot ? 4.5 : 3.5} fill={hot ? "#2d1b4e" : "#7d55c7"} stroke="#fff" stroke-width="1.5" opacity="0">
              <animateMotion dur="{dur}s" begin="{-(k * dur) / 2 - i * 0.7}s" repeatCount="indefinite" path={l.d} keyPoints="0;0.9" keyTimes="0;1" calcMode="linear" />
              <animate attributeName="opacity" dur="{dur}s" begin="{-(k * dur) / 2 - i * 0.7}s" repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.15;0.8;1" />
            </circle>{/each}{/if}
        {/each}
        {#each gnodes as n, i}
          {@const sel = n.id === selected}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <g class="node" class:sel role="button" tabindex="0" aria-pressed={sel} aria-label={n.label} transform="translate({n.x},{n.y})" on:click={() => (selected = n.id)} on:keydown={e => nodeKey(e, n.id)}>
            <g class="bob" class:still={paused} style="animation-delay:{-i * 0.7}s"><g class="body">
              <circle class="ring" r={n.r + 9} fill="none" stroke="#2d1b4e" stroke-width="3" stroke-dasharray="6 5" />
              <circle r={n.r} cx="0" cy={sel ? 7 : 5} fill={sel ? "#2d1b4e" : "#c9b3f0"} />
              <circle class="main" r={n.r} fill={FILL[n.tone]} stroke="#2d1b4e" stroke-width={sel ? 3.5 : 2.5} />
              {#if n.id === "platform"}<circle r={n.r - 11} fill="none" stroke="#fbf7ff" stroke-width="2" stroke-dasharray="3 6" opacity=".8" />{/if}
            </g><text y={n.r + 19}>{n.label}</text></g>
          </g>
        {/each}
      </svg>
      <div class="panel" aria-live="polite"><h3>{active.title}</h3>
        <p>{active.text}</p>
      </div>
      </div>
    </div>
  </section>

  <section id="certifications" class="certs wrap">
    <h2>Certifications</h2>
    <ul class="certlist">
      <li><div><strong><a href="https://www.credly.com/badges/3b6d269b-8b8a-40b8-aecd-99f914eb7daf" target="_blank" rel="noopener noreferrer">Palo Alto Networks Certified Cybersecurity Practitioner<span class="sr"> (verify on Credly, opens in new tab)</span></a></strong><span>Issued by Palo Alto Networks</span></div></li>
      <li><div><strong>Palo Alto Networks Certified Cybersecurity Apprentice</strong><span>Issued by Palo Alto Networks</span></div></li>
    </ul>
  </section>

  <section id="education" class="edu wrap">
    <h2>Education</h2>
    <article class="panel2">
      <h3>University of Maryland, College Park</h3>
      <p class="meta">B.S. Information Science, Minor in Disability Studies</p>
      <ul class="chips"><li class="ink">Magna Cum Laude</li><li>GPA 3.965 / 4.00</li><li>Grace Hopper Scholar</li></ul>
      <dl class="rows">
        <div class="row"><dt>Leadership and teaching</dt>
          <dd><ul>{#each lead as a}<li class="entry"><span class="main"><strong>{a.t}</strong><em>{a.s}</em></span></li>{/each}</ul></dd></div>
        <div class="row"><dt>Honors and clubs</dt>
          <dd><ul class="chips">{#each clubs as c}<li>{c}</li>{/each}</ul></dd></div>
      </dl>
    </article>
  </section>


  <section id="contact" class="contact">
    <h2>Get in touch</h2>
    <p>Email is the best way to reach me.</p>
    <div class="links"><a class="btn solid" href="mailto:clairepknorr@gmail.com">clairepknorr@gmail.com</a>
      <a class="btn" href="/resume.pdf" target="_blank" rel="noopener">Résumé<span class="sr"> (PDF, opens in new tab)</span></a>
      <a class="btn" href="https://linkedin.com/in/claire-knorr" target="_blank" rel="noopener noreferrer"><svg class="ico" viewBox="0 0 {ICONS.linkedin[0]} {ICONS.linkedin[1]}" aria-hidden="true" focusable="false"><path d={String(ICONS.linkedin[4])} fill="currentColor" /></svg>LinkedIn<span class="sr"> (opens in new tab)</span></a>
      <a class="btn" href="https://github.com/claireokay" target="_blank" rel="noopener noreferrer"><svg class="ico" viewBox="0 0 {ICONS.github[0]} {ICONS.github[1]}" aria-hidden="true" focusable="false"><path d={String(ICONS.github[4])} fill="currentColor" /></svg>GitHub<span class="sr"> (opens in new tab)</span></a></div>
  </section>
</main>

<footer class="foot">Claire Knorr · Product Manager · San Francisco Bay Area · © {new Date().getFullYear()}</footer>

{#if paletteOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="scrim" on:click={close}>
    <div class="palette" role="dialog" aria-modal="true" aria-labelledby="pal-title" tabindex="-1" on:click|stopPropagation>
      <h2 id="pal-title" class="sr">Search this site</h2>
      <input bind:this={input} bind:value={query} placeholder="Search roles, tools, sections…" aria-label="Search roles, tools, sections"
        role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" aria-activedescendant={results[sel] ? "opt-" + sel : undefined} />
      <ul id="pal-list" role="listbox" aria-label="Results">
        {#each results as c, i}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <li role="option" id={"opt-" + i} aria-selected={i === sel} class:on={i === sel} on:click={() => { c.action(); close(); }} on:mousemove={() => (sel = i)}><span>{c.label}</span><small>{c.hint}</small></li>
        {/each}
      </ul>
      <p class="sr" role="status">{results.length ? results.length + " results" : "No matches"}</p>
      {#if !results.length}<p class="none">No matches</p>{/if}
      <p class="keys" aria-hidden="true">↑↓ to move · Enter to open · Esc to close</p>
    </div>
  </div>
{/if}

<style>
  :global(html) { scroll-behavior: auto; }
  .nav-wrap { position: fixed; inset: 0 0 auto 0; z-index: 20; background: rgba(251,247,255,.8); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
  .nav { display: flex; align-items: center; justify-content: space-between; width: min(100% - 2.5rem, 1180px); margin: 0 auto; height: 4.25rem; }
  .brand { font-family: var(--display); font-variation-settings: "SOFT" 100; font-weight: 600; font-size: 1.2rem; display: flex; flex-direction: column; line-height: 1.1; text-decoration: none; color: var(--plum); }
  .brand small { font-family: var(--body); font-size: .8rem; font-weight: 600; color: var(--plum-soft); }
  ul { list-style: none; margin: 0; padding: 0; }
  .nav ul { display: flex; align-items: center; gap: .25rem; }
  .nav li a { display: inline-block; padding: .45rem .9rem; border-radius: 999px; color: var(--plum); text-decoration: none; font-weight: 600; }
  .nav li a.cta { background: var(--plum); color: #fff; }
  .kbd { font: inherit; font-weight: 600; font-size: .95rem; line-height: 1.3; display: inline-flex; gap: .5rem; align-items: center; padding: .3rem .4rem .3rem .85rem; border: 2px solid var(--line); background: #fff; border-radius: 999px; color: var(--plum-soft); cursor: pointer; }
  kbd { font-family: var(--body); font-weight: 700; font-size: .68rem; line-height: 1.5; letter-spacing: .02em; background: var(--lilac-wash); border: 1px solid var(--line); border-radius: 6px; padding: 0 .35rem; color: var(--plum-soft); }
  .btn { display: inline-flex; gap: .6rem; align-items: center; padding: .8rem 1.4rem; border-radius: 999px; border: 2px solid var(--plum); background: transparent; color: var(--plum); font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
  .btn.solid { background: var(--plum); color: #fff; }
  .card { width: min(80vw, 480px); background: #fff; border: 2px solid var(--plum); border-radius: 28px; padding: 1.6rem; box-shadow: 0 8px 0 var(--lilac); }
  .card h3 { font-size: 1.35rem; } .org { font-weight: 700; color: var(--lilac-deep); margin: .25rem 0 .8rem; } .when { margin: 0 0 .4rem; color: var(--plum-soft); font-weight: 700; }
  .card ul:not(.chips) { padding-left: 1.1rem; list-style: disc; font-size: .98rem; } .card li { margin-bottom: .45rem; }
  .chips { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: 1rem; }
  .chips li { list-style: none; background: var(--lilac-wash); border: 1.5px solid var(--line); border-radius: 999px; padding: .2rem .75rem; font-weight: 700; font-size: .85rem; margin: 0; }
 
  .contact { width: min(100% - 2.5rem, 1180px); margin: 0 auto; padding: 6rem 0 3rem; }
  .contact { text-align: center; padding-bottom: 6rem; } .contact p { color: var(--plum-soft); }
  .scrim { position: fixed; inset: 0; background: rgba(45,27,78,.35); backdrop-filter: blur(4px); z-index: 50; display: grid; place-items: start center; padding-top: 14vh; }
  .palette { width: min(92vw, 560px); background: #fff; border: 2px solid var(--plum); border-radius: 22px; box-shadow: 0 10px 0 var(--lilac); overflow: hidden; }
  .palette input { width: 100%; border: 0; border-bottom: 2px solid var(--line); padding: 1rem 1.2rem; font: inherit; font-weight: 600; outline: none; color: var(--plum); }
  .palette ul { padding: .4rem; } 
   .palette small { color: var(--plum-soft); font-weight: 600; text-align: right; } .none { padding: .8rem; color: var(--plum-soft); }
  @media (max-width: 899px) { .hero { grid-template-columns: 1fr; } .nav li:nth-child(-n+2) { display: none; } }

  .map { background: #fff; border: 2px solid var(--plum); border-radius: 36px 36px 36px 10px; padding: 1rem 1rem .5rem; }
  .cap { font-weight: 700; color: var(--plum-soft); font-size: .92rem; padding: .1rem .6rem .2rem; display: flex; justify-content: space-between; gap: 1rem; }
  .map svg { width: 100%; height: auto; display: block; overflow: visible; }
  .node { cursor: pointer; outline: none; }
  .node .body { transition: transform .25s cubic-bezier(.2,.8,.2,1); transform-box: fill-box; transform-origin: center; }
  .node:hover .body, .node:focus-visible .body { transform: scale(1.08); }
  .node text { font-family: var(--body); font-weight: 700; font-size: 13.5px; fill: var(--plum); paint-order: stroke; stroke: #fff; stroke-width: 4px; stroke-linejoin: round; text-anchor: middle; pointer-events: none; }
  @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
  .bob { animation: bob 5s ease-in-out infinite; }
  .panel { margin: .4rem .4rem .8rem; padding: 1rem 1.2rem 1.05rem; background: var(--lilac-wash); border-radius: 22px 22px 22px 8px; min-height: 8.2rem; }
  .panel h3 { font-size: 1.3rem; margin-bottom: .35rem; } .panel p { margin: 0 0 .5rem; color: var(--plum-soft); font-size: 1rem; } .panel small { font-weight: 600; color: var(--plum-soft); }
  @media (prefers-reduced-motion: reduce) { .bob { animation: none; } .node .body { transition: none; } }
  @media (max-width: 899px) { }
  .links { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.25rem; }
  @media (max-width: 899px) { .nav li.soc { display: none; } }

  .wrap { width: min(100% - 2.5rem, 1180px); margin: 0 auto; }
  .edu { padding: 5rem 0 2rem; } .panel2 { background: #fff; border: 2px solid var(--plum); border-radius: 28px; padding: 1.75rem; box-shadow: 0 8px 0 var(--lilac); }
  .panel2 .meta { margin: .25rem 0 1rem; color: var(--plum-soft); font-weight: 600; }
  :global(.chips li.ink) { background: var(--plum); color: #fff; border-color: var(--plum); }
  
  .foot { text-align: center; padding: 2rem 1rem 3rem; color: var(--plum-soft); font-weight: 600; border-top: 1px solid var(--line); }
  @media (max-width: 760px) { }
  @media (max-width: 899px) { .card.wide { width: auto; } .card.wide ul:not(.chips) { columns: 1; } }
  .rows { margin: 1.5rem 0 0; border-top: 2px solid var(--line); }
  .row { display: grid; grid-template-columns: 200px 1fr; gap: 1.5rem; padding: 1.25rem 0; border-bottom: 2px solid var(--line); }
  .row:last-child { border-bottom: 0; padding-bottom: .25rem; }
  .row dt { font-family: var(--display); font-variation-settings: "SOFT" 100, "WONK" 1; font-weight: 600; font-size: 1.1rem; line-height: 1.25; color: var(--lilac-deep); }
  .row dd { margin: 0; } .row dd ul { margin: 0; padding: 0; }
  .row dd ul:not(.chips) { display: grid; gap: .9rem; }
  .entry { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; list-style: none; }
  .entry .main strong { display: block; line-height: 1.3; } .entry .main em { display: block; font-style: normal; color: var(--plum-soft); font-weight: 600; font-size: .92rem; }
  .entry .stat { flex: none; background: var(--lilac-wash); border: 1.5px solid var(--line); border-radius: 999px; padding: .15rem .8rem; font-weight: 700; font-size: .85rem; color: var(--plum); white-space: nowrap; }
  .row .chips { margin-top: 0; }
  .row .chips li { line-height: 1.3; border-radius: 14px; padding: .35rem .8rem; }
  @media (max-width: 760px) { .row { grid-template-columns: 1fr; gap: .6rem; } .entry { flex-direction: column; align-items: flex-start; gap: .35rem; } .entry .stat { white-space: normal; } }
  @media (max-width: 560px) { .brand small { display: none; } .nav li:nth-child(-n+3) { display: none; } .kbd kbd { display: none; } .kbd { padding: .35rem .7rem; font-size: .9rem; } .nav ul { gap: .15rem; } .nav li a.cta { padding: .45rem .8rem; } .brand { font-size: 1.05rem; } .brand { white-space: nowrap; } }

  .sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  .skip { position: fixed; left: 1rem; top: -4rem; z-index: 100; background: var(--plum); color: #fff; padding: .7rem 1.2rem; border-radius: 999px; font-weight: 700; text-decoration: none; transition: top .15s; }
  .skip:focus { top: 1rem; }
  .palette li[role=option] { display: flex; justify-content: space-between; gap: 1rem; padding: .6rem .8rem; border-radius: 12px; font-weight: 600; cursor: pointer; }
  .palette li.on { background: var(--lilac-wash); outline: 2px solid var(--plum); outline-offset: -2px; }
  .keys { margin: 0; padding: .6rem 1rem; border-top: 2px solid var(--line); color: var(--plum-soft); font-size: .85rem; font-weight: 600; }
 
  .seg { display: inline-flex; border: 2px solid var(--plum); border-radius: 999px; overflow: hidden; }
  .seg button { font: inherit; font-weight: 700; font-size: .85rem; padding: .2rem .85rem; border: 0; background: #fff; color: var(--plum); cursor: pointer; }
  .seg button[aria-pressed="true"] { background: var(--plum); color: #fff; }
  .hint { margin: .1rem .6rem .3rem; font-size: .9rem; color: var(--plum-soft); font-weight: 600; }
  .node .ring { opacity: 0; } .node:focus-visible .ring { opacity: 1; }
  .node:focus-visible .main { stroke-width: 4; }
  .bob.still { animation: none; }
  .plist { display: grid; gap: .75rem; padding: .25rem .5rem; margin: .5rem 0 0; list-style: none; }
  .plist li { background: var(--lilac-wash); border-radius: 18px; padding: .8rem 1.1rem; } .plist h3 { font-size: 1.1rem; margin-bottom: .2rem; } .plist p { margin: 0; color: var(--plum-soft); font-size: .98rem; }
  .note { margin: .8rem 1rem 1rem; font-weight: 600; color: var(--plum-soft); font-size: .95rem; }
  .panel a, .note a, .org, .row dt { color: var(--lilac-ink); }
  .panel a, .note a { text-decoration: underline; text-underline-offset: 3px; }
  @media (max-width: 420px) { .nav { width: calc(100% - 1.5rem); } .brand { font-size: .95rem; } .kbd { padding: .3rem .55rem; font-size: .85rem; } .nav li a.cta { padding: .4rem .65rem; font-size: .9rem; } }
  .ctrls { display: inline-flex; align-items: center; gap: .5rem; }
  .pausebtn { display: inline-flex; align-items: center; gap: .4rem; font: inherit; font-weight: 700; font-size: .85rem; padding: .2rem .8rem; border: 2px solid var(--plum); border-radius: 999px; background: #fff; color: var(--plum); cursor: pointer; }
  .pausebtn:hover { background: var(--lilac-wash); }
  .map.fixed { display: flex; flex-direction: column; } .map.fixed .plwrap { flex: 1; min-height: 0; overflow-y: auto; } .map.fixed .note { flex: none; margin-bottom: .6rem; }
  .tools { margin: .9rem 0 0; font-size: 1rem; color: var(--plum-soft); } .tools strong { color: var(--plum); }
  .certs { padding: 3rem 0 0; scroll-margin-top: 2rem; } .certs h2 { margin-bottom: 1.25rem; }
  .certlist { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; list-style: none; margin: 0; padding: 0; }
  .certlist li { background: #fff; border: 2px solid var(--line); border-radius: 22px; padding: 1.1rem 1.3rem; }
  .certlist strong { display: block; line-height: 1.3; } .certlist span { display: block; margin-top: .2rem; color: var(--plum-soft); font-weight: 600; font-size: .92rem; }
  .certlist a { color: var(--lilac-ink); text-decoration: underline; text-underline-offset: 3px; }

  /* Entrance is pure CSS, so it plays on first paint with no flash and no JS. */
  /* Map and list are both in the page; CSS picks which one shows, so there is no swap after load on phones. */
  .listview { display: none; }
  .map[data-view="list"] .mapview { display: none; } .map[data-view="list"] .listview { display: block; }
  .map[data-view="map"] .mapview { display: block; } .map[data-view="map"] .listview { display: none; }
  @media (max-width: 600px) { .map:not([data-view]) .mapview { display: none; } .map:not([data-view]) .listview { display: block; } }
  .map.fixed .listview { display: flex; flex-direction: column; flex: 1; min-height: 0; }
  @media (prefers-reduced-motion: reduce) { .dot { display: none; } }
  .nav .left { display: flex; align-items: center; gap: 1.25rem; min-width: 0; }
  .ico { width: 1.05em; height: 1.05em; margin-right: .4em; vertical-align: -.14em; }
  .nav li a .ico { margin-right: .45em; }
  .links .btn .ico { margin-right: .1rem; }

  /* Face-first top: portrait, name, one sentence, two links. */
  .hero { display: grid; grid-template-columns: minmax(0, 380px) 1fr; align-items: center; gap: 3rem; width: min(100% - 2.5rem, 1180px); margin: 0 auto; padding: 8rem 0 1rem; }
  .art > svg { width: 100%; height: auto; display: block; filter: drop-shadow(0 14px 0 var(--lilac)); }
  h1 { font-size: clamp(2.6rem, 6vw, 4.25rem); letter-spacing: -.02em; line-height: 1.05; margin: 0 0 .6rem; }
  .role { margin: 0 0 1.1rem; font-weight: 700; color: var(--lilac-ink); font-size: 1.1rem; }
  .lede { font-size: 1.2rem; color: var(--plum-soft); max-width: 34rem; margin: 0; }
  .actions { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: 1.5rem; }
  @media (max-width: 760px) { .hero { grid-template-columns: 1fr; gap: 1.25rem; padding-top: 6rem; } }

  /* One spacing scale for every section. */
  .about, .plat, .certs, .edu { padding: 5rem 0 0; margin-bottom: 0; }
  .contact { padding: 5rem 0; }
  .about { padding-bottom: 4rem; }
  .about h2, .plat h2, .certs h2, .edu h2 { margin: 0 0 1rem; }
  .about-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 3rem; align-items: stretch; }
  .about-text p { color: var(--plum-soft); font-size: 1.15rem; margin: 0 0 1rem; max-width: 36rem; }
  .facts { margin: 0; align-content: center; padding: 1.5rem 1.75rem; background: var(--lilac-wash); border-radius: 22px; display: grid; gap: 1.1rem; }
  .facts dt { font-weight: 700; color: var(--lilac-ink); font-size: .9rem; margin-bottom: .2rem; }
  .facts dd { margin: 0; color: var(--plum-soft); }
  @media (max-width: 760px) { .about-grid { grid-template-columns: 1fr; gap: 1.5rem; } }
  .plat .sub { color: var(--plum-soft); margin: 0 0 1.25rem; max-width: 42rem; }
  .cap { justify-content: flex-end; }
  .map[data-view="list"] .pausebtn { display: none; }
  @media (max-width: 600px) { .map:not([data-view]) .pausebtn { display: none; } }

  .card { display: flex; flex-direction: column; width: auto; }
  .card .chips { margin-top: auto; padding-top: 1rem; }
  /* Career: a row you move yourself (buttons, swipe, arrow keys); the page scrolls normally past it. */
  .exp { padding: 5rem 0 0; }
  .exp h2 { margin: 0 0 .4rem; } .exp .sub { color: var(--plum-soft); margin: 0 0 1.25rem; }
  .snap { position: relative; display: flex; align-items: stretch; gap: 1.25rem; overflow-x: auto; scroll-snap-type: x mandatory; padding: .4rem .3rem 1.4rem; scroll-behavior: smooth; }
  .snap .card { flex: 0 0 min(88%, 520px); scroll-snap-align: start; }
  .snap .card.wide { flex-basis: min(88%, 640px); }
  .ctl { display: flex; align-items: center; gap: .7rem; margin-top: .2rem; }
  .ctl button { width: 2.8rem; height: 2.8rem; border-radius: 50%; border: 2px solid var(--plum); background: #fff; color: var(--plum); font: inherit; font-size: 1.2rem; font-weight: 700; cursor: pointer; }
  .ctl button:hover:not(:disabled) { background: var(--plum); color: #fff; }
  .ctl button:disabled { opacity: .35; cursor: default; }
  .ctl .count { font-weight: 700; color: var(--plum-soft); }
  .snap:focus-visible, .ctl button:focus-visible { outline: 3px solid var(--lilac-deep); outline-offset: 3px; }
  .about, .exp, .plat, .certs, .edu, .contact { scroll-margin-top: 4rem; }
  @media (prefers-reduced-motion: reduce) { .snap { scroll-behavior: auto; } }
  .motion { display: inline-flex; align-items: center; gap: .55rem; min-height: 2.75rem; padding: 0 .6rem 0 .3rem; margin-left: .25rem; border: 0; background: none; font: inherit; font-weight: 700; font-size: .95rem; color: var(--plum-soft); cursor: pointer; border-radius: 999px; }
  .motion .mi { display: grid; place-items: center; width: 1.9rem; height: 1.9rem; border-radius: 50%; background: var(--lilac-wash); border: 1.5px solid var(--line); color: var(--plum); transition: background .2s, color .2s; }
  .motion:hover { color: var(--plum); } .motion:hover .mi { background: var(--lilac); }
  .motion.off .mi { background: var(--plum); border-color: var(--plum); color: #fff; }
  .motion:focus-visible { outline: 3px solid var(--lilac-deep); outline-offset: 2px; }
  .motion.in-art { display: none; }
  @media (max-width: 760px) {
    .art { display: flex; flex-direction: column; align-items: center; width: min(100%, 300px); }
    .art > svg { width: 100%; }
    .motion.in-art { display: inline-flex; margin: .9rem 0 0; padding: 0 .9rem 0 .3rem; background: var(--lilac-wash); border: 1.5px solid var(--line); }
    .motion.in-actions { display: none; }
  }
  .trails { list-style: none; margin: 0; padding: 0; display: grid; gap: .2rem; }
</style>
