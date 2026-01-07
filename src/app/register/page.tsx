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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useUser, setDocumentNonBlocking, useFirestore } from '@/firebase';
import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';

const formSchema = z.object({
  email: z.string().email({
    message: 'please enter a valid email.',
  }),
  password: z.string().min(6, {
    message: 'password must be at least 6 characters.',
  }),
  age: z.coerce.number().min(13, {
    message: 'you must be at least 13 years old.',
  }),
  phoneNumber: z.string().min(10, {
    message: 'please enter a valid phone number.',
  }),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
});

export default function RegisterPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      phoneNumber: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        const user = userCredential.user;

        if (user && firestore) {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userData = {
            id: user.uid,
            email: values.email,
            age: values.age,
            phoneNumber: values.phoneNumber,
            gender: values.gender,
          };
          setDocumentNonBlocking(userDocRef, userData, { merge: true });
        }

        toast({
          title: 'Registration successful!',
          description: "You've been signed in. Welcome to the community!",
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message || 'There was a problem with your request.',
        });
      }
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
                    <Input
                      type="password"
                      placeholder="your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="your age" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>phone number</FormLabel>
                  <FormControl>
                    <Input placeholder="your phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="select your gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            log in
          </Link>
        </p>
      </div>
    </div>
  );
}
