/**
 * Minimal full-screen loader for guarded routes: flat site-background, one
 * smooth violet spinner, gentle fade-in so fast loads never flash.
 */
export function CocoLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <main className="coco-load" data-testid="coco-loading">
      <span className="coco-load-spinner" role="status" aria-label={label} />
      <p className="coco-load-text">{label}</p>
    </main>
  )
}
