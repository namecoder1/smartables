import { ChevronDown, ChevronUp } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number;
  onValueChange?: (value: number | undefined) => void;
  context?: "onboarding" | "default";
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value: controlledValue,
      onValueChange,
      className,
      context = "default",
      ...props
    },
    ref
  ) => {
    const [value, setValue] = useState<number | undefined>(controlledValue);

    useEffect(() => {
      setValue(controlledValue);
    }, [controlledValue]);

    const handleIncrement = () => {
      const displayValue = value ?? 0;
      const newValue = displayValue + 1;
      setValue(newValue);
      onValueChange?.(newValue);
    };

    const handleDecrement = () => {
      const displayValue = value ?? 0;
      const newValue = displayValue - 1;
      setValue(newValue);
      onValueChange?.(newValue);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      if (inputValue === '') {
        setValue(undefined);
        onValueChange?.(undefined);
        return;
      }
      const parsed = parseFloat(inputValue);
      if (!isNaN(parsed)) {
        setValue(parsed);
        onValueChange?.(parsed);
      }
    };

    return (
      <div className="flex items-center w-full">
        <Input
          ref={ref}
          type="number"
          value={value ?? ''}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              handleIncrement();
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              handleDecrement();
            }
          }}
          className={cn(
            "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none rounded-r-none relative flex-1 text-left",
            className
          )}
          {...props}
        />

        <div className="flex flex-col">
          <button
            aria-label="Increase value"
            className={
              context === 'onboarding'
                ? "px-2 h-6 bg-white border-2 rounded-l-none rounded-br-none border-neutral-200 rounded-xl border-l-0 border-b-[0.5px] focus-visible:relative hover:bg-neutral-100 hover:text-muted-foreground"
                : "px-2 h-4.5 bg-input border rounded-l-none hover:bg-input/80 rounded-br-none border-border rounded-xl border-l-0 border-b-[0.5px] focus-visible:relative hover:text-muted-foreground"
            }
            onClick={(e) => {
              e.preventDefault();
              handleIncrement();
            }}
            type="button"
            tabIndex={-1}
          >
            <ChevronUp size={15} className={cn(context === 'onboarding' && 'text-black')} />
          </button>
          <button
            aria-label="Decrease value"
            className={
              context === 'onboarding'
                ? "px-2 bg-white rounded-l-none border-2 border-neutral-200 rounded-xl h-6 rounded-tr-none border-l-0 border-t-2 focus-visible:relative hover:bg-neutral-100 hover:text-muted-foreground"
                : "px-2 h-4.5 bg-input rounded-l-none border hover:bg-input/80 border-t-none border-border rounded-xl rounded-tr-none border-l-0 focus-visible:relative hover:text-muted-foreground"
            }
            onClick={(e) => {
              e.preventDefault();
              handleDecrement();
            }}
            type="button"
            tabIndex={-1}
          >
            <ChevronDown size={15} className={cn(context === 'onboarding' && 'text-black')} />
          </button>
        </div>
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";
