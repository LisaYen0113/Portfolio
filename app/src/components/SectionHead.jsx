export default function SectionHead({ idx, heading }) {
  return (
    <div className="section-head">
      <span className="section-idx">{idx}</span>
      <h2 className="section-title">{heading}</h2>
    </div>
  );
}
