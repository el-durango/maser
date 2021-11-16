import { Client } from "./extensions/";
import dotenv from "dotenv";
dotenv.config();

// clears console
// console.clear() does not fully clear
process.stdout.write("\x1Bc");

const client = new Client();

await client.commands.init();
await client.events.init();

client.login(process.env.TOKEN);
