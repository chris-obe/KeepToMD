
"use client"

import { useState, useEffect, useSyncExternalStore } from 'react';
import { type NamingOptions, type FormattingOptions } from '@/ai/schemas';

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


type PresetsState = {
  presets: Preset[];
  namingOptions: NamingOptions;
  formattingOptions: FormattingOptions;
  selectedPreset: string;
};

// --- Global state management (reducer pattern without JSX) ---

let memoryState: PresetsState = {
    presets: [],
    namingOptions: initialNamingOptions,
    formattingOptions: initialFormattingOptions,
    selectedPreset: '',
};

const listeners = new Set<() => void>();

const dispatch = (action: Action) => {
    memoryState = reducer(memoryState, action);
    listeners.forEach(listener => listener());
};

const subscribe = (callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
};

const getSnapshot = () => {
    return memoryState;
};

// --- Actions ---

type Action =
  | { type: 'SET_PRESETS'; payload: Preset[] }
  | { type: 'SET_NAMING_OPTIONS'; payload: NamingOptions | ((prev: NamingOptions) => NamingOptions) }
  | { type: 'SET_FORMATTING_OPTIONS'; payload: FormattingOptions | ((prev: FormattingOptions) => FormattingOptions) }
  | { type: 'SET_SELECTED_PRESET'; payload: string }
  | { type: 'SAVE_PRESET'; payload: { name: string; options: { naming: NamingOptions; formatting: FormattingOptions } } }
  | { type: 'DELETE_PRESET'; payload: string }
  | { type: 'SELECT_PRESET'; payload: string };

const reducer = (state: PresetsState, action: Action): PresetsState => {
    switch (action.type) {
        case 'SET_PRESETS':
            return { ...state, presets: action.payload };
        case 'SET_NAMING_OPTIONS':
            const newNamingOptions = typeof action.payload === 'function' ? action.payload(state.namingOptions) : action.payload;
            return { ...state, namingOptions: newNamingOptions, selectedPreset: '' };
        case 'SET_FORMATTING_OPTIONS':
            const newFormattingOptions = typeof action.payload === 'function' ? action.payload(state.formattingOptions) : action.payload;
            return { ...state, formattingOptions: newFormattingOptions, selectedPreset: '' };
        case 'SET_SELECTED_PRESET':
            return { ...state, selectedPreset: action.payload };
        case 'SAVE_PRESET': {
            const { name, options } = action.payload;
            const newPreset = { name, options };
            const existingIndex = state.presets.findIndex(p => p.name === name);
            let newPresets;
            if (existingIndex > -1) {
                newPresets = [...state.presets];
                newPresets[existingIndex] = newPreset;
            } else {
                newPresets = [...state.presets, newPreset];
            }
            try {
                localStorage.setItem('keepSyncPresets', JSON.stringify(newPresets));
                localStorage.setItem('keepSyncLastPreset', name);
            } catch (error) {
                console.error("Failed to save presets to localStorage", error);
            }
            return { ...state, presets: newPresets, selectedPreset: name };
        }
        case 'DELETE_PRESET': {
            const newPresets = state.presets.filter(p => p.name !== action.payload);
            try {
                localStorage.setItem('keepSyncPresets', JSON.stringify(newPresets));
                if (state.selectedPreset === action.payload) {
                    localStorage.removeItem('keepSyncLastPreset');
                    return { ...state, presets: newPresets, selectedPreset: '', namingOptions: initialNamingOptions, formattingOptions: initialFormattingOptions };
                }
            } catch (error) {
                console.error("Failed to save presets to localStorage", error);
            }
            return { ...state, presets: newPresets };
        }
        case 'SELECT_PRESET': {
            const name = action.payload;
            if (name === 'default' || !name) {
                try {
                    localStorage.removeItem('keepSyncLastPreset');
                } catch (error) {
                    console.error("Failed to update localStorage", error);
                }
                return { ...state, selectedPreset: '', namingOptions: initialNamingOptions, formattingOptions: initialFormattingOptions };
            }
            const preset = state.presets.find(p => p.name === name);
            if (preset) {
                try {
                    localStorage.setItem('keepSyncLastPreset', name);
                } catch (error) {
                    console.error("Failed to update localStorage", error);
                }
                return { ...state, selectedPreset: name, namingOptions: preset.options.naming, formattingOptions: preset.options.formatting };
            }
            return state; // If preset not found, do nothing
        }
        default:
            return state;
    }
};

// --- Hook ---

// On the server, we need to return a static, default snapshot.
// The client will then hydrate and load the actual state from localStorage.
const serverSnapshot: PresetsState = {
    presets: [],
    namingOptions: initialNamingOptions,
    formattingOptions: initialFormattingOptions,
    selectedPreset: '',
};

const getServerSnapshot = () => {
    return serverSnapshot;
};

export const usePresets = () => {
    const { presets, namingOptions, formattingOptions, selectedPreset } = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
    );
    
    // This effect runs only on the client to load data from localStorage
    useEffect(() => {
        try {
            const savedPresets = localStorage.getItem('keepSyncPresets');
            if (savedPresets) {
                dispatch({ type: 'SET_PRESETS', payload: JSON.parse(savedPresets) as Preset[] });
            }
            const savedLastPreset = localStorage.getItem('keepSyncLastPreset');
            if (savedLastPreset) {
                dispatch({ type: 'SELECT_PRESET', payload: savedLastPreset });
            }
        } catch (error) {
            console.error("Failed to load presets from localStorage", error);
        }
    }, []);
    
    return {
        presets,
        namingOptions,
        setNamingOptions: (value: NamingOptions | ((prev: NamingOptions) => NamingOptions)) => dispatch({ type: 'SET_NAMING_OPTIONS', payload: value }),
        formattingOptions,
        setFormattingOptions: (value: FormattingOptions | ((prev: FormattingOptions) => FormattingOptions)) => dispatch({ type: 'SET_FORMATTING_OPTIONS', payload: value }),
        selectedPreset,
        handleSelectPreset: (name: string) => dispatch({ type: 'SELECT_PRESET', payload: name }),
        handleSavePreset: (name: string) => dispatch({ type: 'SAVE_PRESET', payload: { name, options: { naming: memoryState.namingOptions, formatting: memoryState.formattingOptions } } }),
        handleDeletePreset: (name: string) => dispatch({ type: 'DELETE_PRESET', payload: name }),
    };
};
