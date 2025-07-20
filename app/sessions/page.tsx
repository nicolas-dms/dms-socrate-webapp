"use client";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import ProtectedPage from "../../components/ProtectedPage";
import { useEffect, useState } from "react";
import { exerciseService, ExerciseSession } from "../../services/exerciseService";

export default function SessionsPage() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const userSessions = await exerciseService.getUserSessions();
        setSessions(userSessions);
      } catch (err) {
        console.error('Failed to load sessions:', err);
        setError('Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const handleDownload = async (sessionId: string) => {
    try {
      const blob = await exerciseService.downloadSessionPDF(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert(t('sessions.downloadError', 'Failed to download PDF'));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <ProtectedPage>
      <div className="container mt-5" style={{maxWidth: 700}}>
        <h2 className="mb-4">{t('sessions.title')}</h2>
        
        {loading && (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">{t('loading', 'Loading...')}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="alert alert-warning">
            {error}
          </div>
        )}

        {!loading && !error && (
          <table className="table table-bordered bg-white">
            <thead>
              <tr>
                <th>{t('sessions.date')}</th>
                <th>{t('sessions.subject')}</th>
                <th>{t('sessions.level')}</th>
                <th>{t('sessions.status')}</th>
                <th>{t('sessions.download')}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    {t('sessions.noSessions', 'No sessions found')}
                  </td>
                </tr>
              ) : (
                sessions.map(session => (
                  <tr key={session.id}>
                    <td>{formatDate(session.created_at)}</td>
                    <td>{t(`generate.${session.subject}`, session.subject)}</td>
                    <td>{session.level}</td>
                    <td>
                      <span className={`badge ${
                        session.status === 'completed' ? 'bg-success' :
                        session.status === 'pending' ? 'bg-warning' : 'bg-danger'
                      }`}>
                        {t(`sessions.statuses.${session.status}`, session.status)}
                      </span>
                    </td>
                    <td>
                      {session.status === 'completed' && session.pdf_url ? (
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleDownload(session.id)}
                        >
                          {t('sessions.downloadPDF')}
                        </button>
                      ) : (
                        <span className="text-muted">{t('sessions.notAvailable', 'Not available')}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </ProtectedPage>
  );
}
