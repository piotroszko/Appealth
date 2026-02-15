"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import { Form } from "./form";
import Loader from "./loader";
import { buttonVariants } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function SignUpForm() {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible">
      <Card>
        <motion.div variants={fadeInUp}>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Create Account</CardTitle>
            <CardDescription>Get started with your free account</CardDescription>
          </CardHeader>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <CardContent>
            <Form
              inputs={{
                name: {
                  type: "text",
                  label: "Name",
                  defaultValue: "",
                  validator: z.string().min(2, "Name must be at least 2 characters"),
                },
                email: {
                  type: "text",
                  label: "Email",
                  defaultValue: "",
                  validator: z.email("Invalid email address"),
                },
                password: {
                  type: "password",
                  label: "Password",
                  defaultValue: "",
                  validator: z.string().min(8, "Password must be at least 8 characters"),
                },
              }}
              onSubmit={async (values) => {
                await authClient.signUp.email(
                  {
                    email: values.email,
                    password: values.password,
                    name: values.name,
                  },
                  {
                    onSuccess: () => {
                      router.push("/profile");
                      toast.success("Sign up successful");
                    },
                    onError: (error) => {
                      toast.error(error.error.message || error.error.statusText);
                    },
                  },
                );
              }}
              submitLabel="Sign Up"
              className="space-y-4"
            />
          </CardContent>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <CardFooter className="justify-center">
            <Link
              href="/auth/login"
              className={buttonVariants({
                variant: "link",
                className: "text-primary hover:text-primary/80",
              })}
            >
              Already have an account? Sign In
            </Link>
          </CardFooter>
        </motion.div>
      </Card>
    </motion.div>
  );
}
