export function errorHandler() {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      const status = err.status || err.statusCode || 500;
      ctx.status = status;
      ctx.body = {
        ok: false,
        message: err.expose ? err.message : status === 500 ? "服务器内部错误" : err.message,
      };
      if (status === 500 && process.env.NODE_ENV !== "production") {
        ctx.body.detail = err.message;
      }
      ctx.app.emit("error", err, ctx);
    }
  };
}
