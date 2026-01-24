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
 * @interface ContactMessage
 * Defines the structure for a message submitted via the contact form.
 */
interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Timestamp;
}

/**
 * AdminMessagesPage displays all messages submitted through the contact form.
 * It fetches the data from the 'contact-messages' collection in Firestore.
 * @returns {JSX.Element} The admin page for viewing contact messages.
 */
export default function AdminMessagesPage() {
  const firestore = useFirestore();

  // Memoized Firestore query to fetch all contact messages, ordered by creation date.
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'contact-messages'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: messages, isLoading } = useCollection<ContactMessage>(messagesQuery);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Messages</h1>
          <p className="mt-1 text-muted-foreground">
            Messages submitted by visitors on your website.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            A list of all messages from the contact form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Loading messages...
                    </TableCell>
                  </TableRow>
                ) : messages && messages.length > 0 ? (
                  messages.map(message => (
                    <TableRow key={message.id}>
                      <TableCell className="w-[150px] align-top text-sm text-muted-foreground">
                        {message.createdAt ? format(message.createdAt.toDate(), 'PPP p') : 'N/A'}
                      </TableCell>
                      <TableCell className="w-[250px] align-top">
                        <p className="font-medium">{message.name}</p>
                        <p className="text-sm text-muted-foreground">{message.email}</p>
                      </TableCell>
                      <TableCell className="whitespace-pre-line">{message.message}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No messages found.
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
