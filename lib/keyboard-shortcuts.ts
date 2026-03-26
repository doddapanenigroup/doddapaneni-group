import type { KeyBinding } from '@/lib/keyboard-shortcuts-config';

/** True if this key event matches a binding (composition-safe; ignores Alt combos). */
export function keyboardBindingMatches(e: KeyboardEvent, binding: KeyBinding): boolean {
  if (e.isComposing) return false;

  const want = binding.key.toLowerCase();
  const got = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
  if (got !== want) return false;

  const shift = binding.shift === true;
  if (shift !== e.shiftKey) return false;

  if (binding.mod) {
    if (!e.metaKey && !e.ctrlKey) return false;
  } else {
    if (e.metaKey || e.ctrlKey) return false;
  }

  if (e.altKey) return false;
  return true;
}

export function shortcutParts(binding: KeyBinding): {
  modLabel: string;
  shift: boolean;
  keyLabel: string;
} {
  const isApple =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const modLabel = binding.mod ? (isApple ? '⌘' : 'Ctrl') : '';
  return {
    modLabel,
    shift: binding.shift === true,
    keyLabel: binding.key.toUpperCase(),
  };
}
