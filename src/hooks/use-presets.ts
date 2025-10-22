
"use client"

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
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

type PresetsContextType = {
    presets: Preset[];
    namingOptions: NamingOptions;
    setNamingOptions: React.Dispatch<React.SetStateAction<NamingOptions>>;
    formattingOptions: FormattingOptions;
    setFormattingOptions: React.Dispatch<React.SetStateAction<FormattingOptions>>;
    selectedPreset: string;
    handleSelectPreset: (name: string) => void;
    handleSavePreset: (presetName: string) => void;
    handleDeletePreset: (name: string) => void;
};

const PresetsContext = createContext<PresetsContextType | undefined>(undefined);

export const PresetsProvider = ({ children }: { children: ReactNode }) => {
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
                 const savedLastPreset = localStorage.getItem('keepSyncLastPreset');
                 if(savedLastPreset) {
                    handleSelectPreset(savedLastPreset);
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

        setPresets(currentPresets => {
            const existingIndex = currentPresets.findIndex(p => p.name === presetName);
            if (existingIndex > -1) {
                const updatedPresets = [...currentPresets];
                updatedPresets[existingIndex] = newPreset;
                return updatedPresets;
            } else {
                return [...currentPresets, newPreset];
            }
        });
        setSelectedPreset(newPreset.name);
        localStorage.setItem('keepSyncLastPreset', newPreset.name);
    }, [namingOptions, formattingOptions]);

    const handleSelectPreset = useCallback((name: string) => {
        if (name === 'default') {
            setNamingOptions(initialNamingOptions);
            setFormattingOptions(initialFormattingOptions);
            setSelectedPreset('');
            localStorage.removeItem('keepSyncLastPreset');
            return;
        }
        // This logic runs on initial load, so we need to check presets from storage
        const currentPresets = JSON.parse(localStorage.getItem('keepSyncPresets') || '[]');
        const preset = currentPresets.find((p: Preset) => p.name === name);
        
        if (preset) {
            setNamingOptions(preset.options.naming);
            setFormattingOptions(preset.options.formatting);
            setSelectedPreset(name);
            localStorage.setItem('keepSyncLastPreset', name);
            // We don't toast on initial load, only on user interaction. 
            // The toast logic can be kept in the component that calls this.
        } else if (name) { // If a preset was saved but doesn't exist, reset
            handleSelectPreset('default');
        }
    }, []);

    const handleDeletePreset = useCallback((name: string) => {
        setPresets(presets.filter(p => p.name !== name));
        if (selectedPreset === name) {
            handleSelectPreset('default');
        }
    }, [presets, selectedPreset]);
    
    const contextValue = {
        presets,
        namingOptions,
        setNamingOptions,
        formattingOptions,
        setFormattingOptions,
        selectedPreset,
        handleSelectPreset,
        handleSavePreset,
        handleDeletePreset,
    };
    
    return (
        <PresetsContext.Provider value={contextValue}>
            {children}
        </PresetsContext.Provider>
    );
};

export const usePresets = () => {
    const context = useContext(PresetsContext);
    if (context === undefined) {
        throw new Error('usePresets must be used within a PresetsProvider');
    }
    return context;
};
