"use client";

import React from 'react';
import { TicketFormField } from '@/lib/types/api';
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
  const requiredMark = field.required ? ' *' : '';
  const label = `${field.description}${requiredMark}`;

  switch (field.type) {
    case 'text':
      return (
        <Text
          label={label}
          id={field.name}
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
          id={field.name}
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
          id={field.name}
          options={field.options as SelectOption[] || []}
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
          name={field.name}
          options={field.options as RadioOption[] || []}
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
            name={field.name}
            options={field.options as CheckboxOption[] || []}
            values={currentValues}
            onChange={onCheckboxChange}
          />
        );
      } else {
        // Single checkbox
        return (
          <Checkbox
            label={field.description || ''}
            id={field.name}
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
          id={field.name}
          placeholder={field.placeholder || ''}
          required={field.required}
          value={(value as string) || ''}
          onChange={onTextChange}
        />
      );
  }
}
