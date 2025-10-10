/**
 * order-log controller
 */

import { factories } from '@strapi/strapi';

// Helper function to pad order numbers
const pad = (n: number): string => n.toString().padStart(4, "0");

export default factories.createCoreController('api::order-log.order-log', ({ strapi }) => ({
  async create(ctx) {
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 12); // e.g. 202510091035

      // 🧮 Fetch or create the counter
      const counter = await strapi.db.query("api::order-counter.order-counter").findMany();
      let newNumber = 1;

      if (counter.length === 0) {
        await strapi.db.query("api::order-counter.order-counter").create({ data: { lastNumber: 1 } });
      } else {
        newNumber = counter[0].lastNumber + 1;
        await strapi.db.query("api::order-counter.order-counter").update({
          where: { id: counter[0].id },
          data: { lastNumber: newNumber },
        });
      }

      // 🧾 Generate orderId like 20251009-0001
      const orderId = `${timestamp}-${pad(newNumber)}`;

      // Add the generated fields to the data
      ctx.request.body.data.orderId = orderId;
      ctx.request.body.data.timestamp = now;
      ctx.request.body.data.publishedAt = now; // ensures it's visible in admin

      // ✅ Create entry using Entity Service so it shows in Content Manager
      const entry = await strapi.entityService.create("api::order-log.order-log", {
        data: ctx.request.body.data,
      });

      return { ok: true, data: entry };
    } catch (err) {
      console.error("OrderLog create error:", err);
      ctx.response.status = 500;
      return { ok: false, message: "Failed to create order log." };
    }
  },
}));
