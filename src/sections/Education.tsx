import { useState } from "react";
import { Mic, Play, Video } from "lucide-react";
import { InterventionRequestModal } from "../components/widgets/InterventionRequestModal";
import { INTERVENTION_CONFIGS } from "../lib/interventionFields";
import type { Content } from "../i18n";

export const Education = ({ content }: { content: Content["sections"]["education"] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [showRequest, setShowRequest] = useState(false);

  return (
    <div className="space-y-8 animate-[fadeIn_1s_ease-out]">
      {showRequest && (
        <InterventionRequestModal
          config={INTERVENTION_CONFIGS.education}
          onClose={() => setShowRequest(false)}
        />
      )}
      <div className="flex border-b border-stone-300 dark:border-stone-600">
        {content.tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-6 py-4 font-sans text-xs tracking-widest uppercase transition-colors ${
              activeTab === i
                ? "text-rust dark:text-white border-b-2 border-rust dark:border-white -mb-px"
                : "text-stone-500 dark:text-stone-400 hover:text-ink dark:hover:text-stone-200"
            }`}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="min-h-[300px] py-4">
        {content.tabs[activeTab].content.map((item, j) => (
          <div key={j} className="flex items-center gap-4 mb-6 group cursor-default">
            <span className="font-serif text-2xl text-stone-300 dark:text-stone-600 italic">0{j + 1}</span>
            <h3 className="text-2xl font-light text-ink dark:text-stone-100 group-hover:text-rust dark:group-hover:text-white transition-colors">
              {item}
            </h3>
          </div>
        ))}
      </div>

      <div className="pt-8 border-t border-stone-300 dark:border-stone-600">
        <h3 className="text-2xl font-light mb-6 flex items-center gap-3">
          <Mic size={20} className="text-rust dark:text-stone-400 opacity-60" />
          {content.bookConfTitle}
        </h3>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 dark:bg-white/5 p-6 rounded-[30px] border border-stone-200 dark:border-stone-700">
          <p className="font-serif italic text-stone-600 dark:text-stone-300 flex-1">{content.bookConfText}</p>
          <button
            onClick={() => setShowRequest(true)}
            className="shrink-0 px-6 py-2 bg-ink text-white dark:bg-white dark:text-forest rounded-full text-xs uppercase tracking-widest hover:bg-rust dark:hover:bg-rust dark:hover:text-paper transition-colors"
          >
            {content.bookConfBtn}
          </button>
        </div>
      </div>

      <div className="pt-12 border-t border-stone-300 dark:border-stone-600">
        <h3 className="text-2xl font-light mb-8 flex items-center gap-3">
          <Video size={20} className="text-rust dark:text-stone-400 opacity-60" />
          {content.videoSection.title}
        </h3>
        <div className="grid grid-cols-1 gap-8">
          {content.videoSection.items.map((vid, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row gap-6 p-4 border border-stone-200 dark:border-stone-700 rounded-[30px] hover:border-rust transition-colors bg-white/40 dark:bg-white/5 group"
            >
              <div className="w-full md:w-48 h-32 rounded-[20px] overflow-hidden relative shrink-0">
                <img src={vid.img} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt={vid.title} loading="lazy" decoding="async" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/0 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <Play size={16} className="ml-1 text-ink dark:text-white" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xl font-serif text-ink dark:text-stone-100">{vid.title}</h4>
                  <span className="font-bold text-rust dark:text-stone-300">{vid.price}</span>
                </div>
                <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">{vid.desc}</p>
                <button
                  disabled
                  className="self-start px-6 py-2 bg-ink/40 text-white dark:bg-white/40 dark:text-forest rounded-full text-xs uppercase tracking-widest cursor-not-allowed"
                >
                  Bientôt
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
