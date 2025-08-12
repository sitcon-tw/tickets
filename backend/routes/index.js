import publicRoutes from './public.js';
import adminRoutes from './admin.js';

export default async function routes(fastify, options) {
  // Public API routes
  await fastify.register(publicRoutes, { prefix: '/api' });
  
  // Admin API routes  
  await fastify.register(adminRoutes, { prefix: '/api/admin' });
  
  // Health check
  fastify.get('/api/health',
  { schema: {
    description: 'Health check endpoint',
    tags: ['test'],
  }},
  async (request, reply) => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
    };
  });
}