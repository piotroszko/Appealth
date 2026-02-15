"use client";

import { motion } from "framer-motion";
import { Activity, ArrowRight, CheckCircle, Shield } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { fadeInRight, fadeInUp, staggerContainer } from "./motion";

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
                10+ Diagnostic Modules
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
            <div className="rounded-xl border bg-card p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <div className="size-3 rounded-full bg-primary" />
                <span className="text-sm font-medium">Health Report</span>
                <span className="ml-auto text-xs text-muted-foreground">example.com</span>
              </div>

              <div className="grid gap-3">
                {[
                  { label: "Security", score: 94, icon: Shield },
                  { label: "Performance", score: 87, icon: Activity },
                  { label: "SEO", score: 96, icon: CheckCircle },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-lg border bg-background p-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                      <item.icon className="size-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{item.label}</span>
                        <span className="text-xs font-bold text-primary">{item.score}/100</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.score}%` }}
                          transition={{
                            duration: 1,
                            delay: 0.8,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                <span className="text-xs font-medium">Overall Health</span>
                <span className="text-lg font-bold text-primary">A+</span>
              </div>
            </div>

            {/* Floating accent card */}
            <motion.div
              className="absolute -bottom-4 -left-4 rounded-lg border bg-card p-3 shadow-md"
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
