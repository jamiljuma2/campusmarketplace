export default function MarketplaceLoading() {
  return (
    <div className="container" style={{ paddingTop: 34 }}>
      <div className="loading-placeholder" style={{ width: "min(360px, 70%)", height: 34 }} />
      <div className="marketplace-layout" style={{ marginTop: 20 }}>
        <div className="loading-placeholder" style={{ minHeight: 330 }} />
        <div className="marketplace-product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 }}>
          {Array.from({ length: 6 }, (_, index) => <div className="card loading-card" key={index}><div className="loading-placeholder loading-image" /><div className="loading-placeholder loading-line" /><div className="loading-placeholder loading-line loading-line-short" /></div>)}
        </div>
      </div>
    </div>
  );
}
