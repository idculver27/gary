const { token, clientId } = require("../secret.json");
const { REST, Routes, ApplicationCommandOptionType } = require("discord.js");

const commands = [
    {
        name: "wordle",
        description: "Show the current Wordle leaderboard"
    },
    {
        name: "connections",
        description: "Show the current Connections leaderboard"
    }
];

const rest = new REST().setToken(token);

(async () => {
    console.log("Deploying commands...");
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Sucessfully deployed commands");
})();