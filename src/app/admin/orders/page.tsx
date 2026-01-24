
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
import { useEffect, useState } from 'react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getQikinkOrders } from '../actions';
import { QikinkOrder } from '@/lib/types';

/**
 * AdminOrdersPage displays a comprehensive list of all customer orders fetched from the Qikink API.
 * It provides a view for administrators to monitor order status, customer details, and shipping information.
 * @returns {JSX.Element} The admin orders page UI.
 */
export default function AdminOrdersPage() {
  const [allOrders, setAllOrders] = useState<QikinkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetches all orders from the Qikink API on component mount.
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const result = await getQikinkOrders();
      if (result.success && result.orders) {
        setAllOrders(result.orders);
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to fetch orders',
          description: result.error || 'Could not load orders from Qikink.',
        });
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, [toast]);


  /**
   * Determines the visual variant for the status badge based on the order status text.
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
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Orders</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage all orders from your fulfillment provider.
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            A list of all orders placed in your store, fetched from Qikink.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Tracking</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading customer orders from Qikink...
                    </TableCell>
                  </TableRow>
                ) : allOrders.length > 0 ? (
                  allOrders.map(order => (
                    <TableRow key={order.order_id}>
                      <TableCell>{format(new Date(order.created_on), 'PPP')}</TableCell>
                      <TableCell>{order.shipping.first_name || order.order_id}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                      </TableCell>
                      <TableCell>{order.line_items.reduce((acc, item) => acc + parseInt(item.quantity, 10), 0)}</TableCell>
                      <TableCell className="font-medium">₹{parseFloat(order.total_order_value).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {order.shipping.tracking_link ? (
                            <Button variant="outline" size="sm" asChild>
                                <a href={order.shipping.tracking_link} target="_blank" rel="noopener noreferrer">
                                    <Truck className="mr-2" /> Track
                                </a>
                            </Button>
                        ) : order.shipping.awb ? (
                           <span className="text-xs text-muted-foreground">AWB: {order.shipping.awb}</span>
                        ) : (
                           <span className="text-xs text-muted-foreground">Not Shipped</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No customer orders found yet.
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
