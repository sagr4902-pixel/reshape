/** Section marker: number + bar line + label. The recurring "progression line". */
export function Rail({ no, label }: { no: string; label: string }) {
  return (
    <p className="rail">
      <span className="rail-no" aria-hidden="true">
        {no}
      </span>
      <span>{label}</span>
      <span className="rail-line" aria-hidden="true" />
    </p>
  );
}
