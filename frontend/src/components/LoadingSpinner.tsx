import { Spinner } from 'react-bootstrap';

interface LoadingSpinnerProps { message?: string; centered?: boolean; }

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  centered = true
}) => {
  const className = centered ? 'text-center mt-5' : 'text-center';

  return (
    <div className={className}>
      <Spinner animation="border" role="status">
        <span className="visually-hidden">{message}</span>
      </Spinner>
      <p className="mt-2">{message}</p>
    </div>
  );
};
