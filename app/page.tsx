"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Scale,
  Gavel,
  Sparkles,
  FileSearch,
  Users,
} from "lucide-react";
import { TickerTape } from "./components/TickerTape";
import { VerdictCard } from "./components/VerdictCard";

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <TickerTape />
      <HowItWorks />
      <Manifesto />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-system/15 ring-1 ring-system/40">
            <Scale className="h-4 w-4 text-system" />
            <span
              className="absolute -inset-px rounded-lg"
              style={{ boxShadow: "var(--glow-system)", opacity: 0.4 }}
            />
          </div>
          <span className="font-mono text-sm font-semibold tracking-wide">
            JuryMind
          </span>
          <span className="ml-1 hidden rounded-md border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground sm:inline">
            v0.1 · Beta
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a className="transition hover:text-foreground" href="#how">
            How it works
          </a>
          <a className="transition hover:text-foreground" href="#manifesto">
            Manifesto
          </a>
          <a className="transition hover:text-foreground" href="#">
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button className="hidden rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground sm:inline">
            Sign in
          </button>
          <button className="group inline-flex items-center gap-1.5 rounded-md bg-system px-3.5 py-2 text-sm font-medium text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110">
            Enter Chambers
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-paper opacity-40" aria-hidden />
      <div className="absolute inset-0 gradient-hero" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-20 lg:grid-cols-[1fr_1.15fr] lg:gap-16 lg:pt-28">
        <div className="flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-bull opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Multi-agent deliberation engine
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Don&apos;t just trade.
            <br />
            <span className="bg-gradient-to-r from-foreground via-system to-bull bg-clip-text text-transparent">
              Deliberate.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground"
          >
            The first multi-agent financial jury that debates your investments
            before you make them. A Bull and a Bear argue. A Judge decides.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <button className="group inline-flex items-center justify-center gap-2 rounded-lg bg-system px-5 py-3 text-sm font-semibold text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110">
              Convene the Jury
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:bg-surface-elevated">
              See a sample verdict
            </button>
          </motion.div>

          <div className="mt-10 flex items-center gap-6">
            <Stat value="2.4s" label="Avg deliberation" />
            <Divider />
            <Stat value="94%" label="Verdict accuracy" />
            <Divider />
            <Stat value="12+" label="Sources / case" />
          </div>
        </div>

        {/* Verdict card */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
          className="relative"
        >
          <div className="animate-float">
            <VerdictCard
              tilt
              ticker="$NVDA"
              price="$1,142.83"
              change="+4.21%"
              changePositive
              verdict="BUY"
              confidence={0.94}
              sources={14}
              bullPoints={[
                { label: "Data-center revenue", detail: "+154% YoY · $22.6B run-rate" },
                { label: "Blackwell pipeline", detail: "Booked through FY26 · 80% margins" },
                { label: "CUDA moat", detail: "4M+ devs · zero credible alternative" },
                { label: "Hyperscaler capex", detail: "MSFT/META/GOOG guided +28%" },
              ]}
              bearPoints={[
                { label: "Concentration risk", detail: "Top-4 = 46% of revenue" },
                { label: "Valuation stretch", detail: "P/E 71x · 5y avg 48x" },
                { label: "China export curbs", detail: "$8B revenue at risk in '26" },
                { label: "Custom silicon", detail: "AWS Trainium, Google TPU ramp" },
              ]}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-xl font-semibold tabular-nums">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="h-8 w-px bg-border" />;
}

function HowItWorks() {
  const steps = [
    {
      icon: FileSearch,
      tone: "system",
      tag: "01 · Discovery",
      title: "We gather the evidence.",
      desc: "We scour your private notes (Prisma) and the live web (Tavily AI) to compile every relevant exhibit before opening arguments.",
    },
    {
      icon: Users,
      tone: "bull",
      tag: "02 · Deliberation",
      title: "The Bull and the Bear argue.",
      desc: "Two specialist agents debate pros and cons in parallel — backed by data, citing exhibits, no walls of text.",
    },
    {
      icon: Gavel,
      tone: "judge",
      tag: "03 · The Verdict",
      title: "A neutral Judge decides.",
      desc: "The Judge synthesizes the debate into a high-confidence Buy, Sell or Hold — with a transparent reasoning trail.",
    },
  ];

  return (
    <section id="how" className="relative border-t border-border/60 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 max-w-2xl">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-system">
            The Evidence Path
          </span>
          <h2 className="mt-3 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Three steps from question to verdict.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Every decision follows the same disciplined trial — no hallucinated
            confidence, no black box.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-surface/60 p-6 backdrop-blur transition hover:border-border/80 hover:bg-surface-elevated"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl transition group-hover:opacity-60"
                style={{ background: `var(--${s.tone})` }}
              />
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl ring-1"
                style={{
                  background: `color-mix(in oklab, var(--${s.tone}) 15%, transparent)`,
                  borderColor: `var(--${s.tone})`,
                }}
              >
                <s.icon
                  className="h-5 w-5"
                  style={{ color: `var(--${s.tone})` }}
                />
              </div>
              <div className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                {s.tag}
              </div>
              <h3 className="mt-2 text-xl font-semibold tracking-tight">
                {s.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section
      id="manifesto"
      className="relative border-t border-border/60 py-24"
    >
      <div className="absolute inset-0 grid-paper opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-judge">
          Order in the court
        </span>
        <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          The market is loud.
          <br />
          <span className="text-muted-foreground">A jury is structured.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          One model whispering an answer is a guess. Two adversaries arguing,
          judged by a third, is a process. JuryMind turns AI output into
          evidence — auditable, citable, defensible.
        </p>

        <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-border bg-surface/60 px-5 py-2 backdrop-blur">
          <Sparkles className="h-4 w-4 text-system" />
          <span className="text-sm text-muted-foreground">
            Now in private beta · invitations rolling weekly
          </span>
        </div>

        <div className="mt-8 flex justify-center">
          <button className="group inline-flex items-center gap-2 rounded-lg bg-system px-5 py-3 text-sm font-semibold text-system-foreground shadow-[var(--glow-system)] transition hover:brightness-110">
            Request access
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <Scale className="h-3.5 w-3.5 text-system" />
          <span>JuryMind © 2026 · Not financial advice</span>
        </div>
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <a className="hover:text-foreground" href="#">
            Privacy
          </a>
          <a className="hover:text-foreground" href="#">
            Terms
          </a>
          <a className="hover:text-foreground" href="#">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
