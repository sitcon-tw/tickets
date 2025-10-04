"use client";

import { useState, useCallback } from 'react';

type FormData = {
  [key: string]: string | boolean | string[];
};

export function useFormData(initialEmail: string = '') {
  const [formData, setFormData] = useState<FormData>({ email: initialEmail });

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;

    if (value === 'true') {
      // Single checkbox (like acceptTerms)
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      // Multiple checkbox options
      setFormData(prev => {
        const currentValues = Array.isArray(prev[name]) ? prev[name] as string[] : [];
        if (checked) {
          return { ...prev, [name]: [...currentValues, value] };
        } else {
          return { ...prev, [name]: currentValues.filter(v => v !== value) };
        }
      });
    }
  }, []);

  const updateFormData = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    formData,
    handleTextChange,
    handleCheckboxChange,
    updateFormData
  };
}
