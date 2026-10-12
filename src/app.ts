import express, { Express } from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import type { Container } from "./container.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import userRouter from "./routes/user.route.js";
import documentRouter from "./routes/document.route.js";

// only builds the Express app; starting it (listening) is the CLI's job
export const createApp = (container: Container): Express => {
    const app = express();

    app.use(helmet());

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(cookieParser());

    app.use(morgan(":method :url :status :res[content-length] - :response-time ms", {
        stream: { write: (line) => container.logger.info(line.trim()) },
    }));

    app.get("/", (req, res) => {
        res.send("Hello to this dms project");
    });

    app.use('/api/v1/user', userRouter);
    app.use('/api/v1/document', documentRouter);

    app.use(errorHandler);

    return app;
};
