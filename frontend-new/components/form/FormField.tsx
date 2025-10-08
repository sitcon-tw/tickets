"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { TicketFormField } from '@/lib/types/api';
import { getLocalizedText } from '@/lib/utils/localization';
import Text from '@/components/input/Text';
import Textarea from '@/components/input/Textarea';
import Select from '@/components/input/Select';
import Radio from '@/components/input/Radio';
import Checkbox from '@/components/input/Checkbox';
import MultiCheckbox from '@/components/input/MultiCheckbox';
import { SelectOption } from '@/components/input/Select';
import { RadioOption } from '@/components/input/Radio';
import { CheckboxOption } from '@/components/input/MultiCheckbox';

interface FormFieldProps {
  field: TicketFormField;
  value: string | boolean | string[];
  onTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pleaseSelectText: string;
}

export function FormField({ field, value, onTextChange, onCheckboxChange, pleaseSelectText }: FormFieldProps) {
  const locale = useLocale();
  const requiredMark = field.required ? ' *' : '';
  const label = `${field.description}${requiredMark}`;

  // Convert localized options to display strings
  const localizedOptions = field.options?.map(opt => ({
    value: getLocalizedText(opt, locale),
    label: getLocalizedText(opt, locale)
  })) || [];

  switch (field.type) {
    case 'text':
      return (
        <Text
          label={label}
          id={getLocalizedText(field.name, locale)}
          placeholder={field.placeholder || ''}
          required={field.required}
          value={(value as string) || ''}
          onChange={onTextChange}
        />
      );

    case 'textarea':
      return (
        <Textarea
          label={label}
          id={getLocalizedText(field.name, locale)}
          rows={3}
          placeholder={field.placeholder || ''}
          required={field.required}
          value={(value as string) || ''}
          onChange={onTextChange}
        />
      );

    case 'select':
      return (
        <Select
          label={label}
          id={getLocalizedText(field.name, locale)}
          options={localizedOptions as SelectOption[]}
          required={field.required}
          value={(value as string) || ''}
          onChange={onTextChange}
          pleaseSelectText={pleaseSelectText}
        />
      );

    case 'radio':
      return (
        <Radio
          label={field.description || ''}
          name={getLocalizedText(field.name, locale)}
          options={localizedOptions as RadioOption[]}
          required={field.required}
          value={(value as string) || ''}
          onChange={onTextChange}
        />
      );

    case 'checkbox':
      if (field.options && Array.isArray(field.options) && field.options.length > 0) {
        // Multiple checkbox options
        const currentValues = Array.isArray(value) ? value : [];
        return (
          <MultiCheckbox
            label={`${field.description}${requiredMark}`}
            name={getLocalizedText(field.name, locale)}
            options={localizedOptions as CheckboxOption[]}
            values={currentValues}
            onChange={onCheckboxChange}
          />
        );
      } else {
        // Single checkbox
        return (
          <Checkbox
            label={field.description || ''}
            id={getLocalizedText(field.name, locale)}
            required={field.required}
            value="true"
            checked={!!value}
            onChange={onCheckboxChange}
          />
        );
      }

    default:
      return (
        <Text
          label={label}
          id={getLocalizedText(field.name, locale)}
          placeholder={field.placeholder || ''}
          required={field.required}
          value={(value as string) || ''}
          onChange={onTextChange}
        />
      );
  }
}
