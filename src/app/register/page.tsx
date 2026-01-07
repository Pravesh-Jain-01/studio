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
import { initiateEmailSignUp, useAuth, useUser } from '@/firebase';
import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  email: z.string().email({
    message: 'please enter a valid email.',
  }),
  password: z.string().min(6, {
    message: 'password must be at least 6 characters.',
  }),
});

export default function RegisterPage() {
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

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(() => {
        initiateEmailSignUp(auth, values.email, values.password);
        toast({
          title: 'Registration initiated!',
          description:
            "You'll be signed in shortly. Welcome to the community!",
        });
    });
  }

  if (isUserLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-16 md:py-24 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (user) {
    router.push('/');
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          create your account
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          join our community of feelers.
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
                  <FormLabel>email</FormLabel>
                  <FormControl>
                    <Input placeholder="your email" {...field} />
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
                  <FormLabel>password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="your password" {...field} />
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
              {isPending ? 'creating account...' : 'create account'}
            </Button>
          </form>
        </Form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            log in
          </Link>
        </p>
      </div>
    </div>
  );
}
