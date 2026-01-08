import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PoliciesPage() {
  return (
    <div className="container max-w-4xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Our Policies</h1>
        <p className="mt-4 text-muted-foreground md:text-lg">Clear intentions, just like our tees.</p>
      </div>

      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        <div className="mt-8">
            <TabsContent value="shipping" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Shipping Policy</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>We ship our soft things all across India.</p>
                <ul className="list-disc pl-5 space-y-2">
                <li>All orders are dispatched within 2-4 working days.</li>
                <li>Cash on delivery (COD) is available for most locations.</li>
                <li>You'll receive a tracking link once your order is on its way.</li>
                </ul>
                <p>We're working on making our feelings available worldwide soon.</p>
            </div>
            </TabsContent>
            <TabsContent value="returns" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Return Policy</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>We pour a lot of heart into every piece. Due to our small-batch nature, we have a limited return policy.</p>
                <ul className="list-disc pl-5 space-y-2">
                <li>Returns or exchanges are only accepted in case of a damaged or incorrect product sent from our side.</li>
                <li>Please email us at contact@softsaath.com with a photo of the issue within 48 hours of delivery.</li>
                <li>We do not offer returns or exchanges for size mismatches. Please check our size guide carefully before ordering.</li>
                </ul>
                <p>Our goal is to make you feel good, so we'll always try our best to help.</p>
            </div>
            </TabsContent>
            <TabsContent value="privacy" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Privacy Policy</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>Your feelings (and data) are safe with us.</p>
                <ul className="list-disc pl-5 space-y-2">
                <li>We collect basic information like your name, address, email, and phone number to process your order.</li>
                <li>We do not store any payment card details. All transactions are handled by our secure payment gateway.</li>
                <li>We will never, ever sell your information to third parties. That's not a soft thing to do.</li>
                <li>We may send you occasional emails about new drops or soft thoughts, but you can unsubscribe anytime.</li>
                </ul>
                <p>Your privacy is a priority. No pressure, no spam.</p>
            </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
