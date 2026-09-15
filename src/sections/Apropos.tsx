import { GlossaryText } from "../components/common/GlossaryText";
import { EditableText } from "../components/edit/EditableText";
import type { Content } from "../i18n";
import type { Lang } from "../types";

export const Apropos = ({
  lang,
}: {
  content: Content["sections"]["apropos"];
  lang: Lang;
}) => (
  <p className="text-lg md:text-xl leading-relaxed font-light text-ink/75 dark:text-stone-300 font-serif max-w-2xl">
    <EditableText i18n="sections.apropos.longText" multiline>{(x) => <GlossaryText content={x} lang={lang} />}</EditableText>
  </p>
);
