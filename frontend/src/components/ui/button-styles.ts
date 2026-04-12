const buttonBaseClassName =
  "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";

export const primaryButtonClassName =
  `${buttonBaseClassName} border border-black bg-black text-white hover:bg-black/85`;

export const secondaryButtonClassName =
  `${buttonBaseClassName} border border-black/15 bg-white text-foreground hover:bg-black/[0.03]`;

export const dangerButtonClassName =
  `${buttonBaseClassName} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`;

export const subtleTextButtonClassName = "text-xs font-medium underline underline-offset-4";
