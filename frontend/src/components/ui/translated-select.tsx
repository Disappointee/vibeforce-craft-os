'use client';

import * as React from 'react';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { t, TranslationKey } from '@/lib/i18n';

interface SelectOption {
  value: string;
  labelKey: TranslationKey;
}

interface TranslatedSelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
  placeholder?: TranslationKey;
  options: readonly SelectOption[];
  className?: string;
  disabled?: boolean;
}

export function TranslatedSelect({
  value,
  defaultValue,
  onValueChange,
  placeholder,
  options,
  className,
  disabled,
}: TranslatedSelectProps) {
  const resolvedPlaceholder = placeholder ? t(placeholder) : undefined;
  const currentLabel = value ? options.find(o => o.value === value)?.labelKey : undefined;

  return (
    <Select
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={resolvedPlaceholder}>
          {currentLabel ? t(currentLabel) : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {t(opt.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
