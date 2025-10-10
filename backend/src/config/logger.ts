import winston from 'winston';
import path from 'path';

// Read configuration from environment variables
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || 'logs/app.log';
const LOG_ERROR_FILE_PATH = process.env.LOG_ERROR_FILE_PATH || 'logs/error.log';
const LOG_ENABLE_FILE = process.env.LOG_ENABLE_FILE === 'true'; // Default false (console only)
const LOG_ENABLE_CONSOLE = process.env.LOG_ENABLE_CONSOLE !== 'false'; // Default true
const NODE_ENV = process.env.NODE_ENV || 'development';

const isDevelopment = NODE_ENV === 'development';

// Custom format for development - colorized and human-readable
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Custom format for production - JSON for log aggregation
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport
if (LOG_ENABLE_CONSOLE) {
  transports.push(
    new winston.transports.Console({
      format: isDevelopment ? developmentFormat : productionFormat,
    })
  );
}

// File transports for production/staging or if explicitly enabled
if (LOG_ENABLE_FILE) {
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), LOG_FILE_PATH),
      format: productionFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );

  // Error-only log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), LOG_ERROR_FILE_PATH),
      level: 'error',
      format: productionFormat,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: LOG_LEVEL,
  transports,
  // Don't exit on error
  exitOnError: false,
});

// Create a stream object for Morgan/Express integration
export const loggerStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

export default logger;
