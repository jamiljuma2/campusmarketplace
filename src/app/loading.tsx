export default function Loading() {
  return (
    <div className="container" style={{ paddingTop: 34 }} aria-busy="true" aria-live="polite">
      <div className="card" style={{ minHeight: 280, padding: 24 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Loading…
        </p>
      </div>
    </div>
  );
}
