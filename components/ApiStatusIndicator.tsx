import React from 'react';
import { Badge, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { useOpenAPI } from '../hooks/useOpenAPI';

interface ApiStatusIndicatorProps {
  showDetails?: boolean;
  size?: 'sm' | 'lg';
  className?: string;
}

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ 
  showDetails = false, 
  size = 'sm',
  className = '' 
}) => {
  const { isLoaded, totalEndpoints, apiInfo, lastSync } = useOpenAPI();

  const getStatusVariant = () => {
    if (!isLoaded) return 'danger';
    return 'success';
  };

  const getStatusText = () => {
    if (!isLoaded) return 'API Schema Not Loaded';
    return `API Ready (${totalEndpoints} endpoints)`;
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const tooltipContent = (
    <div>
      <div><strong>API:</strong> {apiInfo?.title || 'Unknown'}</div>
      <div><strong>Version:</strong> {apiInfo?.version || 'Unknown'}</div>
      <div><strong>Endpoints:</strong> {totalEndpoints}</div>
      <div><strong>Last Sync:</strong> {formatLastSync()}</div>
    </div>
  );

  const indicator = (
    <Badge 
      bg={getStatusVariant()} 
      className={`${className} ${size === 'lg' ? 'fs-6 px-3 py-2' : ''}`}
    >
      {size === 'lg' && <span className="me-1">🔗</span>}
      {showDetails ? getStatusText() : (isLoaded ? '●' : '○')}
    </Badge>
  );

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="api-status-tooltip">{tooltipContent}</Tooltip>}
    >
      {indicator}
    </OverlayTrigger>
  );
};

export default ApiStatusIndicator;
