import { main } from "./bot-api.js";
import {
  Client,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes,
} from "discord.js";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "GuildMembers", "MessageContent"],
});

client.on("ready", () => {
  console.log(`${client.user.tag} has logged in.`);
});

const commands = [
  new SlashCommandBuilder()
    .setName("suidevbot")
    .setDescription("Chat with the SUI Dev bot")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("Prompt for the chatbot")
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.APP_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "suidevbot") {
    // Reply with a non-ephemeral message to create the thread
    const message = await interaction.reply({
      content: "Preparing your personal thread...",
      fetchReply: true,
      ephemeral: false,
    });

    // Get the prompt from the user
    const prompt = interaction.options.getString("prompt");
    const user = interaction.user;

    // Starting a thread from the bot's message
    const thread = await message.startThread({
      name: `Thread for: ${prompt}`,
      autoArchiveDuration: 60,
      type: ChannelType.PrivateThread, // Use PublicThread if you want the thread to be public
      reason: "Separate thread for bot interaction",
    });

    // Send an initial message to the thread
    await thread.send(`Hello, ${user.username}! Let's discuss: ${prompt}`);

    // Get the response from the main function
    const response = await main(prompt);

    // Send the bot's response to the thread
    await thread.send(response?.answer);

    // Inform the user that the thread has been created with an ephemeral follow-up message
    await interaction.followUp({
      content: `Your personal thread "${prompt}" is ready!`,
      ephemeral: true,
    });
  }
});

// Event listener for messages in threads
client.on("messageCreate", async (message) => {
  // Ignore messages from bots and non-thread channels
  console.log(message.channel.isThread(),"message created");
  if (message.author.bot || !message.channel.isThread()) return;

  // Process the message in the thread
  const response = await main(message.content);

  // Send the response in the thread
  await message.channel.send(response?.answer);
});

client.login(process.env.DISCORD_TOKEN);
