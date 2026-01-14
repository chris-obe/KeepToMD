
"use client"

import { useEffect, useSyncExternalStore } from 'react';
import { type NamingOptions, type FormattingOptions } from '@/ai/schemas';
import { STORAGE_KEYS } from '@/lib/storage-keys';

export type NamingPreset = {
  name: string;
  options: NamingOptions;
};

export type MarkdownPreset = {
  name: string;
  options: FormattingOptions;
}

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
    fillerText: 'Untitled',
};

const initialFormattingOptions: FormattingOptions = {
    tagHandling: 'hash',
    checkboxStyle: 'markdown',
};

const normalizeFormattingOptions = (
  options: Partial<FormattingOptions>,
): FormattingOptions => ({
  ...initialFormattingOptions,
  ...options,
});

type PresetsState = {
  namingPresets: NamingPreset[];
  markdownPresets: MarkdownPreset[];
  namingOptions: NamingOptions;
  formattingOptions: FormattingOptions;
  selectedNamingPreset: string;
  selectedMarkdownPreset: string;
};

// --- Global state management ---

let memoryState: PresetsState = {
    namingPresets: [],
    markdownPresets: [],
    namingOptions: initialNamingOptions,
    formattingOptions: initialFormattingOptions,
    selectedNamingPreset: '',
    selectedMarkdownPreset: '',
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
  | { type: 'SET_NAMING_PRESETS'; payload: NamingPreset[] }
  | { type: 'SET_MARKDOWN_PRESETS'; payload: MarkdownPreset[] }
  | { type: 'SET_NAMING_OPTIONS'; payload: NamingOptions | ((prev: NamingOptions) => NamingOptions) }
  | { type: 'SET_FORMATTING_OPTIONS'; payload: FormattingOptions | ((prev: FormattingOptions) => FormattingOptions) }
  | { type: 'SAVE_NAMING_PRESET'; payload: { name: string; options: NamingOptions } }
  | { type: 'DELETE_NAMING_PRESET'; payload: string }
  | { type: 'SELECT_NAMING_PRESET'; payload: string }
  | { type: 'SAVE_MARKDOWN_PRESET'; payload: { name: string; options: FormattingOptions } }
  | { type: 'DELETE_MARKDOWN_PRESET'; payload: string }
  | { type: 'SELECT_MARKDOWN_PRESET'; payload: string };


const reducer = (state: PresetsState, action: Action): PresetsState => {
    switch (action.type) {
        case 'SET_NAMING_PRESETS':
            return { ...state, namingPresets: action.payload };
        case 'SET_MARKDOWN_PRESETS':
            return { ...state, markdownPresets: action.payload };

        case 'SET_NAMING_OPTIONS':
            const newNamingOptions = typeof action.payload === 'function' ? action.payload(state.namingOptions) : action.payload;
            return { ...state, namingOptions: newNamingOptions, selectedNamingPreset: '' };

        case 'SET_FORMATTING_OPTIONS': {
            const nextOptions = typeof action.payload === 'function'
              ? action.payload(state.formattingOptions)
              : action.payload;
            return {
              ...state,
              formattingOptions: normalizeFormattingOptions(nextOptions),
              selectedMarkdownPreset: '',
            };
        }

        case 'SAVE_NAMING_PRESET': {
            const { name, options } = action.payload;
            const newPreset = { name, options };
            const existingIndex = state.namingPresets.findIndex(p => p.name === name);
            let newPresets;
            if (existingIndex > -1) {
                newPresets = [...state.namingPresets];
                newPresets[existingIndex] = newPreset;
            } else {
                newPresets = [...state.namingPresets, newPreset];
            }
            try {
                localStorage.setItem(STORAGE_KEYS.namingPresets, JSON.stringify(newPresets));
                localStorage.setItem(STORAGE_KEYS.lastNamingPreset, name);
            } catch (error) { console.error("Failed to save naming presets", error); }
            return { ...state, namingPresets: newPresets, selectedNamingPreset: name };
        }
        case 'DELETE_NAMING_PRESET': {
            const newPresets = state.namingPresets.filter(p => p.name !== action.payload);
            try {
                localStorage.setItem(STORAGE_KEYS.namingPresets, JSON.stringify(newPresets));
                if (state.selectedNamingPreset === action.payload) {
                    localStorage.removeItem(STORAGE_KEYS.lastNamingPreset);
                    return { ...state, namingPresets: newPresets, selectedNamingPreset: '', namingOptions: initialNamingOptions };
                }
            } catch (error) { console.error("Failed to delete naming preset", error); }
            return { ...state, namingPresets: newPresets };
        }
        case 'SELECT_NAMING_PRESET': {
            const name = action.payload;
            if (name === 'default' || !name) {
                try { localStorage.removeItem(STORAGE_KEYS.lastNamingPreset); } catch (e) {}
                return { ...state, selectedNamingPreset: '', namingOptions: initialNamingOptions };
            }
            const preset = state.namingPresets.find(p => p.name === name);
            if (preset) {
                try { localStorage.setItem(STORAGE_KEYS.lastNamingPreset, name); } catch (e) {}
                return { ...state, selectedNamingPreset: name, namingOptions: preset.options };
            }
            return state;
        }

        case 'SAVE_MARKDOWN_PRESET': {
            const { name, options } = action.payload;
            const newPreset = { name, options };
            const existingIndex = state.markdownPresets.findIndex(p => p.name === name);
            let newPresets;
            if (existingIndex > -1) {
                newPresets = [...state.markdownPresets];
                newPresets[existingIndex] = newPreset;
            } else {
                newPresets = [...state.markdownPresets, newPreset];
            }
            try {
                localStorage.setItem(STORAGE_KEYS.markdownPresets, JSON.stringify(newPresets));
                localStorage.setItem(STORAGE_KEYS.lastMarkdownPreset, name);
            } catch (error) { console.error("Failed to save markdown presets", error); }
            return { ...state, markdownPresets: newPresets, selectedMarkdownPreset: name };
        }
        case 'DELETE_MARKDOWN_PRESET': {
            const newPresets = state.markdownPresets.filter(p => p.name !== action.payload);
            try {
                localStorage.setItem(STORAGE_KEYS.markdownPresets, JSON.stringify(newPresets));
                if (state.selectedMarkdownPreset === action.payload) {
                    localStorage.removeItem(STORAGE_KEYS.lastMarkdownPreset);
                    return { ...state, markdownPresets: newPresets, selectedMarkdownPreset: '', formattingOptions: initialFormattingOptions };
                }
            } catch (error) { console.error("Failed to delete markdown preset", error); }
            return { ...state, markdownPresets: newPresets };
        }
        case 'SELECT_MARKDOWN_PRESET': {
            const name = action.payload;
            if (name === 'default' || !name) {
                try { localStorage.removeItem(STORAGE_KEYS.lastMarkdownPreset); } catch (e) {}
                return { ...state, selectedMarkdownPreset: '', formattingOptions: initialFormattingOptions };
            }
            const preset = state.markdownPresets.find(p => p.name === name);
            if (preset) {
                try { localStorage.setItem(STORAGE_KEYS.lastMarkdownPreset, name); } catch (e) {}
                return {
                  ...state,
                  selectedMarkdownPreset: name,
                  formattingOptions: normalizeFormattingOptions(preset.options),
                };
            }
            return state;
        }

        default:
            return state;
    }
};

// --- Hook ---
const serverSnapshot: PresetsState = {
    namingPresets: [],
    markdownPresets: [],
    namingOptions: initialNamingOptions,
    formattingOptions: initialFormattingOptions,
    selectedNamingPreset: '',
    selectedMarkdownPreset: '',
};

const getServerSnapshot = () => {
    return serverSnapshot;
};

export const usePresets = () => {
    const state = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot
    );
    
    useEffect(() => {
        try {
            const savedNamingPresets = localStorage.getItem(STORAGE_KEYS.namingPresets);
            if (savedNamingPresets) {
                dispatch({ type: 'SET_NAMING_PRESETS', payload: JSON.parse(savedNamingPresets) as NamingPreset[] });
            }
            const lastNamingPreset = localStorage.getItem(STORAGE_KEYS.lastNamingPreset);
            if (lastNamingPreset) {
                dispatch({ type: 'SELECT_NAMING_PRESET', payload: lastNamingPreset });
            }

            const savedMarkdownPresets = localStorage.getItem(STORAGE_KEYS.markdownPresets);
            if (savedMarkdownPresets) {
                const parsed = JSON.parse(savedMarkdownPresets) as MarkdownPreset[];
                const normalized = parsed.map((preset) => ({
                  ...preset,
                  options: normalizeFormattingOptions(preset.options),
                }));
                dispatch({ type: 'SET_MARKDOWN_PRESETS', payload: normalized });
            }
            const lastMarkdownPreset = localStorage.getItem(STORAGE_KEYS.lastMarkdownPreset);
            if (lastMarkdownPreset) {
                dispatch({ type: 'SELECT_MARKDOWN_PRESET', payload: lastMarkdownPreset });
            }
        } catch (error) {
            console.error("Failed to load presets from localStorage", error);
        }
    }, []);
    
    return {
        ...state,
        setNamingOptions: (value: NamingOptions | ((prev: NamingOptions) => NamingOptions)) => dispatch({ type: 'SET_NAMING_OPTIONS', payload: value }),
        setFormattingOptions: (value: FormattingOptions | ((prev: FormattingOptions) => FormattingOptions)) => dispatch({ type: 'SET_FORMATTING_OPTIONS', payload: value }),
        
        handleSelectNamingPreset: (name: string) => dispatch({ type: 'SELECT_NAMING_PRESET', payload: name }),
        handleSaveNamingPreset: (name: string) => dispatch({ type: 'SAVE_NAMING_PRESET', payload: { name, options: memoryState.namingOptions } }),
        handleDeleteNamingPreset: (name: string) => dispatch({ type: 'DELETE_NAMING_PRESET', payload: name }),

        handleSelectMarkdownPreset: (name: string) => dispatch({ type: 'SELECT_MARKDOWN_PRESET', payload: name }),
        handleSaveMarkdownPreset: (name: string) => dispatch({ type: 'SAVE_MARKDOWN_PRESET', payload: { name, options: memoryState.formattingOptions } }),
        handleDeleteMarkdownPreset: (name: string) => dispatch({ type: 'DELETE_MARKDOWN_PRESET', payload: name }),
    };
};

    
