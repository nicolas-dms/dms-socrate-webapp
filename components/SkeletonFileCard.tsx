import React from 'react';

interface SkeletonFileCardProps {
  count?: number;
}

const SkeletonFileCard: React.FC<SkeletonFileCardProps> = ({ count = 3 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          style={{
            border: '2px solid #e9ecef',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '0.75rem',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}
        >
          <div className="row align-items-center">
            {/* Left side - File info skeleton */}
            <div className="col-md-6 col-lg-7">
              <div className="d-flex align-items-start gap-3">
                {/* Icon skeleton */}
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '4px',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />

                <div className="flex-grow-1">
                  {/* Title skeleton */}
                  <div
                    style={{
                      height: '20px',
                      width: '70%',
                      borderRadius: '4px',
                      marginBottom: '0.75rem',
                      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite'
                    }}
                  />

                  {/* Badges skeleton */}
                  <div className="d-flex gap-2 mb-2">
                    <div
                      style={{
                        height: '18px',
                        width: '60px',
                        borderRadius: '4px',
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    />
                    <div
                      style={{
                        height: '18px',
                        width: '60px',
                        borderRadius: '4px',
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    />
                  </div>

                  {/* Tags skeleton */}
                  <div className="d-flex gap-1">
                    <div
                      style={{
                        height: '16px',
                        width: '50px',
                        borderRadius: '4px',
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    />
                    <div
                      style={{
                        height: '16px',
                        width: '50px',
                        borderRadius: '4px',
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Buttons skeleton */}
            <div className="col-md-6 col-lg-5">
              <div className="d-flex gap-2 justify-content-end">
                <div
                  style={{
                    height: '36px',
                    width: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
                <div
                  style={{
                    height: '36px',
                    width: '40px',
                    borderRadius: '8px',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Inject keyframes animation */}
          <style jsx>{`
            @keyframes shimmer {
              0% {
                background-position: 200% 0;
              }
              100% {
                background-position: -200% 0;
              }
            }
          `}</style>
        </div>
      ))}
    </>
  );
};

export default SkeletonFileCard;
