// src/api/order-log/controllers/order-log.ts
import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order-log.order-log', ({ strapi }) => ({
  async create(ctx) {
    try {
      // Get the incoming data
      const { data } = ctx.request.body;

      // Fetch or create the counter
      let counter = await strapi.db.query('api::order-counter.order-counter').findOne({});
      if (!counter) {
        counter = await strapi.db.query('api::order-counter.order-counter').create({
          data: { lastNumber: 0 },
        });
      }

      // Increment the counter
      const newNumber = counter.lastNumber + 1;

      // Generate orderId: e.g., 20251009-0001
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const paddedNumber = newNumber.toString().padStart(4, '0');
      const orderId = `${timestamp}-${paddedNumber}`;

      // Update counter record
      await strapi.db.query('api::order-counter.order-counter').update({
        where: { id: counter.id },
        data: { lastNumber: newNumber },
      });

      // Attach the orderId to the entry before creation
      const entry = await strapi.db.query('api::order-log.order-log').create({
        data: {
          ...data,
          orderId,
          timestamp: new Date(),
        },
      });

      return { ok: true, data: entry };
    } catch (error) {
      console.error('OrderLog create error:', error);
      ctx.response.status = 500;
      return { ok: false, message: 'Failed to create order log.' };
    }
  },
}));
