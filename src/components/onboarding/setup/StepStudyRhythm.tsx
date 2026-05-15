import { Timer } from 'lucide-react';
import { SliderField } from './shared';

interface StepStudyRhythmProps {
  blockLength: number;
  onBlockLengthChange: (value: number) => void;
  miniBreaks: number;
  onMiniBreaksChange: (value: number) => void;
}

export function StepStudyRhythm({
  blockLength,
  onBlockLengthChange,
  miniBreaks,
  onMiniBreaksChange,
}: StepStudyRhythmProps) {
  return (
    <div className="space-y-6 rounded-xl border border-[#2A2A35] bg-[#131316] p-6">
      <div className="flex items-center gap-2 text-[#7C6FF7]">
        <Timer className="h-4 w-4" />
        <span className="text-[11px] font-medium uppercase tracking-widest text-[#5A5A72]">
          Session Structure
        </span>
      </div>

      <SliderField
        id="study-block-length"
        label="Study block length"
        value={blockLength}
        min={15}
        max={90}
        step={5}
        unit="min"
        onChange={onBlockLengthChange}
      />

      <div className="h-px bg-[#1E1E26]" />

      <SliderField
        id="mini-breaks-per-session"
        label="Mini breaks per session"
        value={miniBreaks}
        min={1}
        max={3}
        step={1}
        unit=""
        onChange={onMiniBreaksChange}
      />
    </div>
  );
}
