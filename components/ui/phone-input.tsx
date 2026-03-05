import * as React from "react";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import { parsePhoneNumber } from "react-phone-number-input";

import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
    context?: 'onboarding' | 'default';
  };

// Context for passing styling context to child components
const PhoneInputContext = React.createContext<{ isOnboarding: boolean }>({ isOnboarding: false });

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, value, context = 'default', ...props }, ref) => {
      const isOnboarding = context === 'onboarding';
      const validValue = React.useMemo(() => {
        if (value && !value.startsWith("+") && props.defaultCountry) {
          try {
            return parsePhoneNumber(value, props.defaultCountry)?.number as RPNInput.Value;
          } catch {
            return value;
          }
        }
        return value;
      }, [value, props.defaultCountry]);

      return (
        <PhoneInputContext.Provider value={{ isOnboarding }}>
          <RPNInput.default
            ref={ref}
            className={cn("flex", className)}
            flagComponent={FlagComponent}
            countrySelectComponent={CountrySelect}
            inputComponent={InputComponent}
            smartCaret={false}
            value={validValue || undefined}
            /**
             * Handles the onChange event.
             *
             * react-phone-number-input might trigger the onChange event as undefined
             * when a valid phone number is not entered. To prevent this,
             * the value is coerced to an empty string.
             *
             * @param {E164Number | undefined} value - The entered value
             */
            onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
            {...props}
          />
        </PhoneInputContext.Provider>
      );
    },
  );
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const { isOnboarding } = React.useContext(PhoneInputContext);
  return (
    <Input
      className={cn(
        className,
        'rounded-l-none! border-l-0',
        isOnboarding ? "h-full text-lg text-black rounded-l-none! border-0" : 'h-full border-0'
      )}
      {...props}
      placeholder="Inserisci il numero"
      ref={ref}
    />
  );
});
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  const { isOnboarding } = React.useContext(PhoneInputContext);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover
      open={isOpen}
      modal
      onOpenChange={(open) => {
        setIsOpen(open);
        open && setSearchValue("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 border-r-0 px-3 focus:z-10 rounded-l-xl",
            isOnboarding ? "bg-[#f4f4f480] border-gray-200 text-gray-900 hover:bg-gray-50 h-12" : 'bg-input/30 border-r-2 h-full'
          )}
          disabled={disabled}
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
          <ChevronsUpDown
            className={cn(
              "-mr-2 size-4 opacity-50",
              isOnboarding ? "text-black" : "text-foreground",
              disabled ? "hidden" : "opacity-100",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={8}
        className={cn(
          "w-[300px] p-0 shadow-lg border-2",
          isOnboarding
            ? "bg-white border-gray-200"
            : "bg-input/30 border-border"
        )}
      >
        <Command shouldFilter={false} className={cn(
          isOnboarding ? "bg-[#f4f4f480]" : "bg-[#F3F3F4]"
        )}>
          <CommandInput
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value);
            }}
            placeholder="Cerca paese..."
            className={cn(
              isOnboarding && "border-gray-200 text-gray-900 placeholder:text-gray-400"
            )}
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-60">
              <CommandEmpty className={cn(
                isOnboarding && "text-gray-500"
              )}>Nessun risultato.</CommandEmpty>
              <CommandGroup>
                {countryList
                  .filter((x) =>
                    x.label.toLowerCase().includes(searchValue.toLowerCase()),
                  )
                  .map(({ value, label }) =>
                    value ? (
                      <CountrySelectOption
                        key={value}
                        country={value}
                        countryName={label}
                        selectedCountry={selectedCountry}
                        onChange={onChange}
                        onSelectComplete={() => setIsOpen(false)}
                        isOnboarding={isOnboarding}
                      />
                    ) : null,
                  )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
  onSelectComplete: () => void;
  isOnboarding?: boolean;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
  onSelectComplete,
  isOnboarding,
}: CountrySelectOptionProps) => {
  const handleSelect = () => {
    onChange(country);
    onSelectComplete();
  };

  return (
    <CommandItem
      className={cn(
        "gap-2 cursor-pointer",
        isOnboarding ? [
          "text-gray-900",
          "hover:bg-gray-100",
          "data-[selected=true]:bg-gray-100",
          "aria-selected:bg-gray-100",
        ] : [
          "text-black",
          "hover:bg-gray-200 dark:hover:bg-gray-100/10",
          "data-[selected=true]:bg-gray-200 dark:data-[selected=true]:bg-gray-100/10",
          "aria-selected:bg-gray-200 dark:aria-selected:bg-gray-100/10",
        ]
      )}
      onSelect={handleSelect}
    >
      <FlagComponent country={country} countryName={countryName} />
      <span className={cn(
        "flex-1 text-sm",
        isOnboarding ? "text-gray-900" : "text-black"
      )}>{countryName}</span>
      <span className={cn(
        "text-sm",
        isOnboarding ? "text-gray-500" : "text-black"
      )}>{`+${RPNInput.getCountryCallingCode(country)}`}</span>
      <CheckIcon
        className={cn(
          "ml-auto size-4",
          country === selectedCountry ? "opacity-100" : "opacity-0",
          isOnboarding ? "text-gray-900" : 'text-black'
        )}
      />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden bg-foreground/20 [&_svg:not([class*='size-'])]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
