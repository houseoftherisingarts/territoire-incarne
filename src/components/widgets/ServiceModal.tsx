import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface Service {
  title: string;
  short: string;
  desc: string;
  image: string;
}

interface Props {
  service: Service | null;
  onClose: () => void;
  onBook: () => void;
  bookLabel: string;
}

export const ServiceModal = ({ service, onClose, onBook, bookLabel }: Props) => {
  if (!service) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={service.title}
    >
      <div
        className="bg-paper dark:bg-stone-900 w-full max-w-lg rounded-[30px] shadow-2xl relative animate-[fadeIn_0.3s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 w-full">
          <img src={service.image} className="w-full h-full object-cover" alt="" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-8">
          <span className="block text-xs font-sans tracking-widest text-rust dark:text-stone-400 mb-2 uppercase">
            {service.short}
          </span>
          <h3 className="font-serif text-3xl mb-6 text-ink dark:text-stone-100">{service.title}</h3>
          <p className="font-serif text-lg leading-relaxed text-stone-600 dark:text-stone-300 mb-8">
            {service.desc}
          </p>
          <button
            onClick={onBook}
            className="w-full py-3 bg-rust text-white dark:bg-white dark:text-forest text-xs uppercase tracking-widest hover:opacity-90 rounded-[30px]"
          >
            {bookLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
