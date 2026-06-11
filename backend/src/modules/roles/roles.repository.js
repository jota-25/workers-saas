import { prisma } from "../../lib/prisma.js";
import {redis} from "../../lib/redis.js";

export const roleRepository = {

  async findById(id) {

    const cacheKey = `role:id:${id}`;
    const cachedRole =  redis ? await redis.get(cacheKey) : null;

    if (cachedRole) {
      console.log(`Redis hit -> ${cacheKey}`);
      return cachedRole;
    }
    console.log(`Redis miss -> ${cacheKey}`);

    const role = await prisma.role.findUnique({
      where: {
        id,
      },
    });
    if (redis && role){
      await redis.set(
        cacheKey,
        role,
        {
          ex: 3600, // Expira en 1 hora
        }
      );
    }
    return role;
  },

  async findByName(name) {

    const cacheKey = `role:name:${name}`;
    const cachedRole = redis ? await redis.get(cacheKey): null;

    if (cachedRole) {
      console.log(`Redis hit -> ${cacheKey}`);
      return cachedRole;
    }
    console.log(`Redis miss -> ${cacheKey}`);
    
    const role= await prisma.role.findUnique({
      where: {
        name,
      },
    });
   if (redis && role) {
    await redis.set(cacheKey,role, {

      ex: 3600, // Expira en 1 hora
    }
  );

   }
  return role;
 },
};