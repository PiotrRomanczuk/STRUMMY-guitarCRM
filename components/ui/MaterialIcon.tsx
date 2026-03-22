import { cn } from '@/lib/utils';

interface MaterialIconProps {
  icon: string;
  className?: string;
  size?: number;
  fill?: boolean;
}

export function MaterialIcon({ icon, className, size = 24, fill = false }: MaterialIconProps) {
  return (
    <span
      className={cn('material-symbols-outlined select-none', className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      }}
    >
      {icon}
    </span>
  );
}
