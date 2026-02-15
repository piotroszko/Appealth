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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function SignInForm() {
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
            <CardTitle className="text-xl font-bold">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <CardContent>
            <Form
              inputs={{
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
                await authClient.signIn.email(
                  {
                    email: values.email,
                    password: values.password,
                  },
                  {
                    onSuccess: () => {
                      router.push("/app");
                      toast.success("Sign in successful");
                    },
                    onError: (error) => {
                      toast.error(error.error.message || error.error.statusText);
                    },
                  },
                );
              }}
              submitLabel="Sign In"
              className="space-y-4"
            />
          </CardContent>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <CardFooter className="justify-center">
            <Link
              href="/auth/register"
              className={buttonVariants({
                variant: "link",
                className: "text-primary hover:text-primary/80",
              })}
            >
              Need an account? Sign Up
            </Link>
          </CardFooter>
        </motion.div>
      </Card>
    </motion.div>
  );
}
