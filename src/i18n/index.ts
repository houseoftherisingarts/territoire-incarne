import type { Lang } from "../types";
import { fr } from "./fr";
import { en } from "./en";

export const CONTENT = { fr, en } as const;

export const getContent = (lang: Lang) => CONTENT[lang];

export type { Content } from "./fr";
export { GLOSSARY } from "./glossary";
