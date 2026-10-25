import colors from "tailwindcss/colors";
import { EmbedColor } from "@/features/embed/entity";

interface Props {
  baseColor: EmbedColor | null;
  brandColor: EmbedColor | null;
}

// NOTE: app/globals.css の :root より確実に優先されるよう、詳細度の高い html:root で上書きする
export function EmbedColorStyle({ baseColor, brandColor }: Props) {
  if (!baseColor && !brandColor) {
    return null;
  }

  const baseDeclarations = baseColor
    ? Object.keys(colors[baseColor]).map(
        (shade) => `--base-${shade}: var(--color-${baseColor}-${shade});`,
      )
    : [];
  const brandDeclarations = brandColor
    ? [`--brand: var(--color-${brandColor}-500);`]
    : [];
  const declarations = [...baseDeclarations, ...brandDeclarations].join(" ");

  return (
    <style href="embed-color" precedence="high">
      {`html:root { ${declarations} }`}
    </style>
  );
}
