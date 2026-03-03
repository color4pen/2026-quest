import { ReactNode } from 'react';
import './Modal.css';

export type ModalVariant = 'default' | 'battle' | 'dialogue' | 'shop' | 'danger';

interface ModalProps {
  children: ReactNode;
  variant?: ModalVariant;
  className?: string;
}

export function Modal({ children, variant = 'default', className = '' }: ModalProps) {
  return (
    <div className="modal-overlay">
      <div className={`modal-container modal-${variant} ${className}`}>
        {children}
      </div>
    </div>
  );
}

interface ModalHeaderProps {
  children: ReactNode;
  className?: string;
}

export function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <div className={`modal-header ${className}`}>
      {children}
    </div>
  );
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`modal-body ${className}`}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`modal-footer ${className}`}>
      {children}
    </div>
  );
}
