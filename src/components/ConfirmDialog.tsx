type Props = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  confirming = false,
  onConfirm,
  onCancel
}: Props) {
  return (
    <div
      className="dialog-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
    >
      <div className="dialog-card">
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-message">{message}</p>
        <div className="dialog-actions dialog-actions-split">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={confirming}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={confirming}
            onClick={onConfirm}
          >
            {confirming ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
