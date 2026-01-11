
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MoreHorizontal, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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

type OrderStatus = 'placed' | 'shipped' | 'delivered' | 'cancelled';

export default function AdminOrdersPage() {
  const firestore = useFirestore();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
      orders.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setAllOrders(orders);
      setIsLoading(false);
    };

    fetchAllOrders();
  }, [firestore, users, usersLoading]);

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    if (!firestore) return;

    const orderDocRef = doc(firestore, 'users', order.userId, 'orders', order.id);

    try {
      await updateDoc(orderDocRef, { status: newStatus });
      // Update local state to reflect the change immediately
      setAllOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id && o.userId === order.userId ? { ...o, status: newStatus } : o
        )
      );
      toast({
        title: 'Order Updated',
        description: `Order #${order.id.slice(0, 6)} has been marked as ${newStatus}.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the order status.',
      });
    }
  };


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
          <ScrollArea className="h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Loading customer orders...
                    </TableCell>
                  </TableRow>
                ) : allOrders.length > 0 ? (
                  allOrders.map(order => (
                    <TableRow key={`${order.userId}-${order.id}`}>
                      <TableCell>{format(order.createdAt.toDate(), 'PPP')}</TableCell>
                      <TableCell>{order.userEmail || order.userId}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(order.status)} className="capitalize">{order.status}</Badge>
                      </TableCell>
                      <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                      <TableCell className="font-medium">₹{order.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Update Status</DropdownMenuLabel>
                              {(['placed', 'shipped', 'delivered', 'cancelled'] as OrderStatus[]).map(status => (
                                  <DropdownMenuItem 
                                      key={status}
                                      onClick={() => handleStatusChange(order, status)}
                                      disabled={order.status === status}
                                      className="capitalize"
                                  >
                                      {status}
                                  </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
