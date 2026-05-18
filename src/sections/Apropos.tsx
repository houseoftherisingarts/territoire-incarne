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
  <p className="mt-8 text-base md:text-lg leading-loose font-light text-stone-500 dark:text-stone-300 font-serif max-w-2xl">
    <GlossaryText content={content.longText} lang={lang} />
  </p>
);
