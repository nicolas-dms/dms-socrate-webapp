"use client";
import React, { createContext, useContext, useState } from "react";

interface CreditsContextType {
  credits: number;
  buyCredits: (amount: number) => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const CreditsProvider = ({ children }: { children: React.ReactNode }) => {
  const [credits, setCredits] = useState(0);

  // Mock buyCredits simulates a backend/Stripe call
  const buyCredits = async (amount: number) => {
    await new Promise(res => setTimeout(res, 1000)); // simulate delay
    setCredits(c => c + amount);
  };

  return (
    <CreditsContext.Provider value={{ credits, buyCredits }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) throw new Error("useCredits must be used within CreditsProvider");
  return context;
};
