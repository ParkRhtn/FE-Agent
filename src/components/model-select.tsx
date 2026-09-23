"use client";

import type { ModelOption } from "@/lib/api/client";

type ModelSelectProps = {
  options: ModelOption[];
  value: string;
  onChange: (value: string) => void;
  /** 있으면 맨 위에 "기본 모델" 항목(값 "")을 둔다 */
  defaultOption?: { label: string };
  id?: string;
  disabled?: boolean;
  className?: string;
};

/** 제공사별로 묶은 모델 선택 상자 */
export function ModelSelect({ options, value, onChange, defaultOption, id, disabled, className }: ModelSelectProps) {
  const groups = Map.groupBy(options, (o) => o.provider);
  const known = value === "" || options.some((o) => o.id === value);

  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={className}>
      {defaultOption && <option value="">{defaultOption.label}</option>}
      {!known && <option value={value}>사용할 수 없는 모델 (다시 고르세요)</option>}
      {[...groups].map(([provider, items]) => (
        <optgroup key={provider} label={provider}>
          {items.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
