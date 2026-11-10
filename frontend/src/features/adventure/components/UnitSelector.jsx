export default function UnitSelector({ units = [], className = "" }) {
  return (
    <label className={`unit-selector ${className}`}>
      <span>单元</span>
      <select aria-label="选择单元" value="kennenlernen" onChange={() => {}}>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id} disabled={!unit.available}>
            {unit.number}. {unit.title}
            {unit.available ? "" : "（准备中）"}
          </option>
        ))}
      </select>
    </label>
  );
}
