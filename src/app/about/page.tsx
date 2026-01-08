export default function AboutPage() {
  return (
    <div className="container max-w-4xl mx-auto py-16 md:py-24">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">About SoftSaath</h1>
        <p className="mt-4 text-primary font-semibold text-lg">Wear your feelings.</p>
      </div>
      <div className="mt-12 space-y-8 text-lg text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto">
        <p>
          In a world that's always screaming, we wanted to create a quiet corner.
          A space for gentle reminders and soft feelings.
        </p>
        <p>
          <span className="text-foreground font-semibold">SoftSaath</span> is for the ones who feel deeply. No noise. No rush. Just emotions you can wear.
        </p>
        <p>
          Each piece is a conversation starter, a quiet statement, a piece of your heart worn on your sleeve.
        </p>
      </div>
    </div>
  );
}
