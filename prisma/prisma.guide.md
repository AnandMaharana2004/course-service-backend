# 📘 PRISMA GUIDE

This guide helps you set up and use Prisma with PostgreSQL (or any supported database) in your Node.js / TypeScript project.

---

## 🔹 1. INSTALLATION

```bash
# Install Prisma and the PostgreSQL driver
npm install prisma @prisma/client
npm install --save-dev ts-node typescript

# Initialize Prisma in your project
npx prisma init
```

This will create:

```
📁 prisma/
    └─ schema.prisma     ← Main config and models
📄 .env                  ← Add your DATABASE_URL here
```

---

## 🔹 2. CONFIGURE DATABASE

Inside your `.env` file, set the connection URL:

```
DATABASE_URL="postgresql://username:password@localhost:5432/databasename?schema=public"
```

Inside `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

---

## 🔹 3. CREATING YOUR FIRST MODEL

Example:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 🔹 4. MIGRATE YOUR DATABASE

Whenever you add or change models/fields:

```bash
# Create and apply migration
npx prisma migrate dev --name init

# Example:
npx prisma migrate dev --name add_user_role

# Generate updated Prisma Client
npx prisma generate
```

This updates the database and regenerates your Prisma client code.

---

## 🔹 5. USING PRISMA CLIENT IN CODE

Example `prisma.ts`:

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
```

Example usage:

```ts
import prisma from '../prisma';

const users = await prisma.user.findMany();
const newUser = await prisma.user.create({
  data: { name: 'Siri', email: 'siri@example.com', password: '123456' },
});
```

---

## 🔹 6. ADDING NEW MODELS OR FIELDS

1️⃣ Update `schema.prisma` (add new fields/models).  
2️⃣ Run migration:

```bash
npx prisma migrate dev --name add_new_model
```

3️⃣ Regenerate client:

```bash
npx prisma generate
```

---

## 🔹 7. USEFUL PRISMA COMMANDS

```bash
# Check Prisma version
npx prisma -v

# Open Prisma Studio (GUI for DB)
npx prisma studio

# Push schema to DB without migration (temporary dev only)
npx prisma db push

# Deploy existing migrations on production
npx prisma migrate deploy
```

---

## 🔹 8. PRISMA MIDDLEWARE (like pre-hooks)

You can intercept queries globally:

```ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'create') {
    if (params.args.data.password) {
      params.args.data.password = await bcrypt.hash(
        params.args.data.password,
        10,
      );
    }
  }
  return next(params);
});

export default prisma;
```

---

## 🔹 9. COMMON WORKFLOW SUMMARY

1️⃣ Edit `schema.prisma`  
2️⃣ Run `npx prisma migrate dev --name descriptive_name`  
3️⃣ Run `npx prisma generate`  
4️⃣ Use updated models in your code  
5️⃣ Check with `npx prisma studio`

---

## 🔹 10. PRODUCTION DEPLOYMENT

Before deployment:

1. Commit migration files under `prisma/migrations/`
2. Run:
   ```bash
   npx prisma migrate deploy
   ```
3. Generate client (if not done):
   ```bash
   npx prisma generate
   ```

---

## 💡 TIPS

- Always use descriptive migration names.
- Use `@updatedAt` for automatic timestamps.
- Never directly edit the migration SQL unless necessary.
- Keep a shared Prisma client instance (`prisma.ts`) for performance.
- For new environments, just run:
  ```bash
  npx prisma migrate deploy
  npx prisma generate
  ```
