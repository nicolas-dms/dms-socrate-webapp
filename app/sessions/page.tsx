"use client";
import Link from "next/link";
import ProtectedPage from "../../components/ProtectedPage";

export default function SessionsPage() {
  // In a real app, fetch session history from backend or local storage
  const mockSessions = [
    { id: 1, subject: "Math", level: "CE1", date: "2025-07-03", url: "/mock-math-session.pdf" },
    { id: 2, subject: "French", level: "CM2", date: "2025-07-02", url: "/mock-french-session.pdf" },
  ];

  return (
    <ProtectedPage>
      <div className="container mt-5" style={{maxWidth: 700}}>
        <h2 className="mb-4">My Sessions</h2>
        <table className="table table-bordered bg-white">
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Level</th>
              <th>Download</th>
            </tr>
          </thead>
          <tbody>
            {mockSessions.map(s => (
              <tr key={s.id}>
                <td>{s.date}</td>
                <td>{s.subject}</td>
                <td>{s.level}</td>
                <td><Link href={s.url} download>Download PDF</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProtectedPage>
  );
}
