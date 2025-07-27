"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedPage from "../../components/ProtectedPage";

export default function BuyCreditsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to subscription plans page
    router.replace('/subscription-plans');
  }, [router]);

  return (
    <ProtectedPage>
      <div className="container mt-5" style={{maxWidth: 500}}>
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Redirection...</span>
          </div>
          <p className="mt-3">Redirection vers les abonnements...</p>
        </div>
      </div>
    </ProtectedPage>
  );
}
