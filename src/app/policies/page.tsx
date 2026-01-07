import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PoliciesPage() {
  return (
    <div className="container max-w-4xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">our policies</h1>
        <p className="mt-4 text-muted-foreground md:text-lg">clear intentions, just like our tees.</p>
      </div>

      <Tabs defaultValue="shipping" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-secondary">
          <TabsTrigger value="shipping">shipping</TabsTrigger>
          <TabsTrigger value="returns">returns</TabsTrigger>
          <TabsTrigger value="privacy">privacy</TabsTrigger>
        </TabsList>
        <div className="mt-8">
            <TabsContent value="shipping" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">shipping policy</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>we ship our soft things all across india.</p>
                <ul className="list-disc pl-5 space-y-2">
                <li>all orders are dispatched within 2-4 working days.</li>
                <li>cash on delivery (cod) is available for most locations.</li>
                <li>you'll receive a tracking link once your order is on its way.</li>
                </ul>
                <p>we're working on making our feelings available worldwide soon.</p>
            </div>
            </TabsContent>
            <TabsContent value="returns" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">return policy</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>we pour a lot of heart into every piece. due to our small-batch nature, we have a limited return policy.</p>
                <ul className="list-disc pl-5 space-y-2">
                <li>returns or exchanges are only accepted in case of a damaged or incorrect product sent from our side.</li>
                <li>please email us at contact@softsaath.com with a photo of the issue within 48 hours of delivery.</li>
                <li>we do not offer returns or exchanges for size mismatches. please check our size guide carefully before ordering.</li>
                </ul>
                <p>our goal is to make you feel good, so we'll always try our best to help.</p>
            </div>
            </TabsContent>
            <TabsContent value="privacy" className="p-6 bg-secondary/50 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">privacy policy</h2>
            <div className="space-y-4 text-muted-foreground">
                <p>your feelings (and data) are safe with us.</p>
                <ul className="list-disc pl-5 space-y-2">
                <li>we collect basic information like your name, address, email, and phone number to process your order.</li>
                <li>we do not store any payment card details. all transactions are handled by our secure payment gateway.</li>
                <li>we will never, ever sell your information to third parties. that's not a soft thing to do.</li>
                <li>we may send you occasional emails about new drops or soft thoughts, but you can unsubscribe anytime.</li>
                </ul>
                <p>your privacy is a priority. no pressure, no spam.</p>
            </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
