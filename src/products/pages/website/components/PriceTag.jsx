/* Udemy-style price: struck-through list price, the sale price, and a "% off" tag.
   With no live sale it renders the plain price, so callers never branch. */
export default function PriceTag({ price }) {
  if (!price.sale) return <span className="pt">{price.label}</span>;
  return (
    <span className="pt pt-sale">
      <s className="pt-was" aria-label={"Was " + price.sale.listLabel}>{price.sale.listLabel}</s>
      <b className="pt-now">{price.sale.saleLabel}</b>
      <span className="pt-off">{price.sale.percentOff}% off</span>
    </span>
  );
}
