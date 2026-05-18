import { LazyMount } from "../common/LazyMount";

export const CalWidget = () => (
  <LazyMount
    className="w-full h-[600px] border border-stone-300 dark:border-stone-600 rounded-[30px] overflow-hidden bg-white dark:bg-stone-900"
    placeholder={<div className="w-full h-full" aria-hidden="true" />}
  >
    <iframe
      title="Cal.com booking"
      src="https://cal.com/elise-g-lortie/consultation?embed=true"
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      frameBorder="0"
    />
  </LazyMount>
);
