import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import { Form } from "./form";
import Loader from "./loader";
import { buttonVariants } from "./ui/button";

export default function SignUpForm() {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
      <h1 className="mb-6 text-center text-3xl font-bold">Create Account</h1>

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
      >
        <div className="mt-4 text-center">
          <Link
            href="/auth/login"
            className={buttonVariants({
              variant: "link",
              className: "text-indigo-600 hover:text-indigo-800",
            })}
          >
            Already have an account? Sign In
          </Link>
        </div>
      </Form>
    </div>
  );
}
