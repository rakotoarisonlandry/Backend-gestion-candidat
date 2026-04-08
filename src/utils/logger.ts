import pino from "pino";

export const logger = pino({
  level: "info",
  transport: process.env.NODE_ENV !== "production"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss.l",
          ignore: "pid,hostname",
          customColors: "message:white",
          sync: true,  
        },
      }
    : undefined,
});