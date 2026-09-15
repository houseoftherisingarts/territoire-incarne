import { GlossaryText } from "../components/common/GlossaryText";
import type { Content } from "../i18n";
import type { Lang } from "../types";

export const Apropos = ({
  content,
  lang,
}: {
  content: Content["sections"]["apropos"];
  lang: Lang;
}) => (
  <p className="text-lg md:text-xl leading-relaxed font-light text-ink/75 dark:text-stone-300 font-serif max-w-2xl">
    <GlossaryText content={content.longText} lang={lang} />
  </p>
);
