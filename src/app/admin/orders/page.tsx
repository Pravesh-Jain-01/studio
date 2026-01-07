'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collectionGroup, query, orderBy } from 'firebase/firestore';
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
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useMemo } from 'react';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const { user: adminUser } = useUser();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Use a collection group query to get all orders from all users
    return query(collectionGroup(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allOrders, isLoading } = useCollection(ordersQuery);
  
  const customerOrders = useMemo(() => {
    if (!allOrders || !adminUser) return [];
    return allOrders.filter((order: any) => order.userId !== adminUser.uid);
  }, [allOrders, adminUser]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'placed':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'delivered':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all customer orders.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer Orders</CardTitle>
          <CardDescription>
            A list of all orders placed by your customers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : customerOrders && customerOrders.length > 0 ? (
                customerOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.shippingDetails?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {order.createdAt ? format(order.createdAt.toDate(), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)} className="capitalize">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.items?.length || 0}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{order.total?.toFixed(2) || '0.00'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No customer orders found.
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
