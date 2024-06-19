const fs = require("fs");
const { Client, Events, GatewayIntentBits } = require("discord.js");
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

// listen for game results
client.on("messageCreate", msg => {
    //console.log(msg);
    if (msg.author.bot) return;
    if (msg.content.startsWith("Wordle ")) saveWordleResults(msg);
    else if (msg.content.startsWith("Connections \nPuzzle #")) saveConnectionsResults(msg);
});

// commands
client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "wordle") wordleLeaderboard(interaction);
    else if (interaction.commandName === "connections") connectionsLeaderboard(interaction);
});

function saveWordleResults(msg) {
    try {
        const path = "results/wordle.json"
        let results = JSON.parse(fs.readFileSync(path));

        let userId = msg.author.id;
        let nickname = msg.member.displayName;
        let puzzleNum = msg.content.split(" ")[1].replace(",", "");
        let score = msg.content.split(" ")[2][0];

        if (!(userId in results)) results[userId] = {};
        results[userId].nickname = nickname;
        if (!("scores" in results[userId])) results[userId].scores = {};
        results[userId].scores[puzzleNum] = score;

        fs.writeFileSync(path, JSON.stringify(results, null, "\t"));

        if (parseInt(score)) msg.react(happy);
        else if (score === "X") msg.react(sad);
        console.log(`Wordle result: ${nickname} ${puzzleNum} ${score}`);
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
        
        let score = 0;
        let lines = msg.content.split("\n");
        for (let i = 2; i < lines.length; i++) {
            // if a line contains more than one color of square, it is a mistake
            let a = lines[i].includes("🟨");
            let b = lines[i].includes("🟩");
            let c = lines[i].includes("🟦");
            let d = lines[i].includes("🟪");
            if ((a ? 1 : 0) + (b ? 1 : 0) + (c ? 1 : 0) + (d ? 1 : 0) > 1) score++;
        }
        
        if (!(userId in results)) results[userId] = {};
        results[userId].nickname = nickname;
        if (!("scores" in results[userId])) results[userId].scores = {};
        results[userId].scores[puzzleNum] = score;

        fs.writeFileSync(path, JSON.stringify(results, null, "\t"));

        if (score < 4) msg.react(happy);
        else if (score === 4) msg.react(sad);
        console.log(`Connections result: ${nickname} ${puzzleNum} ${score}`);
    } catch (error) {
        console.error(error);
    }
}

function wordleLeaderboard(interaction) {
    // tabulate results
    const results = JSON.parse(fs.readFileSync("results/wordle.json"));
    let entries = []
    for (user in results) {
        let scoreSum = 0;
        let gamesPlayed = 0;
        for (score in results[user].scores) {
            if (results[user].scores[score] === "X") scoreSum += 7; // a loss is counted as 7 guesses
            else scoreSum += parseInt(results[user].scores[score]);
            gamesPlayed++;
        }
        let entry = {
            nickname: results[user].nickname,
            avgScore: Math.round(scoreSum / gamesPlayed * 100) / 100
        };
        entries.push(entry);
    }
    entries.sort((a, b) => a.avgScore - b.avgScore);

    // find longest name
    let longest = 0;
    for (entry of entries) {
        if (entry.nickname.length > longest) longest = entry.nickname.length;
    }
    // print leaderboard
    let table = "Wordle Leaderboard (by average number of guesses)\n```\n";
    for (let i = 0; i < entries.length; i++) {
        table += "#" + (i + 1).toString().padEnd(4) + entries[i].nickname.padEnd(longest + 2) + entries[i].avgScore.toFixed(2) + "\n";
    }
    table += "```";
    console.log(table);
    interaction.reply(table);
}

function connectionsLeaderboard(interaction) {
    // tabulate results
    const results = JSON.parse(fs.readFileSync("results/connections.json"));
    let entries = []
    for (user in results) {
        let scoreSum = 0;
        let gamesPlayed = 0;
        for (score in results[user].scores) {
            scoreSum += results[user].scores[score];
            gamesPlayed++;
        }
        let entry = {
            nickname: results[user].nickname,
            avgScore: Math.round(scoreSum / gamesPlayed * 100) / 100
        };
        entries.push(entry);
    }
    entries.sort((a, b) => a.avgScore - b.avgScore);
 
    // find longest name
    let longest = 0;
    for (entry of entries) {
        if (entry.nickname.length > longest) longest = entry.nickname.length;
    }
    // print leaderboard
    let table = "Connections Leaderboard (by average number of mistakes)\n```\n";
    for (let i = 0; i < entries.length; i++) {
        table += "#" + (i + 1).toString().padEnd(4) + entries[i].nickname.padEnd(longest + 2) + entries[i].avgScore.toFixed(2) + "\n";
    }
    table += "```";
    console.log(table);
    interaction.reply(table);
}