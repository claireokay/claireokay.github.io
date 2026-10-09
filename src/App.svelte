<script lang="ts">
  import { onMount, tick } from "svelte";
  import { gsap } from "gsap";
  import { ScrollTrigger } from "gsap/ScrollTrigger";
  // Brand icons: Font Awesome Free (CC BY 4.0), https://fontawesome.com/license/free
  import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
  import { fill } from "./metrics";
  const ICONS = { github: faGithub.icon, linkedin: faLinkedin.icon };

  type Role = { id: string; title: string; org: string; when: string; since: string; points: string[]; tags: string[] };
  const roles: Role[] = [
    { id: "panw", title: "Product Manager, Licensing and Activation", org: "Palo Alto Networks", when: "Aug 2025 to present", since: "2025-08",
      points: ["Built and scaled a 0-1 credit management platform to {creditProducts} cybersecurity products, {creditCurrencies} credit currencies, and {creditOfferings} offerings (subscriptions, SaaS activations, and bundles), unlocking new revenue streams for {creditCustomers} customers at {activationReliability} activation reliability.",
               "Launched usage metering for credit products across {meteringEventTypes} activation event types, achieving {billingAccuracy} billing accuracy by positioning the credit platform as the activation orchestrator.",
               "Shipped an LLM feature that summarizes activation failures and proactively opens support cases, cutting MTTR by {mttrDaysSaved} days and manual case creation by {manualCasesCut}.",
               "Led New Product Introduction and go-to-market for {launches} launches, aligning {teams} cross-functional teams (Engineering, UX, Finance, Pricing, and more).",
               "Led a product-led growth trial flow designed to replace a roughly {trialApprovalWeeks}-week approval process with instant activation, with automated trial value reports for Sales and GTM.",
               "Cut activation-related support tickets from {ticketsBefore} to under {ticketsAfter} by redesigning onboarding across {onboardingProducts} products, reducing required inputs from {inputsBefore} to {inputsAfter}.",
               "Conducted {interviews} customer discovery interviews with network security admins, prioritizing pain points into {roadmapFeatures} net-new roadmap features."],
      tags: ["0-1 platforms", "Generative AI", "Usage metering", "Product-led growth", "Roadmapping"] },
    { id: "wmt", title: "Product Manager Intern", org: "Walmart", when: "Summer 2024", since: "2024",
      points: ["Authored a PRD and presented findings to leadership, driving the shipment of new ML models and metadata inputs to measure inspiration-score effectiveness.",
               "Defined {wmtMetrics} production metrics for a homepage inspiration score measuring personalization content, adopted by Data Science.",
               "Validated the score against {wmtYears} years of shopper click-through data in Tableau, Looker, and Excel.",
               "Built a content prioritization framework with Data Science, Business, and Merchandising across {wmtCampaigns} annual campaigns."],
      tags: ["PRDs", "Metrics definition", "Tableau", "Looker"] },
    { id: "amex", title: "Software Engineer Intern", org: "American Express", when: "Jan 2023 and Summer 2023", since: "2023",
      points: ["Led the migration of {amexWorkflows} shell-script workflows to Python, creating a compliance automation adopted org-wide that saved {amexHoursSaved} hours of manual work daily.",
               "Drove sprint planning as technical lead on the compliance automation.",
               "Built a React.js login authentication system for the Corporate Technology team.",
               "Redesigned the interface of an internal banking tool used by {amexToolUsers} employees daily, delivering a full front-end overhaul within a {amexSprintWeeks}-week sprint using HTML, CSS, and JavaScript."],
      tags: ["Python", "React.js", "JavaScript", "Compliance automation", "UI redesign"] },
  ];
  const tools = ["Python", "React.js", "JavaScript", "SQL", "Tableau", "Looker", "Excel"];

  // Education is curated: the strongest leadership items and one award. Campus jobs, other awards and clubs are cut.
  const lead = [
    { t: "Director", s: "Technica, UMD's hackathon for underrepresented genders" },
    { t: "Undergraduate Teaching Assistant", s: "CHSE205 (Disability Studies)" },
  ];
  const award = { t: "Outstanding Student Employee", s: "Division of Student Affairs", n: "Selected from 2,100 employees" };
  type Cmd = { label: string; hint: string; action: () => void };


  // ---- Platform map: a left-to-right flow with fixed positions; CSS does the motion
  type Tone = "deep" | "lilac" | "blush" | "plum" | "wash";
  interface Story { id: string; label: string; title: string; text: string; r: number; tone: Tone }
  interface GNode extends Story { x: number; y: number }
  interface GLink { source: GNode; target: GNode; d: string }
  const STORIES: Story[] = [
    { id: "trial", label: "Trial request", title: "Product-led growth trial", r: 30, tone: "wash", text: "Instant activation replaces a roughly {trialApprovalWeeks}-week approval, with automated trial value reports that tell Sales and GTM who to follow up with." },
    { id: "activation", label: "Activation", title: "Activation orchestrator", r: 34, tone: "lilac", text: "Subscriptions, SaaS activations, and bundles all activate through one flow, at {activationReliability} reliability." },
    { id: "platform", label: "Credit platform", title: "Credit management platform", r: 52, tone: "deep", text: "A 0-1 platform shared by {creditProducts} cybersecurity products, {creditCurrencies} credit currencies, and {creditOfferings} offerings." },
    { id: "ai", label: "LLM support", title: "LLM-assisted support", r: 34, tone: "plum", text: "A generative AI feature summarizes activation failures and opens support cases before customers ask. MTTR down {mttrDaysSaved} days, manual case creation down {manualCasesCut}." },
    { id: "metering", label: "Usage metering", title: "Usage metering", r: 36, tone: "blush", text: "Every billable event is captured at the source across {meteringEventTypes} activation event types, at {billingAccuracy} billing accuracy." },
    { id: "onboarding", label: "Onboarding", title: "Onboarding redesign", r: 30, tone: "lilac", text: "Required inputs cut from {inputsBefore} to {inputsAfter}. Activation-related support tickets fell from {ticketsBefore} to under {ticketsAfter}." },
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

  let track: HTMLOListElement;
  let pinWrap: HTMLElement;
  let progress = 0;
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
  let opener: HTMLElement | null = null;
  let isMac = false;
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
    { label: "Go to Education", hint: "section · leadership, awards", action: () => go("education") },
    { label: "Go to Contact", hint: "section", action: () => go("contact") },
    ...STORIES.map<Cmd>(s => ({ label: s.title, hint: "platform map", action: () => { selected = s.id; show("platform", true); } })),
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
    gsap.registerPlugin(ScrollTrigger);
    isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    const mq = matchMedia("(max-width: 600px)"); narrow = mq.matches;
    const onMq = () => (narrow = mq.matches); mq.addEventListener("change", onMq);
    // The career row pins and scrolls sideways only when the whole row fits the window; otherwise it stays a stacked list.
    // The stacked list is also what scrapers, no-JS readers and reduced-motion users get.
    let tween: gsap.core.Timeline | undefined;
    const head = pinWrap.querySelector<HTMLElement>(".pin-head")!;
    function layout() {
      const was = !!tween;
      tween?.scrollTrigger?.kill(true); tween?.kill(); tween = undefined;
      gsap.set(track, { clearProps: "transform" }); progress = 0;
      pinWrap.classList.add("pinned");
      const cs = getComputedStyle(pinWrap);
      const need = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.rowGap) + head.offsetHeight + track.offsetHeight;
      if (reduce || innerWidth < 900 || need > innerHeight) {
        pinWrap.classList.remove("pinned");
        if (was) ScrollTrigger.refresh();
        return;
      }
      // Stops: row positions where a card sits fully in view. At each one the row holds still for a screen of scrolling,
      // so anything that pages down a screen at a time (a reader, or a screenshot-driven agent) lands on every card.
      // Between stops the row moves 1:1 with the scroll. Sizes are fixed per layout; a resize rebuilds it.
      const dist = track.scrollWidth - innerWidth + 80;
      const cards = [...track.children] as HTMLElement[];
      const stops = [...new Set(cards.map(c => Math.round(Math.min(dist, c.offsetLeft - cards[0].offsetLeft))))];
      const hold = innerHeight;
      const length = stops.length * hold + stops[stops.length - 1];
      tween = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
        trigger: pinWrap, start: "top top", end: "+=" + length, pin: true, scrub: 0.6, onUpdate: s => (progress = s.progress) } });
      stops.forEach((x, i) => { if (i) tween!.to(track, { x: -x, duration: x - stops[i - 1] }); tween!.to({}, { duration: hold }); });
    }
    layout();
    document.fonts?.ready.then(layout);
    let lastW = innerWidth, lastH = innerHeight, timer = 0;
    const onResize = () => { clearTimeout(timer); timer = window.setTimeout(() => {
      if (innerWidth === lastW && Math.abs(innerHeight - lastH) < 60) return; // ignore phone address-bar jiggle
      lastW = innerWidth; lastH = innerHeight; layout(); }, 200); };
    addEventListener("resize", onResize);
    const landing = idFromPath(location.pathname);
    if (landing !== "main") {
      document.title = TITLES[landing];
      const land = () => { layout(); ScrollTrigger.refresh(); show(landing, false); };
      addEventListener("load", () => setTimeout(land, 150), { once: true });
      if (document.readyState === "complete") setTimeout(land, 150);
    }
    const pop = () => { const id = idFromPath(location.pathname); document.title = TITLES[id]; show(id, false); };
    addEventListener("popstate", pop);
    return () => { mq.removeEventListener("change", onMq); removeEventListener("popstate", pop); removeEventListener("resize", onResize); clearTimeout(timer); tween?.kill(); ScrollTrigger.getAll().forEach(t => t.kill()); };
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
      <li><a class="cta" href="/contact/" on:click={nav}>Contact</a></li>
    </ul>
  </nav>
</header>

<main id="main" tabindex="-1">
  <section class="hero">
    <img class="hero-in portrait" src="/assets/images/claire-headshot.jpg" width="800" height="800" fetchpriority="high"
      alt="Portrait of Claire Knorr smiling, wearing a black top with ruffled sleeves">
    <div class="copy">
      <h1 class="hero-in">Claire Knorr</h1>
      <p class="hero-in role">Product manager at Palo Alto Networks · San Francisco</p>
      <p class="hero-in lede">I own licensing and activation for Palo Alto Networks' cybersecurity products: the credit platform customers buy with, the usage metering behind their bills, and the onboarding that gets them running.</p>
      <div class="hero-in actions">
        <a class="btn solid" href="/resume.pdf">Résumé<span class="sr"> (PDF)</span></a>
        <a class="btn" href="mailto:clairepknorr@gmail.com">Email me</a>
        <a class="btn" href="https://linkedin.com/in/claire-knorr" target="_blank" rel="noopener noreferrer"><svg class="ico" viewBox="0 0 {ICONS.linkedin[0]} {ICONS.linkedin[1]}" aria-hidden="true" focusable="false"><path d={String(ICONS.linkedin[4])} fill="currentColor" /></svg>LinkedIn<span class="sr"> (opens in new tab)</span></a>
      </div>
    </div>
  </section>

  <section id="about" class="about wrap">
    <h2>About</h2>
    <div class="about-copy">
      <p>I started as a software engineer intern at American Express and found that my favorite part of the job was deciding <em>what</em> to build and <em>why</em>. That's the job I have now.</p>
      <p>I minored in Disability Studies, and it shapes how I write requirements. <mark class="todo">TODO(claire): one real example, such as a requirement you wrote differently because of it.</mark></p>
      <p>I build my own Claude skills for data analysis and use them to inform product decisions.</p>
      <p class="tools"><strong>Tools:</strong> {tools.join(" · ")}</p>
      <p class="tools"><strong>Outside of work:</strong> I like exploring San Francisco, good coffee, hiking, and reading by the beach. In college I skated with Maryland Club Figure Skating. <mark class="todo">TODO(claire): swap in specifics (a favorite hike, coffee spot, what you're reading).</mark></p>
    </div>
  </section>

  <section id="experience" class="pin" bind:this={pinWrap}>
    <div class="pin-head">
      <h2>Experience</h2>
      <p class="hint" aria-hidden="true">Scroll to move through roles.</p>
      <div class="bar" role="presentation"><i style="transform: scaleX({progress})"></i></div>
    </div>
    <ol class="track" bind:this={track}>
      {#each roles as r, ri}
        <li class="card" class:wide={ri === 0}><article>
          <header class="card-head">
            <p class="when"><time datetime={r.since}>{r.when}</time></p>
            <h3>{r.title}</h3>
            <p class="org">{r.org}</p>
          </header>
          <ul class="points">{#each r.points as p}<li>{#each fill(p) as seg}{#if seg.todo}<mark class="todo">{seg.t}</mark>{:else}{seg.t}{/if}{/each}</li>{/each}</ul>
          <footer class="card-foot">
            {#if r.id === "panw"}<p class="more-link"><a href="#platform" on:click|preventDefault={() => show("platform", true)}>How the platform fits together ↓</a></p>{/if}
            <p class="tags">{r.tags.join(" · ")}</p>
          </footer>
        </article></li>
      {/each}
    </ol>
  </section>

  <section id="platform" class="platform wrap">
    <!-- TODO(claire): confirm the title ("I own" replaced "I built") and that this section is fine to publish under Palo Alto Networks policy. -->
    <div class="plat-head">
      <div><h2>The platform I own</h2>
        <p>How the parts I work on at Palo Alto Networks connect, from a trial request through activation to billing.</p></div>
      <span class="seg" role="group" aria-label="View"><button aria-pressed={view === "map"} on:click={() => (userView = "map")}>Map</button><button aria-pressed={view === "list"} on:click={() => (userView = "list")}>List</button></span>
    </div>
    <div class="map" data-view={userView} class:fixed={view === "list" && mapH > 0} style={view === "list" && mapH > 0 ? `height:${mapH}px` : ""} bind:offsetHeight={boxH} role="region" aria-label="Diagram of the platform Claire owns">
      <div class="listview">
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div class="plwrap" tabindex="0" role="region" aria-label="Platform parts, scrollable"><ul class="plist">{#each gnodes as n}<li><h3>{n.title}</h3><p>{#each fill(n.text) as seg}{#if seg.todo}<mark class="todo">{seg.t}</mark>{:else}{seg.t}{/if}{/each}</p></li>{/each}</ul></div>
      </div>
      <div class="mapview">
      <p class="sr" id="flowdesc">{FLOW_TEXT}</p>
      <p class="hint" id="maphint">Select a part to read about it.<span class="sr"> Use Tab to move between parts, and Enter or Space to select.</span></p>
      <div class="mapgrid">
      <svg viewBox="0 0 {W} {H}" role="group" aria-label="Platform diagram" aria-describedby="maphint flowdesc">
        <defs>
          <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#9b80d8"/></marker>
          <marker id="ahh" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="#7d55c7"/></marker>
        </defs>
        {#each glinks as l}
          {@const hot = l.source.id === selected || l.target.id === selected}
          <path d={l.d} fill="none" stroke={hot ? "#7d55c7" : "#9b80d8"} stroke-width={hot ? 3 : 2} stroke-linecap="round" marker-end={hot ? "url(#ahh)" : "url(#ah)"} />
        {/each}
        {#each gnodes as n}
          {@const sel = n.id === selected}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <g class="node" class:sel role="button" tabindex="0" aria-pressed={sel} aria-label={n.label} transform="translate({n.x},{n.y})" on:click={() => (selected = n.id)} on:keydown={e => nodeKey(e, n.id)}>
            <g class="body">
              <circle class="ring" r={n.r + 9} fill="none" stroke="#2d1b4e" stroke-width="3" stroke-dasharray="6 5" />
              <circle r={n.r} cx="0" cy={sel ? 7 : 5} fill={sel ? "#2d1b4e" : "#c9b3f0"} />
              <circle class="main" r={n.r} fill={FILL[n.tone]} stroke="#2d1b4e" stroke-width={sel ? 3.5 : 2.5} />
              {#if n.id === "platform"}<circle r={n.r - 11} fill="none" stroke="#fbf7ff" stroke-width="2" stroke-dasharray="3 6" opacity=".8" />{/if}
            </g><text y={n.r + 19}>{n.label}</text>
          </g>
        {/each}
      </svg>
      <div class="panel" aria-live="polite"><h3>{active.title}</h3>
        <p>{#each fill(active.text) as seg}{#if seg.todo}<mark class="todo">{seg.t}</mark>{:else}{seg.t}{/if}{/each}</p></div>
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
      <p class="honors">Magna Cum Laude · GPA 3.965 / 4.00 · Grace Hopper Scholar</p>
      <dl class="rows">
        <div class="row"><dt>Leadership and teaching</dt>
          <dd><ul>{#each lead as a}<li class="entry"><span class="main"><strong>{a.t}</strong><em>{a.s}</em></span></li>{/each}</ul></dd></div>
        <div class="row"><dt>Award</dt>
          <dd><ul><li class="entry"><span class="main"><strong>{award.t}</strong><em>{award.s}</em></span><span class="stat">{award.n}</span></li></ul></dd></div>
      </dl>
    </article>
  </section>


  <section id="contact" class="contact">
    <h2>Get in touch</h2>
    <p>Email is the best way to reach me.</p>
    <div class="links"><a class="btn solid" href="mailto:clairepknorr@gmail.com">clairepknorr@gmail.com</a>
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
  ul { list-style: none; margin: 0; padding: 0; }
  .wrap { width: min(100% - 2.5rem, 1180px); margin: 0 auto; }
  h2 { font-size: clamp(1.6rem, 2.4vw, 2rem); margin-bottom: var(--space-head); }
  /* Jumping to a section lands its heading just below the fixed nav. */
  main > section { scroll-margin-top: calc(var(--nav-h) - var(--space-section) + .75rem); }
  .sr { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
  .skip { position: fixed; left: 1rem; top: -4rem; z-index: 100; background: var(--plum); color: #fff; padding: .7rem 1.2rem; border-radius: var(--radius-s); font-weight: 700; text-decoration: none; transition: top .15s; }
  .skip:focus { top: 1rem; }
  :global(mark.todo) { background: #ffe08a; color: #4a3200; border-radius: 4px; padding: 0 .3rem; font-weight: 700; }

  /* Nav */
  .nav-wrap { position: fixed; inset: 0 0 auto 0; z-index: 20; background: rgba(251,247,255,.88); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
  .nav { display: flex; align-items: center; justify-content: space-between; width: min(100% - 2.5rem, 1180px); margin: 0 auto; height: var(--nav-h); }
  .nav .left { display: flex; align-items: center; gap: 1.25rem; min-width: 0; }
  .brand { font-family: var(--display); font-variation-settings: "SOFT" 30; font-weight: 600; font-size: 1.2rem; display: flex; flex-direction: column; line-height: 1.1; text-decoration: none; color: var(--plum); white-space: nowrap; }
  .brand small { font-family: var(--body); font-size: .8rem; font-weight: 500; color: var(--plum-soft); }
  .nav ul { display: flex; align-items: center; gap: .15rem; }
  .nav li a { display: inline-block; padding: .4rem .7rem; border-radius: var(--radius-s); color: var(--plum); text-decoration: none; font-weight: 600; }
  .nav li a:hover { background: var(--lilac-wash); }
  .nav li a.cta { background: var(--plum); color: #fff; margin-left: .4rem; }
  .ico { width: 1.05em; height: 1.05em; margin-right: .45em; vertical-align: -.14em; }
  .kbd { font: inherit; font-weight: 500; font-size: .95rem; line-height: 1.3; display: inline-flex; gap: .5rem; align-items: center; padding: .3rem .35rem .3rem .7rem; border: 1px solid var(--line-strong); background: #fff; border-radius: var(--radius-s); color: var(--plum-soft); cursor: pointer; }
  .kbd:hover { border-color: var(--lilac-deep); }
  kbd { font-family: var(--body); font-weight: 600; font-size: .7rem; line-height: 1.5; background: var(--lilac-wash); border: 1px solid var(--line); border-radius: 4px; padding: 0 .35rem; color: var(--plum-soft); }
  /* No keyboard shortcut badge on touch screens. */
  @media (hover: none), (pointer: coarse) { .kbd kbd { display: none; } .kbd { padding: .3rem .75rem; } }
  @media (max-width: 899px) { .nav li:nth-child(-n+3), .nav li.soc { display: none; } }
  @media (max-width: 560px) { .brand small, .kbd kbd { display: none; } .brand { font-size: 1.05rem; } .kbd { padding: .3rem .7rem; font-size: .9rem; } }
  @media (max-width: 420px) { .nav { width: calc(100% - 1.5rem); } .nav .left { gap: .75rem; } .brand { font-size: .95rem; } .kbd { padding: .3rem .55rem; font-size: .85rem; } .nav li a.cta { padding: .4rem .65rem; font-size: .9rem; } }

  /* Buttons */
  .btn { display: inline-flex; gap: .5rem; align-items: center; padding: .7rem 1.2rem; border-radius: var(--radius-s); border: 1.5px solid var(--plum); background: transparent; color: var(--plum); font: inherit; font-weight: 700; text-decoration: none; cursor: pointer; }
  .btn:hover { background: var(--lilac-wash); }
  .btn.solid { background: var(--plum); color: #fff; } .btn.solid:hover { background: #3f2a68; }
  .btn .ico { margin-right: 0; }

  /* Top section */
  .hero { display: grid; grid-template-columns: minmax(200px, 320px) 1fr; align-items: center; gap: clamp(2rem, 5vw, 4rem); width: min(100% - 2.5rem, 1180px); margin: 0 auto; padding: calc(var(--nav-h) + var(--space-section)) 0 var(--space-section); }
  .portrait { width: 100%; height: auto; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-l); display: block; }
  h1 { font-size: clamp(2.5rem, 5vw, 3.75rem); letter-spacing: -.02em; margin-bottom: .6rem; }
  .role { font-weight: 700; color: var(--lilac-ink); margin: 0 0 1rem; font-size: 1.1rem; }
  .lede { font-size: 1.2rem; color: var(--plum-soft); max-width: 34rem; margin: 0; }
  .actions { display: flex; gap: .75rem; flex-wrap: wrap; margin-top: 1.75rem; }
  @media (max-width: 760px) { .hero { grid-template-columns: 1fr; gap: 1.5rem; padding-top: calc(var(--nav-h) + 1.5rem); } .portrait { width: 140px; } }
  /* Entrance is pure CSS, so it plays on first paint with no flash and no JS. */
  @keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .hero-in { animation: rise .6s cubic-bezier(.2,.8,.2,1) both; }
  .copy > :nth-child(2) { animation-delay: .07s; } .copy > :nth-child(3) { animation-delay: .14s; } .copy > :nth-child(4) { animation-delay: .21s; } .portrait.hero-in { animation-delay: .1s; }

  /* Every other section: same vertical padding. */
  .about, .platform, .certs, .edu, .contact { padding: var(--space-section) 0; }

  /* About */
  .about-copy { max-width: 44rem; }
  .about p { color: var(--plum-soft); font-size: 1.1rem; margin: 0 0 1rem; }
  .tools { font-size: 1rem; } .tools strong { color: var(--plum); }

  /* Experience. overflow: clip (not hidden) so the section is not a scroll container: scrollIntoView or focus can't shift the row sideways. */
  .pin { background: var(--lilac-wash); overflow: clip; padding: var(--space-section) 0; display: flex; flex-direction: column; gap: var(--space-head); }
  .pin-head { width: min(100% - 2.5rem, 1180px); margin: 0 auto; } .pin-head h2 { margin: 0; }
  .pin-head .hint, .pin-head .bar { display: none; }
  .pin-head .hint { color: var(--plum-soft); margin: .3rem 0 .75rem; }
  .bar { height: 4px; background: var(--line); border-radius: 4px; overflow: hidden; max-width: 320px; }
  .bar i { display: block; height: 100%; background: var(--lilac-deep); transform-origin: left; }
  .track { list-style: none; display: flex; flex-direction: column; gap: 1.25rem; width: min(100% - 2.5rem, 1180px); margin: 0 auto; padding: 0; }
  .card { display: flex; background: #fff; border: 1px solid var(--line-strong); border-radius: var(--radius-l); padding: 1.5rem; }
  .card article { flex: 1; display: flex; flex-direction: column; }
  .when { margin: 0 0 .35rem; color: var(--plum-soft); font-weight: 600; font-size: .95rem; }
  .card h3 { font-size: 1.3rem; }
  .org { font-weight: 700; color: var(--lilac-ink); margin: .2rem 0 .8rem; }
  .points { padding-left: 1.1rem; list-style: disc; margin: 0; } .points li { margin-bottom: .45rem; break-inside: avoid; }
  .card-foot { margin-top: auto; }
  .more-link { margin: .8rem 0 0; font-weight: 700; } .more-link a { text-underline-offset: 3px; }
  .tags { margin: .8rem 0 0; color: var(--plum-soft); font-size: .9rem; }
  /* Wide windows, not pinned: a résumé-style row per role, dates and title on the left. */
  @media (min-width: 900px) {
    .pin:not(:global(.pinned)) .card article { display: grid; grid-template-columns: 15rem 1fr; column-gap: 2.5rem; align-content: start; }
    .pin:not(:global(.pinned)) .card-head { grid-row: 1 / span 2; } .pin:not(:global(.pinned)) .points, .pin:not(:global(.pinned)) .card-foot { grid-column: 2; }
  }
  /* Pinned: one row of equal-height cards that scrolls sideways. Tight padding so the row fits more windows. */
  .pin:global(.pinned) { min-height: 100vh; justify-content: center; padding: calc(var(--nav-h) + 1.25rem) 0 1.25rem; }
  :global(.pinned) .pin-head .hint, :global(.pinned) .pin-head .bar { display: block; }
  :global(.pinned) .track { flex-direction: row; align-items: stretch; width: max-content; margin: 0; padding: 0 max(1.25rem, calc((100vw - 1180px) / 2)); }
  :global(.pinned) .card { width: min(80vw, 480px); } :global(.pinned) .card.wide { width: min(92vw, 940px); }
  :global(.pinned) .card.wide .points { columns: 2; column-gap: 1.75rem; }

  /* Platform case study */
  .plat-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 1.5rem; margin-bottom: var(--space-head); }
  .plat-head h2 { margin: 0; } .plat-head p { margin: .4rem 0 0; color: var(--plum-soft); max-width: 40rem; }
  .seg { display: inline-flex; flex: none; border-bottom: 1px solid var(--line-strong); }
  .seg button { font: inherit; font-weight: 600; font-size: .95rem; padding: .35rem .8rem; border: 0; border-bottom: 2px solid transparent; margin-bottom: -1px; background: none; color: var(--plum-soft); cursor: pointer; }
  .seg button[aria-pressed="true"] { color: var(--plum); border-bottom-color: var(--plum); }
  .map { background: #fff; border: 1px solid var(--line-strong); border-radius: var(--radius-l); padding: 1rem 1.25rem; }
  .mapgrid { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 1.5rem; align-items: center; }
  .map svg { width: 100%; height: auto; display: block; overflow: visible; }
  .hint { margin: 0 0 .3rem; font-size: .95rem; color: var(--plum-soft); }
  .node { cursor: pointer; outline: none; }
  .node .body { transition: transform .25s cubic-bezier(.2,.8,.2,1); transform-box: fill-box; transform-origin: center; }
  .node:hover .body, .node:focus-visible .body { transform: scale(1.06); }
  .node text { font-family: var(--body); font-weight: 700; font-size: 13.5px; fill: var(--plum); paint-order: stroke; stroke: #fff; stroke-width: 4px; stroke-linejoin: round; text-anchor: middle; pointer-events: none; }
  .node .ring { opacity: 0; } .node:focus-visible .ring { opacity: 1; } .node:focus-visible .main { stroke-width: 4; }
  .panel { padding: 1.1rem 1.25rem; background: var(--lilac-wash); border-radius: 10px; min-height: 8.2rem; }
  .panel h3 { font-size: 1.25rem; margin-bottom: .35rem; } .panel p { margin: 0; color: var(--plum-soft); }
  .plist { display: grid; gap: .75rem; padding: .25rem 0; margin: 0; list-style: none; }
  .plist li { background: var(--lilac-wash); border-radius: 10px; padding: .8rem 1.1rem; } .plist h3 { font-size: 1.1rem; margin-bottom: .2rem; } .plist p { margin: 0; color: var(--plum-soft); }
  /* Map and list are both in the page; CSS picks which one shows, so there is no swap after load on phones. */
  .listview { display: none; }
  .map[data-view="list"] .mapview { display: none; } .map[data-view="list"] .listview { display: block; }
  .map[data-view="map"] .mapview { display: block; } .map[data-view="map"] .listview { display: none; }
  @media (max-width: 600px) { .map:not([data-view]) .mapview { display: none; } .map:not([data-view]) .listview { display: block; } }
  .map.fixed { display: flex; flex-direction: column; } .map.fixed .listview { display: flex; flex-direction: column; flex: 1; min-height: 0; } .map.fixed .plwrap { flex: 1; min-height: 0; overflow-y: auto; }
  @media (max-width: 899px) { .mapgrid { grid-template-columns: 1fr; } .plat-head { flex-direction: column; align-items: flex-start; } }
  @media (prefers-reduced-motion: reduce) { .hero-in { animation: none; } .node .body { transition: none; } }

  /* Certifications */
  .certlist { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
  .certlist li { background: #fff; border: 1px solid var(--line-strong); border-radius: var(--radius-l); padding: 1.1rem 1.3rem; }
  .certlist strong { display: block; line-height: 1.3; } .certlist span { display: block; margin-top: .2rem; color: var(--plum-soft); font-size: .95rem; }
  .certlist a { text-underline-offset: 3px; }

  /* Education */
  .panel2 { background: #fff; border: 1px solid var(--line-strong); border-radius: var(--radius-l); padding: 1.75rem; }
  .panel2 .meta { margin: .25rem 0 .4rem; color: var(--plum-soft); } .honors { margin: 0; font-weight: 700; }
  .rows { margin: 1.5rem 0 0; border-top: 1px solid var(--line); }
  .row { display: grid; grid-template-columns: 200px 1fr; gap: 1.5rem; padding: 1.25rem 0; border-bottom: 1px solid var(--line); }
  .row:last-child { border-bottom: 0; padding-bottom: .25rem; }
  .row dt { font-family: var(--display); font-variation-settings: "SOFT" 30; font-weight: 600; font-size: 1.1rem; line-height: 1.25; color: var(--lilac-ink); }
  .row dd { margin: 0; } .row dd ul { display: grid; gap: .9rem; }
  .entry { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
  .entry .main strong { display: block; line-height: 1.3; } .entry .main em { display: block; font-style: normal; color: var(--plum-soft); font-size: .95rem; }
  .entry .stat { flex: none; color: var(--plum-soft); font-size: .95rem; white-space: nowrap; }
  @media (max-width: 760px) { .row { grid-template-columns: 1fr; gap: .6rem; } .entry { flex-direction: column; align-items: flex-start; gap: .25rem; } .entry .stat { white-space: normal; } }

  /* Contact and footer */
  .contact { width: min(100% - 2.5rem, 1180px); margin: 0 auto; text-align: center; } .contact p { color: var(--plum-soft); margin: 0; }
  .links { display: flex; gap: .75rem; justify-content: center; flex-wrap: wrap; margin-top: 1.5rem; }
  .foot { text-align: center; padding: 2rem 1rem 3rem; color: var(--plum-soft); border-top: 1px solid var(--line); }

  /* Search palette */
  .scrim { position: fixed; inset: 0; background: rgba(45,27,78,.3); backdrop-filter: blur(3px); z-index: 50; display: grid; place-items: start center; padding-top: 14vh; }
  .palette { width: min(92vw, 560px); background: #fff; border: 1px solid var(--line-strong); border-radius: 12px; box-shadow: 0 24px 60px rgba(45,27,78,.22); overflow: hidden; }
  .palette input { width: 100%; border: 0; border-bottom: 1px solid var(--line); padding: 1rem 1.2rem; font: inherit; outline: none; color: var(--plum); }
  .palette ul { padding: .4rem; }
  .palette li[role=option] { display: flex; justify-content: space-between; gap: 1rem; padding: .6rem .8rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
  .palette li.on { background: var(--lilac-wash); outline: 1.5px solid var(--lilac-deep); outline-offset: -1.5px; }
  .palette small { color: var(--plum-soft); font-weight: 400; text-align: right; } .none { padding: .8rem; color: var(--plum-soft); }
  .keys { margin: 0; padding: .6rem 1rem; border-top: 1px solid var(--line); color: var(--plum-soft); font-size: .85rem; }
</style>
