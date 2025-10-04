"use client";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import Button from "react-bootstrap/Button";
import ProtectedPage from "../../components/ProtectedPage";
import styles from "./generate.module.css";

export default function GeneratePage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ProtectedPage>
      <div className={styles.generatePage}>
        <div className={`container ${styles.pageContainer}`}>
          {/* Title Section */}
          <div className={styles.titleSection}>
            <h1 className={styles.mainTitle}>
              <i className="bi bi-pencil-square"></i>
              {t('generate.title')}
            </h1>
            <p className={styles.subtitle}>
              Choisissez la matière pour commencer à créer vos exercices personnalisés
            </p>
            <hr className={styles.divider} />
          </div>
          
          {/* Subject Cards */}
          <div className={styles.subjectsContainer}>
            {/* French Card */}
            <div 
              className={`${styles.subjectCard} ${styles.frenchCard}`}
              onClick={() => router.push("/generate/french")}
            >
              <div className={`${styles.cardIconContainer} ${styles.frenchIcon}`}>
                <i className="bi bi-book"></i>
              </div>
              <h2 className={styles.cardTitle}>
                {t('generate.french')}
              </h2>
              <p className={styles.cardDescription}>
                Créez des exercices de grammaire, conjugaison, orthographe et vocabulaire adaptés au niveau de vos élèves
              </p>
              <ul className={styles.featuresList}>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Grammaire et conjugaison</span>
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Orthographe et dictées</span>
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Lecture et compréhension</span>
                </li>
              </ul>
              <Button className={`${styles.cardButton} ${styles.frenchButton}`}>
                <span>Créer des exercices de français</span>
                <i className="bi bi-arrow-right"></i>
              </Button>
            </div>

            {/* Math Card */}
            <div 
              className={`${styles.subjectCard} ${styles.mathCard}`}
              onClick={() => router.push("/generate/math")}
            >
              <div className={`${styles.cardIconContainer} ${styles.mathIcon}`}>
                <i className="bi bi-calculator"></i>
              </div>
              <h2 className={styles.cardTitle}>
                {t('generate.math')}
              </h2>
              <p className={styles.cardDescription}>
                Générez des exercices de calcul, géométrie, problèmes et grandeurs pour tous les niveaux du primaire
              </p>
              <ul className={styles.featuresList}>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Calcul et opérations</span>
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Géométrie et mesures</span>
                </li>
                <li>
                  <i className="bi bi-check-circle-fill"></i>
                  <span>Problèmes et logique</span>
                </li>
              </ul>
              <Button className={`${styles.cardButton} ${styles.mathButton}`}>
                <span>Créer des exercices de maths</span>
                <i className="bi bi-arrow-right"></i>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
