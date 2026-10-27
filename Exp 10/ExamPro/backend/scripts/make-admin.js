
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "Provide an existing user's email address."
    );
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from .env.");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error(
      `No account found for ${email}. Register that account first.`
    );
  }

  if (user.role === "admin") {
    console.log(`${email} is already an administrator.`);
    return;
  }

  user.role = "admin";
  await user.save();

  console.log("Administrator account created successfully.");
  console.log(`Email: ${user.email}`);
  console.log(`Role: ${user.role}`);
  console.log("You can now use this account to manage exams.");
}

main()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
