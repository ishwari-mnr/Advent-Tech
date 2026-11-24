#!/usr/bin/env node
/**
 * Create the first super admin in a fresh database.
 *
 *   npm run seed:superadmin -- --name "Jane Doe" --email jane@adventglobal.com --password "S3cret!pass"
 *
 * There is no public signup (POST /api/auth/register needs an admin), so a new
 * deployment has no way in until one super admin exists. After that, everything
 * else (companies, company admins, staff, plans, credits) is done from the
 * super-admin dashboard.
 *
 * Reads MONGODB_URL from backend/.env. Refuses to touch an email that already
 * exists, so running it twice is harmless.
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const name = arg("name") || process.env.SEED_ADMIN_NAME;
  const email = (arg("email") || process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = arg("password") || process.env.SEED_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    console.error(
      'Usage: npm run seed:superadmin -- --name "Full Name" --email you@adventglobal.com --password "..."'
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }
  if (!process.env.MONGODB_URL) {
    console.error("MONGODB_URL is not set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URL);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`A user with ${email} already exists (role: ${existing.role}). Nothing changed.`);
    return;
  }

  await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: "super_admin",
  });
  console.log(`Super admin created: ${email}`);
}

main()
  .catch((err) => {
    console.error("Failed to create super admin:", err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
