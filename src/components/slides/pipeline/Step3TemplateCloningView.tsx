import React from "react";
import { Copy, Layers, Sparkles, Check, HardDrive, ArrowRight } from "lucide-react";
import { DriveMasterTemplate } from "../../../services/slides/pipeline/pipelineTypes";
import { MASTER_DRIVE_TEMPLATES } from "../../../services/slides/pipeline/googleDriveTemplateEngine";

interface Step3TemplateCloningViewProps {
  selectedTemplate: DriveMasterTemplate;
  onSelectTemplate: (tpl: DriveMasterTemplate) => void;
  clonedPresentationId?: string;
  clonedPresentationUrl?: string;
}

export const Step3TemplateCloningView: React.FC<Step3TemplateCloningViewProps> = ({
  selectedTemplate,
  onSelectTemplate,
  clonedPresentationId,
  clonedPresentationUrl
}) => {
  return (
    <div className="space-y-4">
      {/* Information Header */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <Copy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-slate-200">
            Master Animated Templates (Google Drive API Cloner)
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Instead of starting with blank slides, Mahr clones pre-built master templates with smooth native entrance keyframes and transitions (Fade, Slide, Zoom) already established.
        </p>

        {clonedPresentationId && (
          <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
            <span className="text-xs text-emerald-300 font-mono">
              Cloned ID: {clonedPresentationId}
            </span>
            {clonedPresentationUrl && (
              <a
                href={clonedPresentationUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                Inspect Cloned Deck <ArrowRight className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Template Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {MASTER_DRIVE_TEMPLATES.map((tpl) => {
          const isSelected = selectedTemplate.id === tpl.id;

          return (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl)}
              className={`cursor-pointer rounded-xl border p-4 flex flex-col justify-between transition-all duration-300 ${
                isSelected
                  ? "bg-amber-950/30 border-amber-400 ring-1 ring-amber-400/50 shadow-lg shadow-amber-950/40"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-3 border border-slate-800">
                  <img
                    src={tpl.thumbnailUrl}
                    alt={tpl.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-medium text-amber-300 border border-amber-500/30">
                    {tpl.transitionType}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-100">{tpl.name}</h4>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">{tpl.description}</p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>Aspect: {tpl.aspectRatio}</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Pre-Animated
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
