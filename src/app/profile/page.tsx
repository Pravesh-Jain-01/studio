'use client';

import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useMemo, useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useTransition } from 'react';

const profileSchema = z.object({
  username: z.string().min(3, {
    message: 'username must be at least 3 characters.',
  }),
  dob: z.date({
    required_error: 'a date of birth is required.',
  }),
  phoneNumber: z.string().min(10, {
    message: 'please enter a valid phone number.',
  }),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
});


export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });
  
  useEffect(() => {
    if (userData) {
      form.reset({
        username: userData.username,
        phoneNumber: userData.phoneNumber,
        gender: userData.gender,
        dob: userData.dob ? parseISO(userData.dob) : new Date(),
      });
    }
  }, [userData, form]);


  if (isUserLoading || isProfileLoading) {
    return <div className="container py-12 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="container py-12 text-center">Please log in to view your profile.</div>;
  }
  
  function onSubmit(values: z.infer<typeof profileSchema>) {
    startTransition(() => {
        if (!userDocRef) return;

        const { username, ...rest } = values;

        const updatedData = {
            ...rest,
            dob: values.dob.toISOString().split('T')[0], // Store as YYYY-MM-DD
        };

        updateDocumentNonBlocking(userDocRef, updatedData);

        toast({
            title: 'Profile Updated!',
            description: 'Your information has been successfully saved.',
        });
        setIsEditing(false);
    });
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          {isEditing ? 'edit your profile' : 'your profile'}
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          {isEditing ? 'update your information below.' : "here's your information."}
        </p>
      </div>
      {userData ? (
        <div className="bg-secondary p-8 rounded-lg relative">
            {!isEditing ? (
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Username</p>
                        <p className="text-lg font-semibold">{userData.username}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-lg font-semibold">{userData.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="text-lg font-semibold">{userData.dob ? format(parseISO(userData.dob), 'PPP') : 'Not set'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Phone Number</p>
                        <p className="text-lg font-semibold">{userData.phoneNumber}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="text-lg font-semibold capitalize">{userData.gender}</p>
                    </div>
                    <Button onClick={() => setIsEditing(true)} className="absolute top-6 right-6">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </div>
            ) : (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-lg font-semibold text-muted-foreground/80">{userData.email} (cannot be changed)</p>
                        </div>
                        <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>username</FormLabel>
                                <FormControl>
                                    <Input placeholder="your username" {...field} className="bg-background" readOnly />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                <FormLabel>date of birth</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                        variant={'outline'}
                                        className={cn(
                                            'w-full pl-3 text-left font-normal bg-background',
                                            !field.value && 'text-muted-foreground'
                                        )}
                                        >
                                        {field.value ? (
                                            format(field.value, 'PPP')
                                        ) : (
                                            <span>pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) =>
                                        date > new Date() || date < new Date('1900-01-01')
                                        }
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
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
                                    <Input placeholder="your phone number" {...field} className="bg-background"/>
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
                                    <SelectTrigger className="bg-background">
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
                        <div className="flex gap-4">
                            <Button type="button" variant="outline" onClick={() => setIsEditing(false)} className="w-full">
                                <X className="mr-2 h-4 w-4" /> Cancel
                            </Button>
                            <Button type="submit" disabled={isPending} className="w-full">
                                {isPending ? 'saving...' : 'save changes'}
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
      ) : (
        <p className="text-center">Could not load profile data.</p>
      )}
    </div>
  );
}
