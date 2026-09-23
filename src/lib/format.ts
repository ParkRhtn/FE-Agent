/** 달러 비용. 아주 작은 금액도 0 으로 뭉개지지 않게 유효숫자 2자리까지 보인다. */
export function formatCost(value: number): string {
  if (value === 0) return "$0";
  if (value >= 0.01) return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${value.toPrecision(2)}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}
