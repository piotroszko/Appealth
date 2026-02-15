"use client";

import { motion } from "framer-motion";
import { BadgeCheck, ClipboardList, FileCheck, Stethoscope } from "lucide-react";

import { fadeInUp, staggerContainer } from "./motion";

const steps = [
  {
    icon: BadgeCheck,
    title: "Verify Ownership",
    description: "Quickly confirm you own the website with a simple DNS or file check.",
  },
  {
    icon: ClipboardList,
    title: "Book Your Appointment",
    description: "Enter your URL and select which diagnostic modules to run.",
  },
  {
    icon: Stethoscope,
    title: "Run Diagnostics",
    description: "Our automated systems run all selected tests in parallel.",
  },
  {
    icon: FileCheck,
    title: "Review Your Results",
    description: "Get a detailed health report with actionable recommendations.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-secondary/30 py-20 md:py-28">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div
          className="mb-12 text-center"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">How It Works</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Four simple steps to a healthier website.
          </p>
        </motion.div>

        <motion.div
          className="relative grid gap-12 md:grid-cols-4 md:gap-8"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className="pointer-events-none absolute left-0 right-0 top-8 hidden h-px bg-border md:block" />

          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={fadeInUp}
              className="relative flex flex-col items-center text-center"
            >
              <div className="relative z-10 mb-4 flex size-16 items-center justify-center rounded-full border-2 border-primary bg-background">
                <step.icon className="size-7 text-primary" />
              </div>
              <span className="absolute left-1/2 top-0 z-20 flex size-6 -translate-x-1/2 -translate-y-2 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {index + 1}
              </span>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
