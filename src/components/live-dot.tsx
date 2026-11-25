export function LiveDot({ className = "bg-success" }: { className?: string }) {
  return (
    <span className="relative flex size-2">
      <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${className}`} />
      <span className={`relative inline-flex size-2 rounded-full ${className}`} />
    </span>
  );
}
