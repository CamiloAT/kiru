export const TEMPLATE_CONFIGS = {
  extended: {
    label: 'Extendida',
    description: 'Letras, números, puntuación, símbolos matemáticos y tildes.',
    chars: [
      ...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''),
      ...'abcdefghijklmnñopqrstuvwxyz'.split(''),
      ...'0123456789'.split(''),
      ...'ÁÉÍÓÚÜáéíóúü'.split(''),
      ...`.,:;!¡?¿'"()-=_+*/\\|@#$%&<>[]{}~^\``.split(''),
    ],
    cols: 10,
  },
  full: {
    label: 'Básica',
    description: 'A-Z, a-z, 0-9 y símbolos básicos con ñ y tildes.',
    chars: [
      ...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''),
      ...'abcdefghijklmnñopqrstuvwxyz'.split(''),
      ...'0123456789'.split(''),
      ...'.,:;!¡?¿\'"()-áéíóúü'.split(''),
    ],
    cols: 9,
  },
  uppercase: {
    label: 'Solo Mayúsculas',
    description: 'A-Z incluyendo la Ñ.',
    chars: 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split(''),
    cols: 9,
  },
  lowercase: {
    label: 'Solo Minúsculas',
    description: 'a-z incluyendo la ñ.',
    chars: 'abcdefghijklmnñopqrstuvwxyz'.split(''),
    cols: 9,
  },
  digits: {
    label: 'Solo Números',
    description: 'Números del 0 al 9.',
    chars: '0123456789'.split(''),
    cols: 5,
  },
};
