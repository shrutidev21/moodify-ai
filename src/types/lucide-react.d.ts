declare module "lucide-react" {
  import * as React from "react";

  export type LucideIcon = React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & {
      size?: string | number;
      absoluteStrokeWidth?: boolean;
    } & React.RefAttributes<SVGSVGElement>
  >;

  export const ArrowRight: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Brain: LucideIcon;
  export const Check: LucideIcon;
  export const Clock3: LucideIcon;
  export const History: LucideIcon;
  export const ListMusic: LucideIcon;
  export const Loader2: LucideIcon;
  export const Moon: LucideIcon;
  export const Music2: LucideIcon;
  export const Play: LucideIcon;
  export const Radio: LucideIcon;
  export const Save: LucideIcon;
  export const Settings2: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Sun: LucideIcon;
  export const WandSparkles: LucideIcon;
}
