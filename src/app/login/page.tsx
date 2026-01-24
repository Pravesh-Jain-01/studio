
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { initiateEmailSignIn, useAuth, useUser } from '@/firebase';
import { useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Zod schema for login form validation.
const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

/**
 * LoginPage provides a form for users to sign in with their email and password.
 * It handles form submission, authentication with Firebase, and provides user feedback.
 * @returns {JSX.Element} The login page UI.
 */
export default function LoginPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Effect to redirect authenticated users away from the login page.
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  /**
   * Handles the form submission for user login.
   * @param {z.infer<typeof formSchema>} values - The validated form values.
   */
  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      // Use a helper function that returns success/error status for better UI feedback.
      const result = await initiateEmailSignIn(auth, values.email, values.password);
      if (result.success) {
        toast({
          title: 'Login Successful!',
          description: "You'll be redirected shortly.",
        });
        // The onAuthStateChanged listener in the provider will handle the redirect.
      } else if (result.error?.code === 'auth/invalid-credential') {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: "Incorrect details. If you're a new user, please register first.",
        });
      } else {
         toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: result.error?.message || "An unexpected error occurred.",
        });
      }
    });
  }

  // Display a loading state while checking auth status or if user is already logged in.
  if (isUserLoading || user) {
    return (
      <div className="container max-w-2xl mx-auto py-16 md:py-24 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Welcome Back
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          Sign in to your account to continue.
        </p>
      </div>
      <div className="bg-secondary p-8 rounded-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
              size="lg"
            >
              {isPending ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
