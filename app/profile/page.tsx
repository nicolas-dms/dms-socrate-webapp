"use client";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import ProtectedPage from "../../components/ProtectedPage";
import Card from "react-bootstrap/Card";
import Badge from "react-bootstrap/Badge";

export default function Profile() {
  const { t } = useTranslation();
  const { user, isNewUser } = useAuth();
  
  return (
    <ProtectedPage>
      <div className="container mt-5">
        <h2 className="mb-4">{t('profile')}</h2>
        
        {user && (
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                {t('pages.userInfo')} 
                {isNewUser && <Badge bg="success" className="ms-2">{t('pages.newUser')}</Badge>}
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <strong>{t('auth.email')}:</strong>
                    <div>{user.email}</div>
                  </div>
                  <div className="mb-3">
                    <strong>{t('pages.username')}:</strong>
                    <div>{user.username}</div>
                  </div>
                  <div className="mb-3">
                    <strong>{t('pages.userId')}:</strong>
                    <div><code>{user.user_id}</code></div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <strong>{t('pages.profilePicture')}:</strong>
                    <div>
                      {user.profile_picture ? (
                        <img 
                          src={user.profile_picture} 
                          alt="Profile" 
                          className="rounded-circle"
                          style={{ width: 64, height: 64 }}
                        />
                      ) : (
                        <span className="text-muted">{t('pages.noProfilePicture')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Debug section */}
              <details className="mt-4">
                <summary className="text-muted" style={{ cursor: 'pointer' }}>
                  {t('pages.debugInfo')} 🔧
                </summary>
                <pre className="bg-light p-3 mt-2 rounded" style={{ fontSize: '0.85rem' }}>
{JSON.stringify(user, null, 2)}
                </pre>
              </details>
            </Card.Body>
          </Card>
        )}
        
        <p>{t('pages.profile')}</p>
      </div>
    </ProtectedPage>
  );
}
