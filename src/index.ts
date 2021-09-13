import { Clint } from "./extensions/";
import dotenv from "dotenv";

dotenv.config();
// console.clear() does not fully clear
process.stdout.write("\x1Bc\n");

const client = new Clint();

await client.commands.init();
await client.events.init();

client.login(process.env.TOKEN);

// TODO: add enable/disable commands command
// TODO: permissions checks for sending embeds in log channels
