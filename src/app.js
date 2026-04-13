import Koa from "koa";
import bodyParser from "@koa/bodyparser";
import cors from "@koa/cors";
import serve from "koa-static";
import path from "path";
import { fileURLToPath } from "url";
import { port } from "./config.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { usersRouter } from "./routes/users.js";
import { robotActionsRouter } from "./routes/robotActions.js";
import { actionGroupsRouter } from "./routes/actionGroups.js";
import { uploadsRouter } from "./routes/uploads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const app = new Koa();

app.use(errorHandler());
app.use(
  cors({
    origin(ctx) {
      return ctx.get("Origin") || "*";
    },
    allowMethods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Accept", "Authorization"],
  }),
);
app.use(
  bodyParser({
    jsonLimit: "20mb",
    formLimit: "20mb",
    textLimit: "20mb",
  }),
);

app.use(usersRouter.routes()).use(usersRouter.allowedMethods());
app.use(robotActionsRouter.routes()).use(robotActionsRouter.allowedMethods());
app.use(actionGroupsRouter.routes()).use(actionGroupsRouter.allowedMethods());
app.use(uploadsRouter.routes()).use(uploadsRouter.allowedMethods());
app.use(serve(publicDir));

app.use(async (ctx) => {
  if (!ctx.body) {
    ctx.status = 404;
    ctx.body = { ok: false, message: "未找到接口" };
  }
});

app.on("error", (err, ctx) => {
  if (ctx.status === 500 || !ctx.status) {
    console.error(err);
  }
});

app.listen(port, () => {
  console.log(`Magos API  listening on http://127.0.0.1:${port}`);
});
