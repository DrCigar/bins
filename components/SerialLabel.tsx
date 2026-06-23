import { Barcode } from "./Barcode";
import { Machine, roleTag } from "@/lib/domain/types";

// One printable thermal label (2.25" x 1.25"), white — matches the POS360-branded look.
export function SerialLabel({ m }: { m: Machine }) {
  const d = m.serial ? m.serial.slice(-9, -3) : "";
  const pretty = d ? `${d.slice(2, 4)}-${d.slice(4, 6)}-20${d.slice(0, 2)}` : "";
  return (
    <div className="serial-label" style={{
      width: "2.25in", height: "1.25in", padding: "0.12in 0.14in", boxSizing: "border-box",
      background: "#fff", color: "#000", display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>POS<span style={{ color: "#EF4023" }}>360</span></span>
        <span style={{ fontSize: 11, fontWeight: 500 }}>{m.productLine} {roleTag(m.role)}</span>
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, textAlign: "center", letterSpacing: "0.03em" }}>{m.serial}</div>
      <div style={{ display: "flex", justifyContent: "center" }}><Barcode value={m.serial ?? ""} height={32} /></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#444" }}>
        <span>{pretty}</span><span>Assembled: {m.assembledBy ?? "—"}</span>
      </div>
    </div>
  );
}
