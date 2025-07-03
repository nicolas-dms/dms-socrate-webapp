"use client";
import { useRouter } from "next/navigation";
import Button from "react-bootstrap/Button";
import ProtectedPage from "../../components/ProtectedPage";

export default function GeneratePage() {
  const router = useRouter();

  return (
    <ProtectedPage>
      <div className="container mt-5" style={{ maxWidth: 500 }}>
        <h2 className="mb-4">Generate Exercises</h2>
        <div className="d-flex flex-column gap-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => router.push("/generate/math")}
          >
            Math
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/generate/french")}
          >
            French
          </Button>
        </div>
      </div>
    </ProtectedPage>
  );
}
