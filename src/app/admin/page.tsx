
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
import { collection } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { format } from 'date-fns';
import { DollarSign, ListOrdered, Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getQikinkOrders } from './actions';
import { QikinkOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/**
 * AdminDashboardPage serves as the main entry point for the admin panel.
 * It displays key statistics like total revenue, sales count, and customer count,
 * along with a list of recent orders. Data is fetched from both Firestore (for users)
 * and the Qikink API (for orders).
 * @returns {JSX.Element} The admin dashboard UI.
 */
export default function AdminDashboardPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [allOrders, setAllOrders] = useState<QikinkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoized Firestore query to fetch all users for the customer count.
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  // Fetches order data from the Qikink API on component mount.
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const result = await getQikinkOrders();
      if (result.success && result.orders) {
        setAllOrders(result.orders);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to load dashboard data',
          description: result.error || 'Could not load orders from Qikink.',
        });
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, [toast]);

  // Calculate total revenue from non-cancelled orders.
  const totalRevenue = allOrders
    .filter(order => order.status.toLowerCase() !== 'cancelled' && order.status.toLowerCase() !== 'on hold')
    .reduce((acc, order) => acc + parseFloat(order.total_order_value), 0);
  
  const totalSales = allOrders.length;
  const totalCustomers = users?.length || 0;
  // Get the 10 most recent orders.
  const recentOrders = allOrders.slice(0, 10);

   /**
   * Determines the visual variant for the status badge based on the order status string.
   * @param {string} status - The order status string from the API.
   * @returns {BadgeProps["variant"]} The corresponding variant for the Badge component.
   */
   const getStatusVariant = (status: string): BadgeProps["variant"] => {
    switch (status.toLowerCase()) {
      case 'live':
      case 'to be printed':
      case 'shipped':
        return 'default';
      case 'delivered':
      case 'archived':
        return 'outline';
      case 'cancelled':
      case 'on hold':
        return 'destructive';
      default:
        return 'secondary';
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
            <p className="text-xs text-muted-foreground">Based on non-cancelled orders</p>
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
            <p className="text-xs text-muted-foreground">Total orders placed via Qikink</p>
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
                    <TableRow key={order.order_id}>
                      <TableCell>
                        <div className="font-medium">{order.shipping.first_name || 'N/A'}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {order.order_id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_on), "PPP")}</TableCell>
                      <TableCell className="text-right font-medium">₹{parseFloat(order.total_order_value).toFixed(2)}</TableCell>
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
