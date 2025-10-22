
"use client"

import { useState, useEffect, useCallback } from 'react';
import { type NamingOptions, type FormattingOptions } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';

export type Preset = {
  name: string;
  options: {
    naming: NamingOptions;
    formatting: FormattingOptions;
  };
};

const initialNamingOptions: NamingOptions = {
    useTitle: true,
    useBody: true,
    bodyLength: 30,
    bodyUnit: 'characters',
    useDate: true,
    dateFormat: 'yyyy-MM-dd',
    useTime: false,
    timeFormat: 'HH-mm-ss',
    datePosition: 'prepend',
    useSerial: false,
    serialPadding: '1',
    useEmoji: false,
    selectedEmoji: '💡',
    emojiPosition: 'beforeDate',
};

const initialFormattingOptions: FormattingOptions = {
    tagHandling: 'hash',
};

export const usePresets = () => {
    const [namingOptions, setNamingOptions] = useState<NamingOptions>(initialNamingOptions);
    const [formattingOptions, setFormattingOptions] = useState<FormattingOptions>(initialFormattingOptions);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [selectedPreset, setSelectedPreset] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                const savedPresets = localStorage.getItem('keepSyncPresets');
                if (savedPresets) {
                    setPresets(JSON.parse(savedPresets));
                }
            } catch (error) {
                console.error("Failed to load presets from localStorage", error);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('keepSyncPresets', JSON.stringify(presets));
            } catch (error) {
                console.error("Failed to save presets to localStorage", error);
            }
        }
    }, [presets]);
    
    const handleSavePreset = useCallback((presetName: string) => {
        const newPreset: Preset = {
            name: presetName,
            options: { naming: namingOptions, formatting: formattingOptions }
        };

        const existingIndex = presets.findIndex(p => p.name === presetName);
        if (existingIndex > -1) {
            const updatedPresets = [...presets];
            updatedPresets[existingIndex] = newPreset;
            setPresets(updatedPresets);
        } else {
            setPresets(prev => [...prev, newPreset]);
        }
        setSelectedPreset(newPreset.name);
    }, [namingOptions, formattingOptions, presets]);

    const handleSelectPreset = useCallback((name: string) => {
        if (name === 'default') {
            setNamingOptions(initialNamingOptions);
            setFormattingOptions(initialFormattingOptions);
            setSelectedPreset('');
            return;
        }
        const preset = presets.find(p => p.name === name);
        if (preset) {
            setNamingOptions(preset.options.naming);
            setFormattingOptions(preset.options.formatting);
            setSelectedPreset(name);
            toast({ title: 'Preset Loaded', description: `Settings for "${name}" have been applied.` });
        }
    }, [presets, toast]);

    const handleDeletePreset = useCallback((name: string) => {
        setPresets(presets.filter(p => p.name !== name));
        if (selectedPreset === name) {
            handleSelectPreset('default'); // Revert to default settings
        }
    }, [presets, selectedPreset, handleSelectPreset]);
    
    return {
        presets,
        namingOptions,
        setNamingOptions,
        formattingOptions,
        setFormattingOptions,
        selectedPreset,
        handleSelectPreset,
        handleSavePreset,
        handleDeletePreset,
        initialNamingOptions,
        initialFormattingOptions
    };
};
