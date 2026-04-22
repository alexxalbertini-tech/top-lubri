import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Mover foco para o próximo campo ao apertar Enter
 */
export function handleEnterToNext(e: KeyboardEvent) {
  if (e.key === "Enter") {
    const target = e.target as HTMLElement;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
    
    // Se for um botão de submit, não interfere
    if (target instanceof HTMLInputElement && target.type === "submit") return;
    
    const form = target.closest("form");
    if (!form) return;

    const elements = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
      )
    ).filter(el => {
      // Filtra apenas elementos visíveis
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    const index = elements.indexOf(target);

    if (index > -1 && index < elements.length - 1) {
      e.preventDefault();
      const nextElement = elements[index + 1];
      nextElement.focus();
      
      // Auto-scroll para o campo focado
      nextElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}

/**
 * Fecha o teclado removendo o foco do elemento ativo
 */
export function closeKeyboard() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
