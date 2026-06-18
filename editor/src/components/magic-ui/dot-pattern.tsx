import { cn } from "@/lib/utils";

type DotPatternProps = {
  className?: string;
  width?: number;
  height?: number;
  cx?: number;
  cy?: number;
  cr?: number;
};

export function DotPattern({
  className,
  width = 16,
  height = 16,
  cx = 1,
  cy = 1,
  cr = 1,
}: DotPatternProps) {
  const id = "dot-pattern";

  return (
    <svg
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 h-full w-full opacity-20", className)}
    >
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <circle cx={cx} cy={cy} r={cr} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
