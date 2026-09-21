import Breadcrumbs from './Breadcrumbs';

export default function PageHeader({ title, eyebrow, description, actions, showBreadcrumbs = true }) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        {showBreadcrumbs && <Breadcrumbs />}
        
        {eyebrow && (
          <span className="text-[11px] font-bold tracking-widest text-primary-600 uppercase mb-1.5 block">
            {eyebrow}
          </span>
        )}
        
        <h1 className="text-[28px] leading-tight font-black tracking-tight text-text-primary uppercase">{title}</h1>
        
        {description && (
          <p className="mt-2.5 text-[15px] text-text-secondary max-w-2xl">{description}</p>
        )}
      </div>
      
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
