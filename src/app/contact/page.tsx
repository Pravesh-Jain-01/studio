import { ContactForm } from "@/components/contact-form";

export default function ContactPage() {
  return (
    <div className="container max-w-2xl mx-auto py-16 md:py-24">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">get in touch</h1>
        <p className="mt-4 text-muted-foreground md:text-lg">for questions, feelings, or just to say hi.</p>
      </div>
      <div className="bg-secondary p-8 rounded-lg">
        <ContactForm />
      </div>
    </div>
  );
}
