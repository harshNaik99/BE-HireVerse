const basePath = "/api";

export default {
  url: {
    basePath,
  },
  env: {
    authSecret: process.env.TOKEN_SECRET_KEY || "test",
  },
};
