export default function LoadingSpinner() {
  return (
    <div className="spinner" role="status" aria-live="polite">
      <span className="spinner-ring" />
      Loading jobs...
    </div>
  );
}
