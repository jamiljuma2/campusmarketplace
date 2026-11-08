export default function ProductLoading() {
  return (
    <div className="container" style={{ paddingTop: 30 }}>
      <div className="loading-placeholder" style={{ width: 220, height: 16 }} />
      <div className="product-detail-grid" style={{ marginTop: 20 }}>
        <div>
          <div className="loading-placeholder" style={{ height: 440, borderRadius: 14 }} />
          <div className="loading-placeholder" style={{ width: "80%", height: 22, marginTop: 30 }} />
          <div className="loading-placeholder" style={{ height: 90, marginTop: 15 }} />
        </div>
        <aside className="card" style={{ padding: 24 }}>
          <div className="loading-placeholder" style={{ width: 90, height: 24 }} />
          <div className="loading-placeholder" style={{ height: 32, marginTop: 16 }} />
          <div className="loading-placeholder" style={{ width: 150, height: 30, marginTop: 12 }} />
          <div className="loading-placeholder" style={{ height: 46, marginTop: 28 }} />
        </aside>
      </div>
    </div>
  );
}
