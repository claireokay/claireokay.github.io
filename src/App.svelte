<script lang="ts">
  import { onMount, tick } from "svelte";
  import { gsap } from "gsap";
  import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationLinkDatum, type SimulationNodeDatum } from "d3-force";
  import { ScrollTrigger } from "gsap/ScrollTrigger";

  gsap.registerPlugin(ScrollTrigger);

  type Role = { id: string; title: string; org: string; when: string; points: string[]; tags: string[] };
  const roles: Role[] = [
    { id: "panw", title: "Product Manager, Licensing and Activation", org: "Palo Alto Networks", when: "Aug 2025 to present",
      points: ["Built and scaled a 0-1 credit management platform to XX cybersecurity products, XX credit currencies, and XX+ offerings (subscriptions, SaaS activations, and bundles), unlocking new revenue streams for XX+ customers at XX% activation reliability. Planning migration of XXK customers off a legacy credit model.",
               "Launched usage metering for credit products across XX+ activation event types, achieving XX% billing accuracy by positioning the credit platform as the activation orchestrator.",
               "Shipped an LLM feature that summarizes activation failures and proactively opens support cases, cutting MTTR by XX days and manual case creation by XX%.",
               "Led New Product Introduction and go-to-market for XX launches, aligning XX cross-functional teams (Engineering, UX, Finance, Pricing, and more).",
               "Led a product-led growth trial flow designed to replace a roughly XX-week approval process with instant activation, with automated trial value reports for Sales and GTM.",
               "Cut activation-related support tickets from XX% to under XX% by redesigning onboarding across XX products, reducing required inputs from XX to XX.",
               "Conducted XX+ customer discovery interviews with network security admins, prioritizing pain points into XX net-new roadmap features."],
      tags: ["0-1 platforms", "Generative AI", "Usage metering", "Product-led growth", "Roadmapping"] },
    { id: "wmt", title: "Product Manager Intern", org: "Walmart", when: "Summer 2024",
      points: ["Authored a PRD and presented findings to leadership, driving the shipment of new ML models and metadata inputs to measure inspiration-score effectiveness.",
               "Defined XX production metrics for a homepage inspiration score measuring personalization content, adopted by Data Science.",
               "Validated the score against XX years of shopper click-through data in Tableau, Looker, and Excel.",
               "Built a content prioritization framework with Data Science, Business, and Merchandising across XX+ annual campaigns."],
      tags: ["PRDs", "Metrics definition", "Tableau", "Looker"] },
    { id: "amex1", title: "Software Engineer Intern", org: "American Express", when: "Summer 2023",
      points: ["Led the migration of XX shell-script workflows to Python, creating a compliance automation adopted org-wide that saved XX hours of manual work daily.",
               "Built a React.js login authentication system for the Corporate Technology team.",
               "Drove sprint planning as technical lead on the compliance automation."],
      tags: ["Python", "React.js", "Agile sprints", "Compliance automation"] },
    { id: "amex0", title: "Software Engineer Intern", org: "American Express", when: "Jan 2023",
      points: ["Redesigned the interface of an internal banking tool used by XX+ employees daily, delivering a full front-end overhaul within a XX-week sprint using HTML, CSS, and JavaScript."],
      tags: ["HTML/CSS", "JavaScript", "UI redesign"] },
  ];
  const tools = ["Python", "React.js", "JavaScript", "SQL", "Tableau", "Looker", "Excel"];

  const awards = [
    { t: "Outstanding Student Employee Recipient", s: "Division of Student Affairs", n: "Selected from 2100 employees" },
    { t: "Outstanding Customer Service Award", s: "Department of Resident Life", n: "Selected from over 200 resident assistants" },
    { t: "South Hill & Leonardtown Community Resident Assistant of the Year", s: "Department of Resident Life", n: "Selected from 40 resident assistants" },
  ];
  const work = [
    { t: "Resident Assistant", s: "Resident Life" },
    { t: "Welcome Desk Student Manager", s: "Conferences and Visitor Services", n: "Promoted from Visitor Services Assistant" },
    { t: "Hospitality Assistant", s: "Conferences and Visitor Services" },
  ];
  const lead = [
    { t: "Director", s: "Technica" },
    { t: "Undergraduate Teaching Assistant", s: "CHSE205 (Disability Studies)" },
    { t: "Guided Study Sessions (GSS)", s: "INST326" },
  ];
  const clubs = ["Alpha Lambda Delta Honor Society", "Omicron Delta Kappa Honor Society (ODK)", "Information Science FI (Female-Identifying)", "Women in Business Association", "Terps for Change", "Maryland Club Figure Skating"];
  const values = [
    { t: "Human-centered thinking", d: "Features ship, but experiences last. I keep the user's actual situation, not a simplified persona, at the center of every product decision." },
    { t: "Accessibility as foundation", d: "A design constraint that makes products better for everyone. I think about it from the start, not as a retrofit." },
    { t: "Bridge-builder", d: "At home in technical and non-technical conversations. Engineering, design, finance, sales: I translate across all of them." },
    { t: "Fluent with AI tools", d: "I treat AI as a working tool. I've shipped an LLM feature into enterprise support and built my own Claude skills for data analysis to inform product decisions." },
  ];
  type Cmd = { label: string; hint: string; action: () => void };


  // ---- B: platform map (d3-force layout, settled once; CSS does the motion)
  type Tone = "deep" | "lilac" | "blush" | "plum" | "wash";
  interface Story { id: string; label: string; title: string; text: string; r: number; tone: Tone }
  interface GNode extends Story, SimulationNodeDatum {}
  interface GLink extends SimulationLinkDatum<GNode> { source: string | GNode; target: string | GNode }
  const STORIES: Story[] = [
    { id: "platform", label: "Credit platform", title: "Credit management platform", r: 52, tone: "deep", text: "A 0-1 platform shared by XX cybersecurity products, XX credit currencies, and XX+ offerings. Next up: migrating XXK customers off a legacy credit model." },
    { id: "activation", label: "Activation", title: "Activation orchestrator", r: 34, tone: "lilac", text: "Subscriptions, SaaS activations, and bundles all activate through one flow, at XX% reliability." },
    { id: "metering", label: "Usage metering", title: "Usage metering", r: 36, tone: "blush", text: "Every billable event is captured at the source across XX+ activation event types, at XX% billing accuracy." },
    { id: "ai", label: "LLM support", title: "LLM-assisted support", r: 34, tone: "plum", text: "A generative AI feature summarizes activation failures and opens support cases before customers ask. MTTR down XX days, manual case creation down XX%." },
    { id: "trial", label: "Trial flow", title: "Product-led growth trial", r: 30, tone: "wash", text: "Instant activation replaces a roughly XX-week approval, with automated trial value reports that tell Sales and GTM who to follow up with." },
    { id: "onboarding", label: "Onboarding", title: "Onboarding redesign", r: 30, tone: "lilac", text: "Required inputs cut from XX to XX. Activation-related support tickets fell from XX% to under XX%." },
    { id: "discovery", label: "Discovery", title: "Customer discovery", r: 28, tone: "wash", text: "XX+ interviews with network security admins became XX net-new roadmap features, ranked by severity and support volume." },
  ];
  const EDGES: [string, string][] = [["platform","activation"],["platform","metering"],["platform","ai"],["platform","trial"],["platform","onboarding"],["discovery","platform"],["activation","metering"],["ai","activation"],["discovery","onboarding"]];
  const FILL: Record<Tone, string> = { deep: "#7d55c7", lilac: "#c9b3f0", blush: "#ffb8d9", plum: "#2d1b4e", wash: "#f1e9fd" };
  const W = 640, H = 430;
  function layout() {
    const nodes: GNode[] = STORIES.map(s => ({ ...s }));
    const links: GLink[] = EDGES.map(([source, target]) => ({ source, target }));
    const sim = forceSimulation<GNode>(nodes)
      .force("link", forceLink<GNode, GLink>(links).id(n => n.id).distance(135).strength(0.55))
      .force("charge", forceManyBody<GNode>().strength(-520))
      .force("collide", forceCollide<GNode>().radius(n => n.r + 26))
      .force("center", forceCenter(W / 2, H / 2)).stop();
    for (let i = 0; i < 400; i++) sim.tick();
    for (const n of nodes) { n.x = Math.max(n.r + 14, Math.min(W - n.r - 14, n.x ?? W / 2)); n.y = Math.max(n.r + 10, Math.min(H - n.r - 26, n.y ?? H / 2)); }
    return { nodes, links };
  }
  const { nodes: gnodes, links: glinks } = layout();
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
  let track: HTMLDivElement;
  let pinWrap: HTMLElement;
  let progress = 0;
  let paletteOpen = false;
  let query = "";
  let input: HTMLInputElement;
  let sel = 0;
  let mapH = 0;
  let boxH = 0;
  $: if (view === "map" && boxH) mapH = boxH;
  let paused = reduce0();
  let view: "map" | "list" = (typeof matchMedia !== "undefined" && matchMedia("(max-width: 600px)").matches) ? "list" : "map";
  let opener: HTMLElement | null = null;
  let tl: gsap.core.Timeline | undefined;
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  function reduce0() { return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  $: tl && (paused ? tl.pause() : tl.play());
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PATHS: Record<string, string> = { main: "/", about: "/about/", experience: "/experience/", education: "/education/", contact: "/contact/" };
  const TITLES: Record<string, string> = { main: "Claire Knorr | Product Manager", about: "About | Claire Knorr", experience: "Experience | Claire Knorr", education: "Education | Claire Knorr", contact: "Contact | Claire Knorr" };
  const idFromPath = (p: string) => Object.keys(PATHS).find(k => PATHS[k] === (p.endsWith("/") ? p : p + "/")) ?? "main";
  function show(id: string, smooth: boolean) {
    if (id === "education") { const d = document.querySelector<HTMLDetailsElement>(".more"); if (d) d.open = true; }
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
    { label: "Go to Education", hint: "section · awards, honors", action: () => { const d = document.querySelector<HTMLDetailsElement>(".more"); if (d) d.open = true; go("education"); } },
    { label: "Go to Contact", hint: "section", action: () => go("contact") },
    ...STORIES.map<Cmd>(s => ({ label: s.title, hint: "platform map", action: () => { selected = s.id; go("main"); } })),
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
  function redact(s: string) { return s.split(/(XX[%+K]?)/g).map(p => ({ t: p, r: /^XX/.test(p) })); }

  onMount(() => {
    const landing = idFromPath(location.pathname);
    if (landing !== "main") {
      document.title = TITLES[landing];
      const land = () => { ScrollTrigger.refresh(); show(landing, false); };
      addEventListener("load", () => setTimeout(land, 150), { once: true });
      if (document.readyState === "complete") setTimeout(land, 150);
    }
    const pop = () => { const id = idFromPath(location.pathname); document.title = TITLES[id]; show(id, false); };
    addEventListener("popstate", pop);
    if (!reduce) {
      tl = gsap.timeline({ repeat: -1, yoyo: true, defaults: { duration: 3.2, ease: "sine.inOut" } });
      tl.to(blobPath, { attr: { d: shapes[1] } }).to(blobPath, { attr: { d: shapes[2] } }).to(blobPath, { attr: { d: shapes[0] } });
      gsap.from(".hero-in", { y: 24, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" });
    }
    const mm = gsap.matchMedia();
    mm.add("(min-width: 900px) and (min-height: 800px)", () => {
      const dist = () => track.scrollWidth - window.innerWidth + 80;
      gsap.to(track, { x: () => -dist(), ease: "none", scrollTrigger: {
        trigger: pinWrap, start: "top top", end: () => "+=" + dist(), pin: true, scrub: reduce ? true : 0.6, invalidateOnRefresh: true,
        onUpdate: s => (progress = s.progress) } });
    });
    return () => { removeEventListener("popstate", pop); tl?.kill(); mm.revert(); ScrollTrigger.getAll().forEach(t => t.kill()); };
  });
</script>

<svelte:window on:keydown={key} />

<a class="skip" href="#main" on:click={skipToMain}>Skip to main content</a>

<header class="nav-wrap">
  <nav class="nav" aria-label="Main">
    <a class="brand" href="/" on:click={nav}>Claire Knorr<small>Product Manager</small></a>
    <ul>
      <li><a href="/about/" on:click={nav}>About</a></li><li><a href="/experience/" on:click={nav}>Experience</a></li>
      <li><button class="kbd" on:click={open} aria-keyshortcuts="Control+K Meta+K" aria-haspopup="dialog"><span>Search</span><kbd aria-hidden="true">{isMac ? "⌘K" : "Ctrl K"}</kbd></button></li>
      <li class="soc"><a href="https://linkedin.com/in/claire-knorr" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
      <li class="soc"><a href="https://github.com/claireokay" target="_blank" rel="noopener noreferrer">GitHub</a></li>
      <li><a class="cta" href="/contact/" on:click={nav}>Connect</a></li>
    </ul>
  </nav>
</header>

<main id="main" tabindex="-1">
  <section class="hero">
    <div class="copy">
      <p class="hero-in avatar"><img src="/assets/images/claire-headshot.jpg" alt="" /> Claire Knorr · open to product roles</p>
      <h1 class="hero-in">Product manager for 0-1 platforms and AI-powered enterprise workflows.</h1>
      <p class="hero-in lede">I own a licensing and credit platform at Palo Alto Networks, from usage metering to an LLM feature that summarizes activation failures and opens support cases before customers ask.</p>
      <div class="hero-in actions"><a class="btn solid" href="/experience/" on:click={nav}>See my experience</a><button class="btn" on:click={open}>Search my work <kbd aria-hidden="true">{isMac ? "⌘K" : "Ctrl K"}</kbd></button></div>
    </div>
    <div class="hero-in map" class:fixed={view === "list" && mapH > 0} style={view === "list" && mapH > 0 ? `height:${mapH}px` : ""} bind:offsetHeight={boxH} role="region" aria-label="Interactive map of the platform Claire built">
      <div class="cap"><h2 class="capt">The platform I built</h2>
        <span class="ctrls"><button class="pausebtn" on:click={() => (paused = !paused)} aria-pressed={paused}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">{#if paused}<path d="M4 2.5v11l9-5.5z" fill="currentColor"/>{:else}<rect x="3" y="2.5" width="3.5" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor"/>{/if}</svg>
        <span>{paused ? "Play" : "Pause"}<span class="sr"> animation</span></span></button><span class="seg" role="group" aria-label="View"><button aria-pressed={view === "map"} on:click={() => (view = "map")}>Map</button><button aria-pressed={view === "list"} on:click={() => (view = "list")}>List</button></span></span></div>
      {#if view === "list"}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="plwrap" tabindex="0" role="region" aria-label="Platform parts, scrollable"><ul class="plist">{#each gnodes as n}<li><h3>{n.title}</h3><p>{#each redact(n.text) as seg}{#if seg.r}<span class="redacted light"><span aria-hidden="true">{seg.t}</span><span class="sr">redacted figure</span></span>{:else}{seg.t}{/if}{/each}</p></li>{/each}</ul></div>
        <p class="note">Figures are redacted. <a href="mailto:clairepknorr@gmail.com?subject=Metrics%20and%20resume%20request">Email me</a> for the specifics.</p>
      {:else}
      <p class="hint" id="maphint">Select a part to read about it. Use Tab to move between parts, and Enter or Space to select.</p>
      <svg viewBox="0 0 {W} {H}" role="group" aria-label="Platform diagram" aria-describedby="maphint">
        {#each glinks as l, i}
          {@const a = l.source as GNode} {@const b = l.target as GNode} {@const hot = a.id === selected || b.id === selected}
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hot ? "#7d55c7" : "#9b80d8"} stroke-width={hot ? 3 : 2} stroke-linecap="round" stroke-dasharray={hot ? "" : "2 7"} />
          {#if !paused}{#each [0, 1] as k}
            <circle r={hot ? 4.5 : 3.2} fill={hot ? "#2d1b4e" : "#7d55c7"} opacity={hot ? 1 : 0.7}>
              <animateMotion dur="{3 + (i % 3) * 0.6}s" begin="{-k * 1.6}s" repeatCount="indefinite" path="M{a.x},{a.y} L{b.x},{b.y}" />
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
        <p>{#each redact(active.text) as seg}{#if seg.r}<span class="redacted light"><span aria-hidden="true">{seg.t}</span><span class="sr">redacted figure</span></span>{:else}{seg.t}{/if}{/each}</p>
        <small>Want the real numbers? <a href="mailto:clairepknorr@gmail.com?subject=Metrics%20and%20resume%20request">Email me.</a></small></div>
      {/if}
    </div>
  </section>

  <section id="about" class="story">
    <div class="art">
      <svg viewBox="0 0 600 580" role="img" aria-label="Portrait of Claire Knorr smiling, wearing a black top with ruffled sleeves">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9b3f0"/><stop offset="1" stop-color="#ffb8d9"/></linearGradient>
          <clipPath id="clip"><path bind:this={blobPath} d={shapes[0]} /></clipPath></defs>
        <g clip-path="url(#clip)"><rect width="600" height="580" fill="url(#g)"/>
          <image href="/assets/images/claire-headshot.jpg" x="30" y="20" width="540" height="540" preserveAspectRatio="xMidYMid slice"/></g>
      </svg>
      <button class="pausebtn under" on:click={() => (paused = !paused)} aria-pressed={paused}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">{#if paused}<path d="M4 2.5v11l9-5.5z" fill="currentColor"/>{:else}<rect x="3" y="2.5" width="3.5" height="11" rx="1" fill="currentColor"/><rect x="9.5" y="2.5" width="3.5" height="11" rx="1" fill="currentColor"/>{/if}</svg>
        <span>{paused ? "Play" : "Pause"}<span class="sr"> animation</span></span></button>
    </div>
    <div class="story-copy">
      <h2>Systems that meet people</h2>
      <p>I started as a software engineer intern, then realized my favorite part was deciding <em>what</em> to build and <em>why</em>. Today I own licensing and activation for cybersecurity products, and a Disability Studies minor shapes how I write requirements.</p>
      <ul class="chips"><li>B.S. Information Science, UMD</li><li>Magna Cum Laude</li><li>GPA 3.965 / 4.00</li><li>Grace Hopper Scholar</li></ul>
      <p class="tools"><strong>Tools:</strong> {tools.join(" · ")}</p>
      <p class="tools"><strong>Outside of work:</strong> I love exploring San Francisco, trying good coffee, going hiking, and reading by the beach.</p>
    </div>
  </section>

  <section class="values wrap">
    <h2>How I work</h2>
    <ul>{#each values as v}<li><h3>{v.t}</h3><p>{v.d}</p></li>{/each}</ul>
  </section>

  <section id="experience" class="pin" bind:this={pinWrap}>
    <div class="pin-head">
      <h2>Career</h2>
      <p>Scroll to travel through it. Metrics are redacted as <span class="redacted"><span aria-hidden="true">XX</span><span class="sr">XX</span></span>; email for specifics.</p>
      <div class="bar" role="presentation"><i style="transform: scaleX({progress})"></i></div>
    </div>
    <div class="track" bind:this={track}>
      {#each roles as r, ri}
        <article class="card" class:wide={ri === 0}>
          <p class="when">{r.when}</p>
          <h3>{r.title}</h3>
          <p class="org">{r.org}</p>
          <ul>{#each r.points as p}<li>{#each redact(p) as seg}{#if seg.r}<span class="redacted"><span aria-hidden="true">{seg.t}</span><span class="sr">redacted figure</span></span>{:else}{seg.t}{/if}{/each}</li>{/each}</ul>
          <ul class="chips">{#each r.tags as t}<li>{t}</li>{/each}</ul>
        </article>
      {/each}
    </div>
  </section>

  <section id="education" class="edu wrap">
    <h2>Education</h2>
    <article class="panel2">
      <h3>University of Maryland, College Park</h3>
      <p class="meta">B.S. Information Science, Minor in Disability Studies</p>
      <ul class="chips"><li class="ink">Magna Cum Laude</li><li>GPA 3.965 / 4.00</li><li>Grace Hopper Scholar</li></ul>
      <p class="cert"><strong>Certifications:</strong> Palo Alto Networks Certified Cybersecurity Practitioner · Palo Alto Networks Certified Cybersecurity Apprentice</p>
      <details class="more">
        <summary><span class="when-closed">Show awards, leadership and activities</span><span class="when-open">Hide awards, leadership and activities</span></summary>
      <dl class="rows">
        <div class="row"><dt>Awards</dt>
          <dd><ul>{#each awards as a}<li class="entry"><span class="main"><strong>{a.t}</strong><em>{a.s}</em></span><span class="stat">{a.n}</span></li>{/each}</ul></dd></div>
        <div class="row"><dt>Leadership and teaching</dt>
          <dd><ul>{#each lead as a}<li class="entry"><span class="main"><strong>{a.t}</strong><em>{a.s}</em></span></li>{/each}</ul></dd></div>
        <div class="row"><dt>Work during college</dt>
          <dd><ul>{#each work as a}<li class="entry"><span class="main"><strong>{a.t}</strong><em>{a.s}</em></span>{#if a.n}<span class="stat">{a.n}</span>{/if}</li>{/each}</ul></dd></div>
        <div class="row"><dt>Honors and clubs</dt>
          <dd><ul class="chips">{#each clubs as c}<li>{c}</li>{/each}</ul></dd></div>
      </dl>
      </details>
    </article>
  </section>


  <section id="contact" class="contact">
    <h2>Hiring a product manager?</h2>
    <p>I'd like to hear about the role.</p>
    <div class="links"><a class="btn solid" href="mailto:clairepknorr@gmail.com">clairepknorr@gmail.com</a>
      <a class="btn" href="https://linkedin.com/in/claire-knorr" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
      <a class="btn" href="https://github.com/claireokay" target="_blank" rel="noopener noreferrer">GitHub ↗</a></div>
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
  .kbd { font: inherit; font-weight: 600; display: inline-flex; gap: .6rem; align-items: center; padding: .4rem .5rem .4rem .9rem; border: 2px solid var(--line); background: #fff; border-radius: 999px; color: var(--plum-soft); cursor: pointer; }
  kbd { font-family: var(--body); font-weight: 700; font-size: .78rem; background: var(--lilac-wash); border: 1px solid var(--line); border-radius: 8px; padding: .1rem .45rem; color: var(--plum); }
  .hero { min-height: 100vh; display: grid; grid-template-columns: .95fr 1.05fr; align-items: center; gap: 2rem; width: min(100% - 2.5rem, 1180px); margin: 0 auto; padding-top: 5rem; }
  h1 { font-size: clamp(2.2rem, 4.4vw, 3.5rem); letter-spacing: -.02em; margin-bottom: 1.25rem; }
  .lede { font-size: 1.2rem; color: var(--plum-soft); max-width: 34rem; }
  .actions { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: 1.75rem; }
  .btn { display: inline-flex; gap: .6rem; align-items: center; padding: .8rem 1.4rem; border-radius: 999px; border: 2px solid var(--plum); background: transparent; color: var(--plum); font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
  .btn.solid { background: var(--plum); color: #fff; }
  .story .art svg { width: 100%; height: auto; display: block; filter: drop-shadow(0 18px 0 var(--lilac)); }
  .pin { min-height: 100vh; background: var(--lilac-wash); overflow: hidden; padding: 6rem 0 2rem; display: flex; flex-direction: column; justify-content: center; gap: 1.5rem; }
  .pin-head { width: min(100% - 2.5rem, 1180px); margin: 0 auto; }
  .pin-head p { color: var(--plum-soft); margin: .4rem 0 1rem; }
  .bar { height: 6px; background: var(--line); border-radius: 6px; overflow: hidden; max-width: 360px; }
  .bar i { display: block; height: 100%; background: var(--lilac-deep); transform-origin: left; }
  .track { display: flex; align-items: flex-start; gap: 1.5rem; padding: 0 max(1.25rem, calc((100vw - 1180px)/2)); width: max-content; }
  .card { width: min(80vw, 480px); background: #fff; border: 2px solid var(--plum); border-radius: 28px; padding: 1.6rem; box-shadow: 0 8px 0 var(--lilac); }
  .card h3 { font-size: 1.35rem; } .org { font-weight: 700; color: var(--lilac-deep); margin: .25rem 0 .8rem; } .when { margin: 0 0 .4rem; color: var(--plum-soft); font-weight: 700; }
  .card ul:not(.chips) { padding-left: 1.1rem; list-style: disc; font-size: .98rem; } .card li { margin-bottom: .45rem; }
  .chips { display: flex; flex-wrap: wrap; gap: .4rem; margin-top: 1rem; }
  .chips li { list-style: none; background: var(--lilac-wash); border: 1.5px solid var(--line); border-radius: 999px; padding: .2rem .75rem; font-weight: 700; font-size: .85rem; margin: 0; }
 
  :global(.redacted) { background: var(--plum); color: var(--lilac); border-radius: 6px; font-weight: 700; padding: 0 .35rem; user-select: none; }
  .contact { width: min(100% - 2.5rem, 1180px); margin: 0 auto; padding: 6rem 0 3rem; }
  .contact { text-align: center; padding-bottom: 6rem; } .contact p { color: var(--plum-soft); }
  .scrim { position: fixed; inset: 0; background: rgba(45,27,78,.35); backdrop-filter: blur(4px); z-index: 50; display: grid; place-items: start center; padding-top: 14vh; }
  .palette { width: min(92vw, 560px); background: #fff; border: 2px solid var(--plum); border-radius: 22px; box-shadow: 0 10px 0 var(--lilac); overflow: hidden; }
  .palette input { width: 100%; border: 0; border-bottom: 2px solid var(--line); padding: 1rem 1.2rem; font: inherit; font-weight: 600; outline: none; color: var(--plum); }
  .palette ul { padding: .4rem; } 
   .palette small { color: var(--plum-soft); font-weight: 600; text-align: right; } .none { padding: .8rem; color: var(--plum-soft); }
  @media (max-width: 899px) { .hero { grid-template-columns: 1fr; } .track { flex-direction: column; width: auto; padding: 0 1.25rem; } .card { width: auto; } .pin { height: auto; } .nav li:nth-child(-n+2) { display: none; } }

  .avatar { display: inline-flex; align-items: center; gap: .7rem; margin: 0 0 1.5rem; padding: .3rem .95rem .3rem .3rem; background: #fff; border: 2px solid var(--line); border-radius: 999px; font-weight: 700; }
  .avatar img { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; object-position: 50% 30%; }
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
  :global(.redacted.light) { background: #fff; color: var(--plum); letter-spacing: .04em; white-space: nowrap; }
  .story { display: grid; grid-template-columns: .8fr 1.2fr; gap: 3rem; align-items: center; width: min(100% - 2.5rem, 1180px); margin: 0 auto; padding: 4rem 0; }
  .story h2 { margin-bottom: 1rem; } .story p { color: var(--plum-soft); font-size: 1.1rem; }
  .hero h1 { font-size: clamp(2.1rem, 3.9vw, 3.15rem); }
  @media (prefers-reduced-motion: reduce) { .bob { animation: none; } .node .body { transition: none; } }
  @media (max-width: 899px) { .story { grid-template-columns: 1fr; } }
  .links { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.25rem; }
  @media (max-width: 899px) { .nav li.soc { display: none; } }

  .wrap { width: min(100% - 2.5rem, 1180px); margin: 0 auto; }
  .values { padding: 1rem 0 5rem; } .values h2, .edu h2 { margin-bottom: 1.5rem; }
  .values ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
  .values li { background: #fff; border: 2px solid var(--line); border-radius: 24px; padding: 1.25rem 1.4rem; } .values h3 { font-size: 1.15rem; margin-bottom: .4rem; } .values p { margin: 0; color: var(--plum-soft); font-size: .98rem; }
  .edu { padding: 5rem 0 2rem; } .panel2 { background: #fff; border: 2px solid var(--plum); border-radius: 28px; padding: 1.75rem; box-shadow: 0 8px 0 var(--lilac); }
  .panel2 .meta { margin: .25rem 0 1rem; color: var(--plum-soft); font-weight: 600; }
  :global(.chips li.ink) { background: var(--plum); color: #fff; border-color: var(--plum); }
  
  .foot { text-align: center; padding: 2rem 1rem 3rem; color: var(--plum-soft); font-weight: 600; border-top: 1px solid var(--line); }
  @media (max-width: 760px) { }
  .card.wide { width: min(92vw, 940px); } .card.wide ul:not(.chips) { columns: 2; column-gap: 1.75rem; } .card.wide li { break-inside: avoid; }
  @media (max-width: 899px) { .card.wide { width: auto; } .card.wide ul:not(.chips) { columns: 1; } }
  .more { margin-top: 1.25rem; }
  .more summary { list-style: none; cursor: pointer; display: inline-flex; align-items: center; gap: .6rem; padding: .5rem 1.1rem; border: 2px solid var(--plum); border-radius: 999px; font-weight: 700; color: var(--plum); background: #fff; }
  .more summary::-webkit-details-marker { display: none; }
  .more summary::after { content: ""; width: .5rem; height: .5rem; border-right: 2px solid currentColor; border-bottom: 2px solid currentColor; transform: translateY(-2px) rotate(45deg); transition: transform .2s; }
  .more[open] summary::after { transform: translateY(1px) rotate(-135deg); }
  .more summary:hover { background: var(--lilac-wash); }
  .more .when-open, .more[open] .when-closed { display: none; } .more[open] .when-open { display: inline; }
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
  @media (max-width: 899px), (max-height: 799px) { .track { flex-direction: column; width: auto; padding: 0 1.25rem; } .card, .card.wide { width: auto; } .card.wide ul:not(.chips) { columns: 1; } .pin { height: auto; min-height: 0; } }
  .capt { font-family: var(--body); font-variation-settings: normal; font-size: .95rem; font-weight: 700; color: var(--plum-soft); }
  @media (max-width: 420px) { .nav { width: calc(100% - 1.5rem); } .brand { font-size: .95rem; } .kbd { padding: .3rem .55rem; font-size: .85rem; } .nav li a.cta { padding: .4rem .65rem; font-size: .9rem; } }
  .ctrls { display: inline-flex; align-items: center; gap: .5rem; }
  .pausebtn { display: inline-flex; align-items: center; gap: .4rem; font: inherit; font-weight: 700; font-size: .85rem; padding: .2rem .8rem; border: 2px solid var(--plum); border-radius: 999px; background: #fff; color: var(--plum); cursor: pointer; }
  .pausebtn:hover { background: var(--lilac-wash); }
  .pausebtn.under { margin: 2.4rem 0 0 .5rem; }
  .map.fixed { display: flex; flex-direction: column; } .map.fixed .plwrap { flex: 1; min-height: 0; overflow-y: auto; } .map.fixed .note { flex: none; margin-bottom: .6rem; }
  .tools { margin: .9rem 0 0; font-size: 1rem; color: var(--plum-soft); } .tools strong { color: var(--plum); }
  .cert { margin: .9rem 0 0; color: var(--plum-soft); font-weight: 600; } .cert strong { color: var(--plum); }
</style>
