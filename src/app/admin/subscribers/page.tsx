'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

/**
 * @interface NewsletterSubscriber
 * Defines the structure for an email subscribed to the newsletter.
 */
interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: Timestamp;
}

/**
 * AdminSubscribersPage displays all emails subscribed to the newsletter.
 * It fetches the data from the 'newsletter-subscribers' collection in Firestore.
 * @returns {JSX.Element} The admin page for viewing newsletter subscribers.
 */
export default function AdminSubscribersPage() {
  const firestore = useFirestore();

  // Memoized Firestore query to fetch all subscribers, ordered by subscription date.
  const subscribersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'newsletter-subscribers'), orderBy('subscribedAt', 'desc'));
  }, [firestore]);

  const { data: subscribers, isLoading } = useCollection<NewsletterSubscriber>(subscribersQuery);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Newsletter Subscribers</h1>
          <p className="mt-1 text-muted-foreground">
            Your community of followers who have opted in for updates.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Subscriber List</CardTitle>
          <CardDescription>
            A list of all email addresses subscribed to your newsletter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Address</TableHead>
                  <TableHead className="text-right">Subscription Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      Loading subscribers...
                    </TableCell>
                  </TableRow>
                ) : subscribers && subscribers.length > 0 ? (
                  subscribers.map(subscriber => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                          {subscriber.subscribedAt ? format(subscriber.subscribedAt.toDate(), 'PPP p') : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No subscribers yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  );
}
