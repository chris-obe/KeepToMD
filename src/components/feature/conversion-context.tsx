"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type ConversionContextValue = {
  files: File[];
  setFiles: (files: File[]) => void;
  clearFiles: () => void;
};

const ConversionContext = createContext<ConversionContextValue | undefined>(
  undefined
);

export function ConversionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [files, setFilesState] = useState<File[]>([]);

  const value = useMemo(
    () => ({
      files,
      setFiles: setFilesState,
      clearFiles: () => setFilesState([]),
    }),
    [files]
  );

  return (
    <ConversionContext.Provider value={value}>
      {children}
    </ConversionContext.Provider>
  );
}

export function useConversionFiles() {
  const context = useContext(ConversionContext);
  if (!context) {
    throw new Error("useConversionFiles must be used within ConversionProvider");
  }
  return context;
}
