const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    return JSON.stringify(logEntry, null, 2);
  }

  writeLog(filename, content) {
    const logFile = path.join(this.logDir, filename);
    fs.appendFileSync(logFile, content + '\n');
  }

  info(message, data = null) {
    const formatted = this.formatMessage('INFO', message, data);
    console.log(`ℹ️  ${message}`);
    this.writeLog('integration.log', formatted);
  }

  error(message, data = null) {
    const formatted = this.formatMessage('ERROR', message, data);
    console.error(`❌ ${message}`);
    this.writeLog('integration.log', formatted);
    this.writeLog('errors.log', formatted);
  }

  warn(message, data = null) {
    const formatted = this.formatMessage('WARN', message, data);
    console.warn(`⚠️  ${message}`);
    this.writeLog('integration.log', formatted);
  }

  debug(message, data = null) {
    const formatted = this.formatMessage('DEBUG', message, data);
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(`🔧 ${message}`);
    }
    this.writeLog('debug.log', formatted);
  }

  apiCall(method, url, request = null, response = null) {
    const apiLog = {
      timestamp: new Date().toISOString(),
      method,
      url,
      request,
      response
    };
    this.writeLog('api-calls.log', JSON.stringify(apiLog, null, 2));
  }
}

module.exports = new Logger();