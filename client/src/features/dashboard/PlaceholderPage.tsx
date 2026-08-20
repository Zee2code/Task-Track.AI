export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl mb-6">{title}</h1>
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white/50 p-10 text-center text-sm text-neutral-500">
        {title} module coming in the next implementation stage.
      </div>
    </div>
  );
}
