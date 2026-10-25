import colors from "tailwindcss/colors";
import { EmbedColor } from "@/features/embed/entity";

interface Props {
  color: EmbedColor;
}

// NOTE: app/globals.css の :root より確実に優先されるよう、詳細度の高い html:root で上書きする
export function EmbedColorStyle({ color }: Props) {
  const baseDeclarations = Object.keys(colors[color])
    .map((shade) => `--base-${shade}: var(--color-${color}-${shade});`)
    .join(" ");

  return (
    <style href="embed-color" precedence="high">
      {`html:root { ${baseDeclarations} }`}
    </style>
  );
}
