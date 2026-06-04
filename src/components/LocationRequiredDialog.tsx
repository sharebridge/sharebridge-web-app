type Props = {
  message: string;
  onClose: () => void;
};

export function LocationRequiredDialog({ message, onClose }: Props) {
  return (
    <div
      className="dialog-backdrop"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="location-required-title"
    >
      <div className="dialog-card">
        <h2 id="location-required-title">Location required</h2>
        <p>{message}</p>
        <div className="dialog-actions">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
