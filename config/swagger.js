import swaggerJsdoc from "swagger-jsdoc";

const options = {

  definition: {

    openapi: "3.0.0",

    info: {

      title: "Car Pooling Backend API",
      version: "1.0.0",

      description:
        "API Documentation for Secure Car Pooling System",

    },

    servers: [

      {

        url: "http://localhost:3000",

      },

    ],

  },

  /*
  VERY IMPORTANT ⭐⭐⭐⭐⭐
  */

  apis: [

    "./routes/**/*.js",

  ],

};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;