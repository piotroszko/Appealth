"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, ArrowRight, CheckCircle, Globe, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";

import { fadeInRight, fadeInUp, staggerContainer } from "./motion";

const sites = [
  {
    url: "acme-store.com",
    scores: { Security: 94, Performance: 87, SEO: 96 },
    grade: "A+",
  },
  {
    url: "blogify.io",
    scores: { Security: 72, Performance: 91, SEO: 84 },
    grade: "B+",
  },
  {
    url: "dash-analytics.dev",
    scores: { Security: 88, Performance: 65, SEO: 79 },
    grade: "B",
  },
  {
    url: "quickpay.app",
    scores: { Security: 98, Performance: 93, SEO: 90 },
    grade: "A+",
  },
];

const metricIcons = {
  Security: Shield,
  Performance: Activity,
  SEO: CheckCircle,
} as const;

function HealthReportCard() {
  const [index, setIndex] = useState(0);
  const site = sites[index];

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % sites.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-lg">
      {/* Header with URL */}
      <div className="mb-4 flex items-center gap-2">
        <div className="size-3 rounded-full bg-primary" />
        <span className="text-sm font-medium">Health Report</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={site.url}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="ml-auto flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2 py-0.5 text-sm font-medium text-primary"
          >
            <Globe className="size-3" />
            {site.url}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Metrics */}
      <div className="grid gap-3">
        {(Object.entries(site.scores) as [keyof typeof metricIcons, number][]).map(
          ([label, score]) => {
            const Icon = metricIcons[label];
            return (
              <div key={label} className="flex items-center gap-3 rounded-lg border bg-background p-3">
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                  <Icon className="size-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{label}</span>
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={`${site.url}-${label}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-bold text-primary"
                      >
                        {score}/100
                      </motion.span>
                    </AnimatePresence>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            );
          },
        )}
      </div>

      {/* Grade */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
        <span className="text-xs font-medium">Overall Health</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={`grade-${site.url}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.25 }}
            className="text-lg font-bold text-primary"
          >
            {site.grade}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Text content */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeInUp}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
                <Activity className="size-3" />
                9 Diagnostic Modules
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl"
            >
              Your Website&apos;s Health Checkup <span className="text-primary">Starts Here</span>
            </motion.h1>

            <motion.p variants={fadeInUp} className="max-w-lg text-lg text-muted-foreground">
              Comprehensive diagnostics for your website&mdash;security audits, performance tests,
              SEO checks, and uptime monitoring. All in one place.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-3">
              <Link href="/login" className={buttonVariants({ size: "lg" })}>
                Start Free Diagnosis
                <ArrowRight className="size-4" />
              </Link>
              <a href="#features" className={buttonVariants({ variant: "outline", size: "lg" })}>
                See All Tests
              </a>
            </motion.div>
          </motion.div>

          {/* Decorative health dashboard mockup */}
          <motion.div
            variants={fadeInRight}
            initial="hidden"
            animate="visible"
            className="relative hidden lg:block"
          >
            <HealthReportCard />

            {/* Floating accent card */}
            <motion.div
              className="absolute -top-6 -right-3 rounded-lg border bg-card p-3 shadow-md"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2, duration: 0.4 }}
            >
              <div className="flex items-center gap-2">
                <div className="size-2 animate-pulse rounded-full bg-primary" />
                <span className="text-xs font-medium">Monitoring Active</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
