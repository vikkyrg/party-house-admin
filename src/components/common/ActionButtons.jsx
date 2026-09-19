export default function ActionButtons({ children, className = '' }) {
  return <div className={`actions-cell flex items-center justify-end gap-2 whitespace-nowrap ${className}`}>{children}</div>;
}
