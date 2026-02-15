"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { fadeInUp, staggerContainer } from "./motion";

export function CtaSection() {
  return (
    <section className="bg-primary py-20 text-primary-foreground md:py-28">
      <motion.div
        className="container mx-auto max-w-3xl px-4 text-center"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.h2
          variants={fadeInUp}
          className="text-3xl font-bold tracking-tight dark:text-white md:text-4xl"
        >
          Ready for Your Website&apos;s First Checkup?
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mx-auto mt-4 max-w-xl text-primary-foreground/80 dark:text-white/80"
        >
          Start diagnosing your website for free. No credit card required.
        </motion.p>
        <motion.div variants={fadeInUp} className="mt-8">
          <Link
            href="/auth/register"
            className={buttonVariants({
              size: "lg",
              variant: "secondary",
              className: "text-sm font-semibold px-5 h-10",
            })}
          >
            Start Free Diagnosis
            <ArrowRight className="size-4" />
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
