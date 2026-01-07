import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <div className="container max-w-2xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight">get in touch</h1>
        <p className="mt-2 text-muted-foreground">for questions, feelings, or just to say hi.</p>
      </div>
      <ContactForm />
    </div>
  );
}
