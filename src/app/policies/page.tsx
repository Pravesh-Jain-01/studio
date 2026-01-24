import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PoliciesPage() {
  return (
    <div className="container max-w-4xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Our Policies</h1>
        <p className="mt-4 text-muted-foreground md:text-lg">The rules of the game. Clear and fair.</p>
      </div>

      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="returns">Returns & Cancellations</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        <div className="mt-8">
            <TabsContent value="shipping" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Shipping Policy</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>We ship our performance gear all across India.</p>
                <ul className="list-disc pl-5 space-y-2">
                <li>Orders are dispatched within 2-4 working days.</li>
                <li>After dispatch, delivery typically takes another 2-9 working days depending on your location.</li>
                <li>Cash on delivery (COD) is available for most locations.</li>
                <li>You'll receive an email with a tracking link once your order is on its way.</li>
                </ul>
                <p>We're training hard to bring Podium Wear to international athletes soon.</p>
            </div>
            </TabsContent>
            <TabsContent value="returns" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Cancellations</h2>
             <div className="space-y-4 text-muted-foreground mb-8">
                <p>You can cancel your order only while it is in the "Placed" status. Once it moves into production ("To Be Printed"), we can no longer accept cancellations as your custom gear is already being made.</p>
                <p>You can see your order status on the <a href="/orders" className="underline text-primary">My Orders</a> page.</p>
            </div>

            <h2 className="text-2xl font-bold mb-4">Returns & Exchanges</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>As every product is printed on-demand specifically for you, we cannot accept returns or exchanges for issues like incorrect size selection, design, or color choices. <strong>Please review your order and our size guide carefully before placing your order.</strong></p>
                <p>We only offer replacements for defective or damaged goods under the following conditions:</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>A claim must be submitted to <a href="mailto:support@podiumwear.com" className="underline text-primary">support@podiumwear.com</a> within <strong>7 days</strong> of the delivery date.</li>
                    <li>The claim must include a clear **unboxing video** showing the product's arrival condition.</li>
                    <li>You must also provide **photos of the defect** and **clear images of the original packaging**.</li>
                    <li>If the issue is verified, we will reproduce and reship the product at no cost to you.</li>
                </ul>
                <p>Our goal is to ensure you receive championship-quality gear. We'll always do our best to resolve any issues fairly.</p>
            </div>
            </TabsContent>
            <TabsContent value="privacy" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>Your data is as important to us as your personal best. It's safe with us.</p>
                <ul className="list-disc pl-5 space-y-2">
                <li>We collect basic information like your name, address, email, and phone number to process and deliver your order.</li>
                <li>We do not store any payment card details. All transactions are handled by our secure, encrypted payment gateway.</li>
                <li>We will never sell your personal information to third parties. That's a foul play we don't engage in.</li>
                <li>We may send you occasional emails about new drops or exclusive offers, but you can unsubscribe at any time from the bottom of any email.</li>
                </ul>
                <p>Your privacy is our priority. No penalties, no spam.</p>
            </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
