// Logger estruturado com níveis e timestamps
const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  dim: '\x1b[2m',
};

function timestamp() {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

function format(level: string, color: string, tag: string, message: string, data?: any) {
  const ts = `${COLORS.dim}[${timestamp()}]${COLORS.reset}`;
  const lvl = `${color}[${level}]${COLORS.reset}`;
  const t = `${COLORS.cyan}[${tag}]${COLORS.reset}`;
  const extra = data ? `\n  ${JSON.stringify(data, null, 2)}` : '';
  console.log(`${ts} ${lvl} ${t} ${message}${extra}`);
}

export const logger = {
  info: (tag: string, message: string, data?: any) =>
    format('INFO', COLORS.green, tag, message, data),
  warn: (tag: string, message: string, data?: any) =>
    format('WARN', COLORS.yellow, tag, message, data),
  error: (tag: string, message: string, data?: any) =>
    format('ERROR', COLORS.red, tag, message, data),
  debug: (tag: string, message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      format('DEBUG', COLORS.dim, tag, message, data);
    }
  },
};
