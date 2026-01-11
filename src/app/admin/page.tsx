
'use client';

import {
  Card,
  CardContent,
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
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DollarSign, ListOrdered, Users } from 'lucide-react';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Order {
  id: string;
  userId: string;
  userEmail: string;
  items: any[];
  total: number;
  status: 'placed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Timestamp;
}

export default function AdminDashboardPage() {
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
              userEmail: user.email,
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

  const totalRevenue = allOrders
    .filter(order => order.status === 'delivered' || order.status === 'shipped' || order.status === 'placed')
    .reduce((acc, order) => acc + order.total, 0);
  
  const totalSales = allOrders.length;
  const totalCustomers = users?.length || 0;
  const recentOrders = allOrders.slice(0, 10); // Increased to show more in scroll view

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
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">Sum of all successful sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ListOrdered className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? (
              <div className="h-8 w-12 bg-muted animate-pulse rounded-md" />
            ) : (
              <div className="text-2xl font-bold">+{totalSales}</div>
            )}
            <p className="text-xs text-muted-foreground">Total orders placed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {usersLoading ? (
                 <div className="h-8 w-12 bg-muted animate-pulse rounded-md" />
            ) : (
                 <div className="text-2xl font-bold">+{totalCustomers}</div>
            )}
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                          <TableCell colSpan={4} className="py-2">
                              <div className="h-6 bg-muted animate-pulse rounded-md" />
                          </TableCell>
                      </TableRow>
                  ))
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={`${order.userId}-${order.id}`}>
                      <TableCell>
                        <div className="font-medium">{order.userEmail}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {order.userId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                      </TableCell>
                      <TableCell>{format(order.createdAt.toDate(), "PPP")}</TableCell>
                      <TableCell className="text-right font-medium">₹{order.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No orders have been placed yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

    </div>
  );
}
