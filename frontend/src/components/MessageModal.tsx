import { ReactNode } from 'react';
import { Modal, Button } from 'react-bootstrap';

interface MessageModalProps {
  show: boolean;
  title: string;
  message: string | ReactNode;
  onClose: () => void;
  variant?: 'success' | 'danger' | 'warning' | 'info';
  closeText?: string;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  show,
  title,
  message,
  onClose,
  variant = 'info',
  closeText = 'Close'
}) => {
  const getHeaderClass = () => {
    switch (variant) {
      case 'success':
        return 'bg-success text-white';
      case 'danger':
        return 'bg-danger text-white';
      case 'warning':
        return 'bg-warning';
      case 'info':
        return 'bg-info text-white';
      default:
        return '';
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton className={getHeaderClass()}>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onClose}> {closeText} </Button>
      </Modal.Footer>
    </Modal>
  );
};
