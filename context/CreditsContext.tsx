"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { creditsService, CreditPackage } from "../services/exerciseService";
import { UserCredits } from "../services/userService";
import { useAuth } from "./AuthContext";

interface CreditsContextType {
  credits: UserCredits | null;
  packages: CreditPackage[];
  loading: boolean;
  refreshCredits: () => Promise<void>;
  purchaseCredits: (packageId: string, paymentData: any) => Promise<boolean>;
  useCredits: (amount: number) => Promise<void>;
  // Legacy support for existing code
  buyCredits?: (amount: number) => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

export const CreditsProvider = ({ children }: { children: React.ReactNode }) => {
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Load user credits and packages when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCreditsData();
    } else {
      setCredits(null);
      setPackages([]);
    }
  }, [isAuthenticated, user]);

  const loadCreditsData = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const [creditsData, packagesData] = await Promise.all([
        creditsService.getUserCredits(user.user_id),
        creditsService.getCreditPackages(),
      ]);
      setCredits(creditsData);
      setPackages(packagesData);
    } catch (error) {
      console.error("Failed to load credits data:", error);
      // Fallback to mock data in case backend is not available
      setCredits({ current_balance: 0, total_purchased: 0, total_used: 0 });
      setPackages([
        { id: '1', credits: 50, price: 5, currency: 'EUR' },
        { id: '2', credits: 200, price: 15, currency: 'EUR' },
        { id: '3', credits: 500, price: 30, currency: 'EUR' },
      ]);
    } finally {
      setLoading(false);
    }
  };
  const refreshCredits = async (): Promise<void> => {
    if (!user?.user_id) {
      console.error("User ID not available for credits refresh");
      return;
    }
    
    try {
      const creditsData = await creditsService.getUserCredits(user.user_id);
      setCredits(creditsData);
    } catch (error) {
      console.error("Failed to refresh credits:", error);
    }
  };
  const purchaseCredits = async (packageId: string, paymentData: any): Promise<boolean> => {
    if (!user?.user_id) {
      console.error("User ID not available for credit purchase");
      return false;
    }
    
    try {
      setLoading(true);
      const updatedCredits = await creditsService.purchaseCredits(user.user_id, packageId, paymentData);
      setCredits(updatedCredits);
      return true;
    } catch (error) {
      console.error("Failed to purchase credits:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to consume credits
  const useCredits = async (amount: number): Promise<void> => {
    if (!user?.user_id) {
      throw new Error("User ID not available for credit usage");
    }
    
    if (!credits || credits.current_balance < amount) {
      throw new Error("Insufficient credits");
    }
    
    try {
      // For now, update locally - in real app this would call backend
      setCredits({
        ...credits,
        current_balance: credits.current_balance - amount,
        total_used: credits.total_used + amount,
      });
      
      // TODO: Replace with actual API call
      // await creditsService.useCredits(user.user_id, amount);
    } catch (error) {
      console.error("Failed to use credits:", error);
      throw error;
    }
  };

  // Legacy support for existing buy credits function
  const buyCredits = async (amount: number): Promise<void> => {
    await new Promise(res => setTimeout(res, 1000));
    if (credits) {
      setCredits({
        ...credits,
        current_balance: credits.current_balance + amount,
        total_purchased: credits.total_purchased + amount,
      });
    }
  };
  return (
    <CreditsContext.Provider value={{
      credits,
      packages,
      loading,
      refreshCredits,
      purchaseCredits,
      useCredits,
      buyCredits,
    }}>
      {children}
    </CreditsContext.Provider>
  );
};

export const useCredits = () => {
  const context = useContext(CreditsContext);
  if (!context) throw new Error("useCredits must be used within CreditsProvider");
  return context;
};
