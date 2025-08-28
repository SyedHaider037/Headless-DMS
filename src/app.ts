import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

const app = express();

app.use(helmet());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.send("Hello to this dms project");
});

import userRouter from "./routes/user.route"
import documentRouter from './routes/document.route'

app.use('/api/v1/user', userRouter)
app.use('/api/v1/document', documentRouter)

export { app };