"use client";

import type { Product } from "@/types";

export function ProductSelector({
  products,
  selectedProductId,
  onSelect,
}: {
  products: Product[];
  selectedProductId: string;
  onSelect: (productId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onSelect(product.id)}
          className={`rounded-xl border p-3 text-left text-sm transition-colors ${
            selectedProductId === product.id
              ? "border-violet-300 bg-violet-50 text-violet-950"
              : "bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          <p className="font-semibold">{product.name}</p>
          <p className="mt-1 text-xs text-slate-500">{product.category} · {product.price.toLocaleString("ko-KR")}원</p>
        </button>
      ))}
    </div>
  );
}
