import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

// Swagger Configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Chess API Documentation",
      version: "1.0.0",
      description: "API Documentation for my Chess backend",
    },
    servers: [
      {
        url: "http://localhost:8080", // Change this to your deployed URL
      },
    ],
  },
  apis: ["src/routes/*.ts"], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Function to setup Swagger in the Express app
export const setupSwagger = (app: Express): void => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
