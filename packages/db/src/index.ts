import { env } from "@full-tester/env/server";
import mongoose from "mongoose";

await mongoose.connect(env.DATABASE_URL, { dbName: "appealth" }).catch((error) => {
  console.log("Error connecting to database:", error);
});

const client = mongoose.connection.getClient().db("appealth");

export { client };
