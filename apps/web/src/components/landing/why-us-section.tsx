"use client";

import { motion } from "framer-motion";
import { Globe, Search, ShieldCheck } from "lucide-react";

import { fadeInUp, staggerContainer } from "./motion";

const reasons = [
  {
    icon: ShieldCheck,
    title: "Security-First by Design",
    description:
      "Most website testing tools bolt on a single SSL check and call it security. We built Appealth around 20+ dedicated security checks — from OWASP Top 10 scanning and header analysis to API vulnerability testing.",
  },
  {
    icon: Search,
    title: "SEO & Performance Built In",
    description:
      "On top of deep security coverage, every plan includes Core Web Vitals analysis, HTML validation, broken link detection, and PageSpeed audits — so you never need a separate SEO tool again.",
  },
  {
    icon: Globe,
    title: "Complete Domain Intelligence",
    description:
      "DNS health checks, SSL/TLS monitoring, domain crawling, and uptime tracking give you full visibility into your domain's infrastructure — all from a single dashboard.",
  },
];

export function WhyUsSection() {
  return (
    <section id="why-us" className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          className="mb-12 text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Why Appealth?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Other tools give you a surface-level scan. We give you a full diagnosis.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-8 md:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {reasons.map((reason) => (
            <motion.div
              key={reason.title}
              variants={fadeInUp}
              className="flex flex-col gap-4 rounded-xl border bg-card p-6"
            >
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <reason.icon className="size-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{reason.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{reason.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
