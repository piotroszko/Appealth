"use client";

import { motion } from "framer-motion";
import { Activity, FileCode, Shield, TestTubes } from "lucide-react";

import { fadeInUp, staggerContainer } from "./motion";

const stats = [
  { icon: TestTubes, label: "10+ Diagnostic Modules" },
  { icon: Shield, label: "20+ Security Checks" },
  { icon: Activity, label: "Real-time Monitoring" },
  { icon: FileCode, label: "W3C Validation" },
];

export function TrustSection() {
  return (
    <section className="border-y bg-secondary/50 py-10">
      <motion.div
        className="container mx-auto max-w-6xl px-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
