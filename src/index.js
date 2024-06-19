const fs = require("fs");
const { Client, GatewayIntentBits, ReactionEmoji } = require("discord.js");
const { token } = require("../secret.json");

const happy = "🎉";
const sad = "😔";

// create client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// ready
client.on("ready", c => {
    console.log(`${c.user.tag} is ready!`);
});

// login
client.login(token);

// slash commands
/*client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "wordle") wordleLeaderboard(interaction);
    else if (interaction.commandName === "connections") connectionsLeaderboard(interaction);
});*/

// listen for game results
client.on("messageCreate", msg => {
    //console.log(msg);
    if(msg.author.bot) return;
    if(msg.content.startsWith("Wordle ")) saveWordleResults(msg);
    else if(msg.content.startsWith("Connections \nPuzzle #")) saveConnectionsResults(msg);
});

function saveWordleResults(msg) {
    try {
        const path = "results/wordle.json"
        let results = JSON.parse(fs.readFileSync(path));

        let userId = msg.author.id;
        let nickname = msg.member.displayName;
        let puzzleNum = msg.content.split(" ")[1].replace(",", "");
        let score = msg.content.split(" ")[2][0];

        if(!(userId in results)) results[userId] = {};
        results[userId].nickname = nickname;
        if(!("scores" in results[userId])) results[userId].scores = {};
        results[userId].scores[puzzleNum] = score;

        fs.writeFileSync(path, JSON.stringify(results, null, "\t"));

        if(parseInt(score)) msg.react(happy);
        else if(score == "X") msg.react(sad);
    } catch (error) {
        console.error(error);
    }
}

function saveConnectionsResults(msg) {
    try {
        const path = "results/connections.json"
        let results = JSON.parse(fs.readFileSync(path));

        let userId = msg.author.id;
        let nickname = msg.member.displayName;
        let puzzleNum = msg.content.split("\n")[1].replace("Puzzle #", "");
        
        let mistakes = 0;
        let lines = msg.content.split("\n");
        for(let i = 2; i < lines.length; i++) {
            // if a line contains more than one color of square, it is a mistake
            let a = lines[i].includes("🟨");
            let b = lines[i].includes("🟩");
            let c = lines[i].includes("🟦");
            let d = lines[i].includes("🟪");
            if((a ? 1 : 0) + (b ? 1 : 0) + (c ? 1 : 0) + (d ? 1 : 0) > 1) mistakes++;
        }
        
        if(!(userId in results)) results[userId] = {};
        results[userId].nickname = nickname;
        if(!("mistakes" in results[userId])) results[userId].mistakes = {};
        results[userId].mistakes[puzzleNum] = mistakes;

        fs.writeFileSync(path, JSON.stringify(results, null, "\t"));

        if(mistakes < 4) msg.react(happy);
        else if(mistakes == 4) msg.react(sad);
    } catch (error) {
        console.error(error);
    }
}