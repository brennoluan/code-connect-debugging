let logger = null;

if (typeof window === "undefined") {
  logger = (await import("./logger.js")).default;
}

function formatEventContext(userId, extra = {}) {
  return {
    timestamp: new Date().toISOString(),
    timezone:
      typeof window !== "undefined"
        ? Intl.DateTimeFormat().resolvedOptions().timeZone
        : process.env.TZ || "UTC",
    userId: userId || "anonymous",
    environment: process.env.NODE_ENV || "development",
    ...extra,
  };
}

export function logEvent({ step, operation, userId, metadata = {} }) {
  const context = formatEventContext(userId, {
    step,
    operation,
    ...metadata,
  });

  if (logger) {
    logger.info(`[EVENT] ${step} -> ${operation}`, context);
  } else {
    console.log(
      JSON.stringify({
        type: "[EVENT]",
        level: "info",
        step,
        operation,
        ...context,
      }),
    );
  }
}

export function logEventError({
  step,
  operation,
  userId,
  error,
  metadata = {},
}) {
  const context = formatEventContext(userId, {
    step,
    operation,
    error,
    ...metadata,
  });

  if (logger) {
    logger.error(`[EVENT ERROR] ${step} -> ${operation}`, context);
  } else {
    console.error(
      JSON.stringify({
        type: "[EVENT ERROR]",
        level: "error",
        step,
        operation,
        ...context,
      }),
    );
  }
}
