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

function DialogMessage({ message }: { message: string }) {
  return (
    <p className="modal-message solo">
      {message.split("\n").map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </p>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "네",
  cancelLabel = "아니오",
  onConfirm,
  onCancel,
}: {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalOverlay>
      {title ? <h2 className="modal-title">{title}</h2> : null}
      {title ? <p className="modal-message">{message}</p> : <DialogMessage message={message} />}
      <div className="modal-actions">
        <button className="modal-cancel" type="button" onClick={onCancel}>{cancelLabel}</button>
        <button className="modal-confirm" type="button" onClick={onConfirm}>{confirmLabel}</button>
      </div>
    </ModalOverlay>
  );
}

export function AlertDialog({
  title,
  message,
  onClose,
}: {
  title?: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <ModalOverlay onClose={onClose}>
      {title ? <h2 className="modal-title">{title}</h2> : null}
      {title ? <p className="modal-message">{message}</p> : <DialogMessage message={message} />}
      <button className="modal-confirm full" type="button" onClick={onClose}>확인</button>
    </ModalOverlay>
  );
}
