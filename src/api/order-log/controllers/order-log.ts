// src/api/order-log/controllers/order-log.ts
import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::order-log.order-log", ({ strapi }) => ({
  async create(ctx) {
    try {
      // Get incoming data
      const { data } = ctx.request.body;

      // 1️⃣ Fetch or create the counter
      let counter = await strapi.db.query("api::order-counter.order-counter").findOne({});
      if (!counter) {
        counter = await strapi.db.query("api::order-counter.order-counter").create({
          data: { lastNumber: 0 },
        });
      }

      // 2️⃣ Increment and generate orderId
      const newNumber = counter.lastNumber + 1;
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const paddedNumber = newNumber.toString().padStart(4, "0");
      const orderId = `${timestamp}-${paddedNumber}`;

      // 3️⃣ Update counter
      await strapi.db.query("api::order-counter.order-counter").update({
        where: { id: counter.id },
        data: { lastNumber: newNumber },
      });

      // 4️⃣ Use entityService (this registers with Admin UI)
      const entry = await strapi.entityService.create("api::order-log.order-log", {
        data: {
          ...data,
          orderId,
          timestamp: new Date(),
          publishedAt: new Date(), // ensure it’s visible immediately
        },
      });

      // 5️⃣ Return proper response
      ctx.response.status = 201;
      return { ok: true, data: entry };
    } catch (error) {
      console.error("OrderLog create error:", error);
      ctx.response.status = 500;
      return { ok: false, message: "Failed to create order log." };
    }
  },
}));
