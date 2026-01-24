
'use client';

import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { useMemo, useState, useEffect, useTransition, ChangeEvent } from 'react';
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
import { Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Zod schema for validating the user profile form.
const profileSchema = z.object({
  name: z.string().min(3, {
    message: 'Name must be at least 3 characters.',
  }),
  dob: z.string().regex(/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/, {
    message: 'Date must be in DD/MM/YYYY format.',
  }),
  phoneNumber: z.string().length(10, {
    message: 'Please enter a valid 10-digit phone number.',
  }),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']),
});


/**
 * ProfilePage allows authenticated users to view and edit their personal information.
 * It toggles between a view mode and an edit mode.
 * @returns {JSX.Element} The user profile page UI.
 */
export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  // Memoized Firestore document reference to the current user's profile.
  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isProfileLoading } = useDoc(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  });
  
  // Effect to populate the form with user data when it loads or when edit mode is entered.
  useEffect(() => {
    if (userData) {
      let displayDob = '';
      if (userData.dob && userData.dob.includes('-')) {
          const [year, month, day] = userData.dob.split('-');
          displayDob = `${day}/${month}/${year}`;
      } else {
          displayDob = userData.dob || '';
      }

      form.reset({
        name: userData.name || '',
        phoneNumber: userData.phoneNumber || '',
        gender: userData.gender,
        dob: displayDob,
      });
    }
  }, [userData, form, isEditing]); // Rerun when userData loads or isEditing changes.


  if (isUserLoading || isProfileLoading) {
    return <div className="container py-12 text-center">Loading...</div>;
  }

  if (!user) {
    return <div className="container py-12 text-center">Please log in to view your profile.</div>;
  }
  
  /**
   * Handles the submission of the profile update form.
   * @param {z.infer<typeof profileSchema>} values - The validated form values.
   */
  function onSubmit(values: z.infer<typeof profileSchema>) {
    startTransition(() => {
        if (!userDocRef) return;

        // Convert date from DD/MM/YYYY to YYYY-MM-DD for storage.
        const [day, month, year] = values.dob.split('/');
        const formattedDob = `${year}-${month}-${day}`;

        const updatedData = {
            name: values.name,
            phoneNumber: values.phoneNumber,
            gender: values.gender,
            dob: formattedDob,
        };

        // Use a non-blocking update for a smoother user experience.
        updateDocumentNonBlocking(userDocRef, updatedData);

        toast({
            title: 'Profile Updated!',
            description: 'Your information has been successfully saved.',
        });
        setIsEditing(false);
    });
  }

  /**
   * Formats the date of birth for display in view mode.
   * @returns {string} The formatted date string (DD/MM/YYYY) or 'Not set'.
   */
  const displayDobInViewMode = (): string => {
    if (!userData?.dob) return 'Not set';
    if (userData.dob.includes('-')) {
        const [year, month, day] = userData.dob.split('-');
        return `${day}/${month}/${year}`;
    }
    return userData.dob;
  };

  /**
   * Handles changes to the Date of Birth input field, auto-formatting the input.
   * @param {ChangeEvent<HTMLInputElement>} e - The input change event.
   */
  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.substring(0, 8);
    if (value.length > 4) value = `${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`;
    else if (value.length > 2) value = `${value.slice(0, 2)}/${value.slice(2)}`;
    form.setValue('dob', value);
  };

  return (
    <div className="container max-w-2xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          {isEditing ? 'Edit Your Profile' : 'Your Profile'}
        </h1>
        <p className="mt-4 text-muted-foreground md:text-lg">
          {isEditing ? 'Update your information below.' : "Here's your information."}
        </p>
      </div>
      {userData ? (
        <div className="bg-secondary p-8 rounded-lg relative">
            {!isEditing ? (
                // View Mode
                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Name</p>
                        <p className="text-lg font-semibold">{userData.name || 'Not set'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="text-lg font-semibold">{userData.email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Date of Birth</p>
                        <p className="text-lg font-semibold">{displayDobInViewMode()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Phone Number</p>
                        <p className="text-lg font-semibold">{userData.phoneNumber || 'Not set'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Gender</p>
                        <p className="text-lg font-semibold capitalize">{userData.gender || 'Not set'}</p>
                    </div>
                    <Button onClick={() => setIsEditing(true)} className="absolute top-6 right-6">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </div>
            ) : (
                // Edit Mode
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="text-lg font-semibold text-muted-foreground/80">{userData.email} (cannot be changed)</p>
                        </div>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your name" {...field} className="bg-background" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="DD/MM/YYYY"
                                        {...field}
                                        onChange={handleDobChange}
                                        maxLength={10}
                                        className="bg-background"
                                    />
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
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your phone number" {...field} className="bg-background"/>
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
                                <FormLabel>Gender</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                    <SelectTrigger className="bg-background">
                                        <SelectValue placeholder="Select your gender" />
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
                                {isPending ? 'Saving...' : 'Save Changes'}
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
