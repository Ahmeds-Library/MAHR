"use client";

import React, { useRef, useEffect } from "react";
import { GripVertical, Plus, Trash2, Zap, GitBranch, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import { StepNode, ConditionRule } from "../../types/flowchartTypes";
import { ConditionChipRow } from "./ConditionChipRow";
import { mix } from "../../lib/flowchartPresets";

interface FlowNodeCardProps {
  node: StepNode;
  isSelected?: boolean;
  onSelect?: () => void;
  onPointerDownDrag: (e: React.PointerEvent) => void;
  onUpdateNode: (updated: Partial<StepNode>) => void;
  onDeleteNode?: () => void;
  onResize?: (height: number) => void;
}

export function FlowNodeCard({
  node,
  isSelected = false,
  onPointerDownDrag,
  onUpdateNode,
  onDeleteNode,
  onResize,
}: FlowNodeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hue = node.hue || "#9a5cff";

  // Observe height changes and notify canvas
  useEffect(() => {
    if (!cardRef.current || !onResize) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        onResize(entry.contentRect.height);
      }
    });
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [onResize]);

  // Handle condition rule updates
  const handleUpdateRule = (ruleId: string, patch: Partial<ConditionRule>) => {
    if (!node.conditionRules) return;
    const newRules = node.conditionRules.map((r) =>
      r.id === ruleId ? { ...r, ...patch } : r
    );
    onUpdateNode({ conditionRules: newRules });
  };

  const handleAddRule = () => {
    const newRule: ConditionRule = {
      id: `r-${Date.now()}`,
      prefix: "and",
      sourceLabel: "data",
      property: "Status",
      operator: "is",
      value: "Valid",
      dotColor: hue,
      propertyOptions: ["Status", "Value", "Count", "Type", "Priority"],
      valueOptions: [
        { name: "Valid", tag: "Success" },
        { name: "Pending", tag: "Waiting" },
        { name: "Failed", tag: "Error" },
      ],
    };
    onUpdateNode({
      conditionRules: [...(node.conditionRules || []), newRule],
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (!node.conditionRules) return;
    onUpdateNode({
      conditionRules: node.conditionRules.filter((r) => r.id !== ruleId),
    });
  };

  return (
    <div
      ref={cardRef}
      style={{
        width: node.w,
        backgroundColor: mix(hue, 8, "var(--surface)"),
        borderColor: isSelected ? hue : mix(hue, 24, "var(--line-strong)"),
        boxShadow: isSelected
          ? `0 0 25px ${mix(hue, 35, "transparent")}, 0 8px 30px rgba(0,0,0,0.7)`
          : `0 4px 20px rgba(0,0,0,0.5)`,
      }}
      className={`rounded-2xl border p-4.5 text-slate-100 flex flex-col gap-3 transition-shadow duration-200 select-none relative group backdrop-blur-md ${
        node.status === "running" ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-slate-950 animate-pulse" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Top Anchor Dot */}
      <div
        className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-slate-950 transition-transform group-hover:scale-125"
        style={{
          backgroundColor: hue,
          boxShadow: `0 0 8px ${hue}`,
        }}
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-2 pb-1">
        {/* Left Kind Badge & Icon */}
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <div
            onPointerDown={onPointerDownDrag}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 transition"
            title="Drag card across canvas"
          >
            <GripVertical size={14} />
          </div>

          <div
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 border"
            style={{
              backgroundColor: mix(hue, 15, "transparent"),
              borderColor: mix(hue, 40, "transparent"),
              color: hue,
            }}
          >
            {node.condition ? (
              <GitBranch size={10} />
            ) : node.actionType === "trigger" ? (
              <Zap size={10} />
            ) : (
              <ArrowRight size={10} />
            )}
            <span>{node.kind?.label || (node.condition ? "Condition" : "Step")}</span>
          </div>

          {node.status === "running" && (
            <span className="text-[9px] font-mono text-purple-300 flex items-center gap-1 animate-pulse">
              <Play size={8} /> Active
            </span>
          )}
          {node.status === "success" && (
            <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={9} /> Evaluated
            </span>
          )}
        </div>

        {/* Delete Node Action */}
        {onDeleteNode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode();
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition cursor-pointer"
            title="Delete this step node"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {/* Content Section */}
      {node.condition ? (
        <div className="flex flex-col gap-2 pt-0.5">
          {node.conditionRules && node.conditionRules.length > 0 ? (
            node.conditionRules.map((rule, idx) => (
              <ConditionChipRow
                key={rule.id || idx}
                rule={rule}
                canDelete={node.conditionRules!.length > 1}
                onUpdate={(patch) => handleUpdateRule(rule.id, patch)}
                onDelete={() => handleDeleteRule(rule.id)}
              />
            ))
          ) : (
            <div className="text-xs text-slate-400 italic py-1">No condition rules added yet.</div>
          )}

          {/* Add condition rule button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleAddRule}
              className="px-2 py-1 rounded-lg text-[10px] font-mono text-amber-300 hover:bg-amber-500/10 border border-dashed border-amber-500/30 flex items-center gap-1 transition cursor-pointer"
            >
              <Plus size={11} />
              <span>Add condition rule</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
            <span>{node.title || "Step Title"}</span>
          </div>
          {node.caption && (
            <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal opacity-90">
              {node.caption}
            </p>
          )}
        </div>
      )}

      {/* Bottom Anchor Dot */}
      <div
        className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-slate-950 transition-transform group-hover:scale-125"
        style={{
          backgroundColor: hue,
          boxShadow: `0 0 8px ${hue}`,
        }}
      />
    </div>
  );
}
