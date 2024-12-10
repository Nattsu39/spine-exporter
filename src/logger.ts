import winston, { config, format } from 'winston';


export const logger = winston.createLogger({
	level: 'info',
	levels: config.syslog.levels,
	format: format.combine(
		format.colorize({ all: true }),
		format.timestamp(),
		format.printf((info) => {
			return `${info.timestamp} | ${info.level} | ${info.message}`
		})
	),
	transports: [
		new winston.transports.Console()
	],
});
