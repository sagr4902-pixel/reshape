/** Shared by the browser form and the server schema. */
export const HELP_ME_CHOOSE = 'help-me-choose';
export const NAME_MAX = 80;
export const COMMENT_MAX = 500;
// Letters (any script), spaces and a few name punctuation marks. No digits, URLs or markup.
export const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,79}$/u;
