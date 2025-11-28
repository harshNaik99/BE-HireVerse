import express from "express";
import cors from "cors";
import morgan from "morgan";

import indexRoute from "../routes/index.routes.js";
import bodyParser from "body-parser";
import constants from "../constants/index.js";

const app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}))

app.use((req, res, next) => {
  const origin = req.get("origin");

  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,HEAD,OPTIONS,PUT,PATCH,DELETE"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Access-Control-Request-Method, Access-Control-Allow-Headers, Access-Control-Request-Headers, X-Timezone"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
  } else {
    next();
  }
});

const corsOption = {
  origin: [process.env.FRONTEND_BASE_URL],
  methods: "GET,POST,HEAD,OPTIONS,PUT,PATCH,DELETE",
  credentials: true,
};

app.use(cors(corsOption));

app.use(morgan("dev"));

// Router
app.use(constants.APPLICATION.url.basePath, indexRoute);

export default app;
