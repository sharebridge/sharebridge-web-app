type ReferencePhotoDisplayProps = {
  thumbnailUrl?: string;
  viewUrl?: string;
  artifactId?: string;
  hasReferencePhoto?: boolean;
  compact?: boolean;
};

export function ReferencePhotoDisplay({
  thumbnailUrl,
  viewUrl,
  artifactId,
  hasReferencePhoto,
  compact = false,
}: ReferencePhotoDisplayProps) {
  const thumb = thumbnailUrl?.trim();
  const full = viewUrl?.trim();
  const href = full || thumb;

  if (thumb && href) {
    return (
      <div
        className={
          compact ? "reference-photo reference-photo--compact" : "reference-photo"
        }
      >
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="reference-photo-link"
        >
          <img
            src={thumb}
            alt="Seeker reference"
            className={
              compact
                ? "reference-photo-thumb reference-photo-thumb--compact"
                : "reference-photo-thumb"
            }
          />
        </a>
        {!compact ? (
          <p className="reference-photo-caption">
            <a href={href} target="_blank" rel="noopener noreferrer">
              View full image
            </a>
            {artifactId ? ` · ${artifactId}` : null}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <span>
      {hasReferencePhoto ? "Yes (no preview URL on record)" : "No"}
    </span>
  );
}
