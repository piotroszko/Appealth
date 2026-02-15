"use client";

import { motion } from "framer-motion";
import {
  Activity,
  FileCode,
  Gauge,
  Globe,
  Link2,
  Lock,
  Network,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { fadeInUp, staggerContainer } from "./motion";

const features = [
  {
    icon: Globe,
    metaphor: "Full-Body Scan",
    name: "Domain Crawling",
    description: "Deep crawl your entire site to discover pages, assets, and structural issues.",
  },
  {
    icon: ShieldCheck,
    metaphor: "Immune System Check",
    name: "API Security",
    description: "Test API endpoints for vulnerabilities, auth bypasses, and misconfigurations.",
  },
  {
    icon: Network,
    metaphor: "Nervous System Analysis",
    name: "DNS Health",
    description: "Verify DNS records, propagation, and configuration for optimal resolution.",
  },
  {
    icon: Lock,
    metaphor: "Vital Signs Monitor",
    name: "SSL/TLS",
    description: "Check certificate validity, chain integrity, and cipher suite strength.",
  },
  {
    icon: FileCode,
    metaphor: "Structural Examination",
    name: "HTML Validation",
    description: "Validate markup against W3C standards to ensure cross-browser compatibility.",
  },
  {
    icon: Gauge,
    metaphor: "Stress Test",
    name: "PageSpeed",
    description: "Measure Core Web Vitals and get actionable performance recommendations.",
  },
  {
    icon: Link2,
    metaphor: "Circulation Check",
    name: "Broken Links",
    description: "Find dead links, redirect chains, and orphaned pages across your site.",
  },
  {
    icon: Activity,
    metaphor: "Heart Rate Monitor",
    name: "Uptime Monitoring",
    description: "Continuous monitoring with instant alerts when your site goes down.",
  },
  {
    icon: Zap,
    metaphor: "Emergency Response",
    name: "Security Runner",
    description: "Automated security scanning for XSS, injection, and OWASP Top 10 risks.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          className="mb-12 text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Every Test Your Website Needs
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            From security audits to performance benchmarks, our diagnostic modules cover every
            aspect of your website&apos;s health.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature) => (
            <motion.div key={feature.name} variants={fadeInUp}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{feature.metaphor}</CardTitle>
                  <p className="text-xs font-medium text-primary">{feature.name}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
