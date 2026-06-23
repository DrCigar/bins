"use client";
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export function Barcode({ value, height = 38 }: { value: string; height?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (ref.current && value) {
      JsBarcode(ref.current, value, { format: "CODE128", height, displayValue: false, margin: 0 });
    }
  }, [value, height]);
  return <svg ref={ref} />;
}
