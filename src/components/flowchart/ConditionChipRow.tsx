"use client";

import React, { useState } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { ConditionRule } from "../../types/flowchartTypes";
import { FlowchartMenu } from "./FlowchartMenu";

export interface ConditionChipRowProps {
  key?: React.Key;
  rule: ConditionRule;
  onUpdate: (updated: Partial<ConditionRule>) => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

export function ConditionChipRow({
  rule,
  onUpdate,
  onDelete,
  canDelete = false,
}: ConditionChipRowProps) {
  const [openMenu, setOpenMenu] = useState<"prefix" | "property" | "operator" | "value" | null>(null);

  const prefixOptions = ["If", "and", "or"];
  const propertyOptions = rule.propertyOptions || [rule.property, "Status", "Total count", "Type", "Priority"];
  const operatorOptions = ["is", "is not", "equals", "greater than", "contains"];
  const valueOptions = rule.valueOptions || [
    { name: rule.value, tag: "Current" },
    { name: "Alternative A", tag: "Option" },
    { name: "Alternative B", tag: "Option" },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs font-sans group/row relative py-0.5">
      {/* 1. Prefix Chip ("If", "and", "or") */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "prefix" ? null : "prefix")}
          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[11px] border border-white/10 flex items-center gap-1 transition cursor-pointer"
        >
          <span>{rule.prefix || "If"}</span>
          <ChevronDown size={10} className="text-slate-400" />
        </button>
        {openMenu === "prefix" && (
          <FlowchartMenu
            options={prefixOptions}
            value={rule.prefix || "If"}
            onSelect={(val) => onUpdate({ prefix: val as any })}
            onClose={() => setOpenMenu(null)}
          />
        )}
      </div>

      {/* 2. Source Entity Pill (e.g., "order") */}
      {rule.sourceLabel && (
        <div className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 select-none">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: rule.dotColor || "#f09a2f" }}
          />
          <span className="text-slate-200 font-medium">{rule.sourceLabel}</span>
        </div>
      )}

      {/* 3. Property Selector Pill */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "property" ? null : "property")}
          className="px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1 transition cursor-pointer font-medium"
        >
          <span>{rule.property}</span>
          <ChevronDown size={10} className="text-slate-400" />
        </button>
        {openMenu === "property" && (
          <FlowchartMenu
            options={propertyOptions}
            value={rule.property}
            onSelect={(val) => onUpdate({ property: val })}
            onClose={() => setOpenMenu(null)}
          />
        )}
      </div>

      {/* 4. Operator Chip */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "operator" ? null : "operator")}
          className="px-1.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 text-[11px] border border-white/10 flex items-center gap-1 transition cursor-pointer font-mono"
        >
          <span>{rule.operator || "is"}</span>
          <ChevronDown size={9} className="text-slate-500" />
        </button>
        {openMenu === "operator" && (
          <FlowchartMenu
            options={operatorOptions}
            value={rule.operator || "is"}
            onSelect={(val) => onUpdate({ operator: val })}
            onClose={() => setOpenMenu(null)}
          />
        )}
      </div>

      {/* 5. Value Picker Chip */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "value" ? null : "value")}
          className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(240,154,47,0.15)]"
        >
          <span>{rule.value}</span>
          <ChevronDown size={10} className="text-amber-400" />
        </button>
        {openMenu === "value" && (
          <FlowchartMenu
            options={valueOptions}
            value={rule.value}
            onSelect={(val) => onUpdate({ value: val })}
            onClose={() => setOpenMenu(null)}
          />
        )}
      </div>

      {/* Delete Rule Button */}
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer ml-auto"
          title="Delete condition rule"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  );
}
