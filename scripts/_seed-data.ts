// Dummy trading-notes used to populate the pgvector index for
// the retrieval benchmark.
interface Company {
  symbol: string;
  name: string;
  themes: string[];
}

const COMPANIES: Company[] = [
  {
    symbol: "NVDA",
    name: "Nvidia",
    themes: [
      "Data-center revenue grew over 200% year-over-year as hyperscalers ramped GPU orders for AI training clusters. Management guided next-quarter revenue well above consensus, citing Blackwell demand outstripping supply through the next several quarters.",
      "Gross margin expanded to roughly 75% on favorable product mix, though guidance hinted at modest compression as Blackwell ramps and supply normalizes. The forward P/E near 45 prices in continued hypergrowth and leaves little room for execution missteps.",
      "Key risk: customer concentration is high, with a handful of cloud providers driving the bulk of data-center sales. Any pullback in hyperscaler capex, or a shift toward in-house custom silicon, would pressure the growth narrative.",
      "Competitive moat rests on CUDA software lock-in and a rapid annual cadence of new architectures. AMD's MI300 and custom ASICs from Google and Amazon are credible long-term threats but have not dented near-term demand.",
      "Export controls on advanced chips to China remain an overhang, trimming the addressable market and adding regulatory uncertainty to forward estimates.",
    ],
  },
  {
    symbol: "AAPL",
    name: "Apple",
    themes: [
      "iPhone unit growth has flattened in developed markets, with the upgrade cycle lengthening. Services revenue, now a high-margin double-digit grower, is increasingly the story and supports the premium multiple.",
      "Capital returns remain enormous, with aggressive buybacks shrinking the share count and supporting EPS even when revenue growth is muted. The balance sheet is fortress-like with substantial net cash.",
      "Regulatory pressure on the App Store take rate in the EU and ongoing antitrust scrutiny could erode high-margin services economics over time.",
      "Greater China is both a major demand market and a manufacturing dependency; geopolitical friction and local competition from Huawei present a two-sided risk.",
      "The AI narrative is a wildcard: on-device intelligence could drive a hardware upgrade super-cycle, but Apple is widely seen as behind on generative AI relative to peers.",
    ],
  },
  {
    symbol: "TSLA",
    name: "Tesla",
    themes: [
      "Automotive gross margin compressed sharply after a series of price cuts aimed at defending volume against intensifying EV competition. Deliveries growth has decelerated from prior hypergrowth rates.",
      "The bull case increasingly hinges on non-auto optionality: full self-driving software, robotaxi, energy storage, and the Optimus humanoid robot. These are high-variance, long-dated bets not yet reflected in current earnings.",
      "Valuation remains a tech-like multiple on an auto-heavy earnings base, making the stock highly sensitive to narrative shifts and key-person risk around the CEO.",
      "Energy generation and storage is a quietly growing, higher-margin segment that could diversify the revenue base if deployment scales.",
      "Demand elasticity to interest rates is significant, as most buyers finance purchases; a higher-for-longer rate environment pressures affordability and order rates.",
    ],
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    themes: [
      "Azure cloud growth reaccelerated with AI workloads, and Copilot monetization across the Office and GitHub franchises is an early but promising attach-rate story layered onto a sticky enterprise base.",
      "The OpenAI partnership gives a front-row seat to frontier models, though the capital intensity of building out AI data centers is pressuring near-term free cash flow and raising depreciation.",
      "Recurring commercial bookings and a diversified enterprise software portfolio make revenue durable and relatively recession-resistant compared with consumer-tech peers.",
      "Antitrust scrutiny of the Activision acquisition and of cloud bundling practices is a manageable but persistent regulatory risk.",
    ],
  },
  {
    symbol: "AMZN",
    name: "Amazon",
    themes: [
      "AWS margins rebounded as enterprises optimized spend and resumed migrations, while AI services added a new growth vector. AWS remains the primary profit engine despite being a minority of revenue.",
      "Retail operating margin improved meaningfully on fulfillment-network regionalization and advertising, a high-margin segment that is now a material earnings contributor.",
      "Heavy capex for AI infrastructure and logistics weighs on near-term free cash flow, but management frames it as durable capacity investment.",
      "Regulatory and labor risks persist around marketplace practices and warehouse operations, though none appear near-term existential.",
    ],
  },
  {
    symbol: "GOOGL",
    name: "Alphabet",
    themes: [
      "Search remains a cash cow, but generative-AI answer engines pose a long-term disruption risk to the core query-and-click monetization model.",
      "Google Cloud turned profitable and is growing at a healthy clip, narrowing the gap with larger rivals and diversifying the earnings base away from advertising.",
      "Gemini model progress and integration across Workspace and Search are central to the bull case that Alphabet defends its position in an AI-mediated search world.",
      "Ongoing antitrust litigation around search distribution and ad-tech could force structural remedies, a tail risk that is difficult to quantify.",
    ],
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    themes: [
      "Ad revenue reaccelerated as AI-driven targeting and ranking improved monetization despite signal-loss headwinds from prior privacy changes. Operating discipline after the 'year of efficiency' lifted margins materially.",
      "Reality Labs continues to burn billions annually with an uncertain payoff timeline; the metaverse bet remains the principal drag on consolidated profitability.",
      "Family-of-apps engagement stayed resilient, and Reels monetization closed much of the gap with feed, easing an earlier cannibalization concern.",
      "Open-sourcing Llama models is a strategic wedge against rivals but does not directly monetize, making the AI return-on-investment harder to assess.",
    ],
  },
  {
    symbol: "AMD",
    name: "Advanced Micro Devices",
    themes: [
      "Data-center GPU traction with the MI300 line offers a credible second source to Nvidia, and a large total addressable market gives a long runway even at modest share.",
      "Server CPU share gains against Intel continued, supporting margin mix, while the PC and gaming segments remain cyclical and more exposed to consumer demand.",
      "The AI accelerator ramp is the swing factor for the multiple; execution against aggressive revenue targets will determine whether the premium valuation is justified.",
      "Supply allocation at leading-edge foundries and software-ecosystem maturity relative to CUDA are the key gating risks to share capture.",
    ],
  },
];

/**
 * Builds a flat list of notes. Some notes concatenate multiple themes so they
 * exceed the ~1000-char chunk size and split into multiple chunks, giving the
 * pgvector index a realistic mix of single- and multi-chunk notes.
 */
export function buildSeedNotes(): { symbol: string; body: string }[] {
  const notes: { symbol: string; body: string }[] = [];

  for (const c of COMPANIES) {
    // One short note per theme.
    for (const theme of c.themes) {
      notes.push({ symbol: c.symbol, body: `${c.name} (${c.symbol}): ${theme}` });
    }
    // A couple of long, multi-theme notes to force multi-chunk splitting.
    notes.push({
      symbol: c.symbol,
      body:
        `${c.name} (${c.symbol}) — consolidated thesis. ` +
        c.themes.join(" ") +
        " Net-net, the setup is a balance of durable franchise strength against valuation and execution risk that warrants close monitoring of forward guidance.",
    });
  }

  return notes;
}
