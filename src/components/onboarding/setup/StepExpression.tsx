import { Frown, Meh, Shuffle } from 'lucide-react';
import { OptionCard } from './shared';
import type { ExpressionTolerance } from './types';

interface StepExpressionProps {
  value: ExpressionTolerance | null;
  onChange: (value: ExpressionTolerance) => void;
}

export function StepExpression({ value, onChange }: StepExpressionProps) {
  return (
    <div className="space-y-3">
      <OptionCard
        id="expression-neutral"
        icon={<Meh className="h-4 w-4" />}
        title="Neutral"
        description="I look calm while focused. Use standard sensitivity."
        selected={value === 'neutral'}
        onClick={() => onChange('neutral')}
      />
      <OptionCard
        id="expression-intense"
        icon={<Frown className="h-4 w-4" />}
        title="Intense"
        description="I tend to frown or look serious. Raise the threshold before flagging a negative emotion state."
        selected={value === 'intense'}
        onClick={() => onChange('intense')}
      />
      <OptionCard
        id="expression-variable"
        icon={<Shuffle className="h-4 w-4" />}
        title="Variable"
        description="No strong pattern. Use a rolling baseline calibrated over the first few sessions."
        selected={value === 'variable'}
        onClick={() => onChange('variable')}
      />
    </div>
  );
}
