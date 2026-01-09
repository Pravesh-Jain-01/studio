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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, collectionGroup, query, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Order {
  id: string;
  userId: string;
  userEmail: string; // Add userEmail to the Order type
  items: any[];
  total: number;
  status: 'placed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Timestamp;
}

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  useEffect(() => {
    if (!firestore || usersLoading) return;

    const fetchAllOrders = async () => {
      setIsLoading(true);
      const orders: Order[] = [];
      if (users) {
        for (const user of users) {
          const ordersQuery = query(collection(firestore, 'users', user.id, 'orders'), orderBy('createdAt', 'desc'));
          const ordersSnapshot = await getDocs(ordersQuery);
          ordersSnapshot.forEach(doc => {
            orders.push({ 
              id: doc.id,
              userId: user.id,
              userEmail: user.email, // Assume user object has email
              ...(doc.data() as Omit<Order, 'id' | 'userId' | 'userEmail'>)
            });
          });
        }
      }
      // Sort all orders globally by creation date
      orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setAllOrders(orders);
      setIsLoading(false);
    };

    fetchAllOrders();
  }, [firestore, users, usersLoading]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed': return 'default';
      case 'shipped': return 'secondary';
      case 'delivered': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };


  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Orders</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all orders from your customers.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            A list of all orders placed in your store.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                 <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading customer orders...
                  </TableCell>
                </TableRow>
              ) : allOrders.length > 0 ? (
                allOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{format(order.createdAt.toDate(), 'PPP')}</TableCell>
                    <TableCell>{order.userEmail || order.userId}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                    </TableCell>
                    <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                    <TableCell className="text-right font-medium">₹{order.total.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No customer orders found yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
