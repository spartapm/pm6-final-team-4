"use client";

import { ReactNode } from "react";

export function ModalOverlay({ children, onClose }: { children: ReactNode; onClose?: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay onClose={onCancel}>
      <h2>{title}</h2>
      <p>{message}</p>
      <div className="modal-actions">
        <button className="ghost-button" onClick={onCancel}>{cancelLabel}</button>
        <button className="primary-button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </ModalOverlay>
  );
}

export function AlertDialog({
  title,
  message,
  onClose,
}: {
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      <h2>{title}</h2>
      <p>{message}</p>
      <button className="primary-button" onClick={onClose}>확인</button>
    </ModalOverlay>
  );
}
