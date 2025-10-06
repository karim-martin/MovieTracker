import swaggerJsdoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import logger from './logger';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Movie Tracker API',
      version: '1.0.0',
      description: 'A comprehensive API for tracking movies and ratings',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {type: 'string', description: 'Error message'},
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {type: 'string', format: 'uuid' },
            email: {type: 'string', format: 'email' },
            username: {type: 'string' },
            role: {type: 'string', enum: ['USER', 'ADMIN'] },
            isBlocked: {type: 'boolean' },
            createdAt: {type: 'string', format: 'date-time' }, 
            updatedAt: {type: 'string', format: 'date-time'}
          },
        },
        Movie: {
          type: 'object',
          properties: {
            id: {type: 'string',  format: 'uuid'},
            title: {type: 'string'},
            releaseYear: {type: 'integer'},
            plot: {type: 'string', nullable: true},
            posterUrl: {type: 'string',  nullable: true},
            createdAt: {type: 'string',  format: 'date-time'},
            updatedAt: {type: 'string',  format: 'date-time'}
          },
        },
        Genre: {
          type: 'object',
          properties: {id: {  type: 'string',  format: 'uuid',},
          name: {  type: 'string',}
          },
        },
        Person: {
          type: 'object',
          properties: {
            id: {type: 'string', format: 'uuid'},
            name: {type: 'string'},
            type: {type: 'string', enum: ['ACTOR', 'DIRECTOR', 'PRODUCER']}
          },
        },
        UserRating: {
          type: 'object',
          properties: {id: {  type: 'string',  format: 'uuid',},
          movieId: {  type: 'string',  format: 'uuid',},
          userId: {  type: 'string',  format: 'uuid',},
          rating: {  type: 'number',  format: 'float',  minimum: 0,  maximum: 10,},
          review: {  type: 'string',  nullable: true,},
          watchedDate: {  type: 'string',  format: 'date-time',},
          createdAt: {  type: 'string',  format: 'date-time',},
          updatedAt: {  type: 'string',  format: 'date-time',}
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('📚 Swagger documentation available at /api-docs');
};

export default swaggerSpec;
