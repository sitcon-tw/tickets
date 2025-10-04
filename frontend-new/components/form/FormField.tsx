"use client";

import React from 'react';
import { TicketFormField } from '@/lib/types/api';
import { formStyles } from './formStyles';

interface FormFieldProps {
  field: TicketFormField;
  value: string | boolean | string[];
  onTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pleaseSelectText: string;
}

export function FormField({ field, value, onTextChange, onCheckboxChange, pleaseSelectText }: FormFieldProps) {
  const requiredMark = field.required ? ' *' : '';

  switch (field.type) {
    case 'text':
      return (
        <div style={formStyles.formGroup}>
          <label htmlFor={field.name} style={formStyles.label}>
            {field.description}{requiredMark}
          </label>
          <input
            type="text"
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ''}
            required={field.required}
            value={(value as string) || ''}
            onChange={onTextChange}
            style={formStyles.input}
          />
        </div>
      );

    case 'textarea':
      return (
        <div style={formStyles.formGroup}>
          <label htmlFor={field.name} style={formStyles.label}>
            {field.description}{requiredMark}
          </label>
          <textarea
            id={field.name}
            name={field.name}
            rows={3}
            placeholder={field.placeholder || ''}
            required={field.required}
            value={(value as string) || ''}
            onChange={onTextChange}
            style={formStyles.input}
          />
        </div>
      );

    case 'select':
      return (
        <div style={formStyles.formGroup}>
          <label htmlFor={field.name} style={formStyles.label}>
            {field.description}{requiredMark}
          </label>
          <select
            id={field.name}
            name={field.name}
            required={field.required}
            value={(value as string) || ''}
            onChange={onTextChange}
            style={formStyles.input}
          >
            <option value="">{pleaseSelectText}</option>
            {field.options?.map((option, i) => {
              const optionValue = typeof option === 'object' && option !== null && 'value' in option ? (option as { value: string }).value : String(option);
              const optionLabel = typeof option === 'object' && option !== null && 'label' in option ? (option as { label: string }).label : String(option);
              return <option key={i} value={optionValue}>{optionLabel}</option>;
            })}
          </select>
        </div>
      );

    case 'radio':
      return (
        <div style={formStyles.formGroup}>
          <fieldset style={formStyles.fieldset}>
            <legend style={formStyles.legend}>{field.description}{requiredMark}</legend>
            {field.options?.map((option, i) => {
              const optionValue = typeof option === 'object' && option !== null && 'value' in option ? (option as { value: string }).value : String(option);
              const optionLabel = typeof option === 'object' && option !== null && 'label' in option ? (option as { label: string }).label : String(option);
              return (
                <label key={i} style={formStyles.optionLabel}>
                  <input
                    type="radio"
                    name={field.name}
                    value={optionValue}
                    required={field.required && i === 0}
                    checked={value === optionValue}
                    onChange={onTextChange}
                    style={formStyles.optionInput}
                  />
                  {optionLabel}
                </label>
              );
            })}
          </fieldset>
        </div>
      );

    case 'checkbox':
      if (field.options && Array.isArray(field.options) && field.options.length > 0) {
        // Multiple checkbox options
        const currentValues = Array.isArray(value) ? value : [];
        return (
          <div style={formStyles.formGroup}>
            <fieldset style={formStyles.fieldset}>
              <legend style={formStyles.legend}>{field.description}{requiredMark}</legend>
              {field.options.map((option, i) => {
                const optionValue = typeof option === 'object' && option !== null && 'value' in option ? (option as { value: string }).value : String(option);
                const optionLabel = typeof option === 'object' && option !== null && 'label' in option ? (option as { label: string }).label : String(option);
                return (
                  <label key={i} style={formStyles.optionLabel}>
                    <input
                      type="checkbox"
                      name={field.name}
                      value={optionValue}
                      checked={currentValues.includes(optionValue)}
                      onChange={onCheckboxChange}
                      style={formStyles.optionInput}
                    />
                    {optionLabel}
                  </label>
                );
              })}
            </fieldset>
          </div>
        );
      } else {
        // Single checkbox
        return (
          <div style={formStyles.formGroup}>
            <label style={{ ...formStyles.optionLabel, cursor: 'pointer' }}>
              <input
                type="checkbox"
                name={field.name}
                value="true"
                required={field.required}
                checked={!!value}
                onChange={onCheckboxChange}
                style={formStyles.optionInput}
              />
              {field.description}{requiredMark}
            </label>
          </div>
        );
      }

    default:
      return (
        <div style={formStyles.formGroup}>
          <label htmlFor={field.name} style={formStyles.label}>
            {field.description}{requiredMark}
          </label>
          <input
            type="text"
            id={field.name}
            name={field.name}
            placeholder={field.placeholder || ''}
            required={field.required}
            value={(value as string) || ''}
            onChange={onTextChange}
            style={formStyles.input}
          />
        </div>
      );
  }
}
