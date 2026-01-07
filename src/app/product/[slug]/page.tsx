import { products } from "@/lib/products";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export async function generateStaticParams() {
  return products.map((product) => ({
    slug: product.slug,
  }));
}

interface ProductPageProps {
  params: {
    slug: string;
  };
}

const sizeGuide = [
    { size: 's', chest: 38, length: 26 },
    { size: 'm', chest: 40, length: 27 },
    { size: 'l', chest: 42, length: 28 },
    { size: 'xl', chest: 44, length: 29 },
    { size: 'xxl', chest: 46, length: 30 },
]

export default function ProductPage({ params }: ProductPageProps) {
  const product = products.find((p) => p.slug === params.slug);

  if (!product) {
    notFound();
  }

  const productImage = PlaceHolderImages.find((p) => p.id === product.imageId);

  return (
    <div className="container mx-auto max-w-6xl py-12 md:py-20">
      <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
        <div className="aspect-[4/5] relative bg-card rounded-lg overflow-hidden">
          {productImage && (
            <Image
              src={productImage.imageUrl}
              alt={product.quote}
              fill
              className="object-cover"
              data-ai-hint={productImage.imageHint}
            />
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {product.quote}
            </h1>
            <p className="text-xl text-muted-foreground mt-1">
              {product.fit} tee ({product.color})
            </p>
          </div>
          
          <p className="text-3xl font-semibold">₹{product.price}</p>

          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {product.description}
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div><span className="font-semibold">fit:</span> {product.details.fit}</div>
            <div><span className="font-semibold">fabric:</span> {product.details.fabric}</div>
            <div><span className="font-semibold">feel:</span> {product.details.feel}</div>
          </div>
          
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-4">
                <p className="font-medium">size:</p>
                <div className="flex gap-2">
                    {sizeGuide.map(s => <Button key={s.size} variant="outline" size="icon" className="w-12 h-12">{s.size}</Button>)}
                </div>
            </div>
            <Button size="lg" className="w-full">add to bag</Button>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="size-guide">
              <AccordionTrigger>size guide</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>oversized fit:</strong> designed for a relaxed, baggy look. choose your usual size for the oversized vibe, or size down for a cleaner fit.
                  <br/>
                  <strong>regular fit:</strong> true to size with a comfortable everyday feel.
                </p>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>size</TableHead>
                            <TableHead>chest (in)</TableHead>
                            <TableHead>length (in)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sizeGuide.map(s => (
                            <TableRow key={s.size}>
                                <TableCell className="uppercase font-medium">{s.size}</TableCell>
                                <TableCell>{s.chest}"</TableCell>
                                <TableCell>{s.length}"</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <p className="text-xs text-muted-foreground mt-4">🫶 still unsure? go oversized — soft looks better slightly loose.</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger>care instructions</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground italic mb-4">because feelings deserve gentleness.</p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>wash inside out</li>
                    <li>cold wash only</li>
                    <li>do not bleach</li>
                    <li>iron inside out (low heat)</li>
                    <li>avoid tumble drying</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-4 italic">*handle with care — it’s made for soft hearts.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
