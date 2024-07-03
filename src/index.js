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
    else if (msg.content.startsWith("Strands #")) saveStrandsResults(msg);
});

// commands
client.on(Events.InteractionCreate, interaction => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "wordle") wordleLeaderboard(interaction);
    else if (interaction.commandName === "connections") connectionsLeaderboard(interaction);
    else if (interaction.commandName === "strands") strandsLeaderboard(interaction);
});

function saveWordleResults(msg) {
    try {
        const path = "results/wordle.json";
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
        const path = "results/connections.json";
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

function saveStrandsResults(msg) {
    try {
        const path = "results/strands.json";
        let results = JSON.parse(fs.readFileSync(path));

        let userId = msg.author.id;
        let nickname = msg.member.displayName;
        let puzzleNum = msg.content.split("\n")[0].replace("Strands #", "");
        let score = (msg.content.length - msg.content.replaceAll("💡", "").length) / 2; // .length counts the emojis as 2 each

        let justBalls = "";
        for (let char of msg.content) {
            if (char === "🔵" || char === "🟡") justBalls += char;
        }
        let percent = Math.round(justBalls.indexOf("🟡") / justBalls.length * 1000) / 10;
        
        if (!(userId in results)) results[userId] = {};
        results[userId].nickname = nickname;
        if (!("scores" in results[userId])) results[userId].scores = {};
        results[userId].scores[puzzleNum] = score;
        if (!("percents" in results[userId])) results[userId].percents = {};
        results[userId].percents[puzzleNum] = percent;

        fs.writeFileSync(path, JSON.stringify(results, null, "\t"));

        msg.react(happy); // strands has no fail state
        console.log(`Strands result: ${nickname} ${puzzleNum} ${score} ${percent}`);
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
            avgScore: Math.round(scoreSum / gamesPlayed * 100) / 100,
            gamesPlayed: gamesPlayed
        };
        entries.push(entry);
    }
    entries.sort((a, b) => (a.avgScore - b.avgScore) || (a.gamesPlayed - b.gamesPlayed));
    
    // create leaderboard table
    let table = [["", "", "Avg Guesses", "Games Played"]];
    for (let i = 0; i < entries.length; i++) {
        let row = [];
        row.push("#" + (i + 1).toString());
        row.push(entries[i].nickname);
        row.push(entries[i].avgScore.toFixed(2));
        row.push(entries[i].gamesPlayed.toString());
        table.push(row);
    }
    
    // print leaderboard
    interaction.reply(getLeaderboard(table, "Wordle Leaderboard ⬛🟨🟩"));
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
            avgScore: Math.round(scoreSum / gamesPlayed * 100) / 100,
            gamesPlayed: gamesPlayed
        };
        entries.push(entry);
    }
    entries.sort((a, b) => (a.avgScore - b.avgScore || b.gamesPlayed - a.gamesPlayed));
    
    // create leaderboard table
    let table = [["", "", "Avg Mistakes", "Games Played"]];
    for (let i = 0; i < entries.length; i++) {
        let row = [];
        row.push("#" + (i + 1).toString());
        row.push(entries[i].nickname);
        row.push(entries[i].avgScore.toFixed(2));
        row.push(entries[i].gamesPlayed.toString());
        table.push(row);
    }

    // print leaderboard
    interaction.reply(getLeaderboard(table, "Connections Leaderboard 🟨🟩🟦🟪"));
}

function strandsLeaderboard(interaction) {
    // tabulate results
    const results = JSON.parse(fs.readFileSync("results/strands.json"));
    let entries = []
    for (user in results) {
        let scoreSum = 0;
        let percentSum = 0;
        let gamesPlayed = 0;
        for (score in results[user].scores) {
            scoreSum += results[user].scores[score];
            gamesPlayed++;
        }
        for (percent in results[user].percents) {
            percentSum += results[user].percents[percent];
        }
        let entry = {
            nickname: results[user].nickname,
            avgScore: Math.round(scoreSum / gamesPlayed * 100) / 100,
            avgPercent: Math.round(percentSum / gamesPlayed * 10) / 10,
            gamesPlayed: gamesPlayed
        };
        entries.push(entry);
    }
    entries.sort((a, b) => (a.avgScore - b.avgScore || a.avgPercent - b.avgPercent || b.gamesPlayed - a.gamesPlayed));
    
    // create leaderboard table
    let table = [["", "", "Avg Mistakes", "Avg % until Spangram", "Games Played"]];
    for (let i = 0; i < entries.length; i++) {
        let row = [];
        row.push("#" + (i + 1).toString());
        row.push(entries[i].nickname);
        row.push(entries[i].avgScore.toFixed(2));
        row.push(entries[i].avgPercent.toFixed(1));
        row.push(entries[i].gamesPlayed.toString());
        table.push(row);
    }

    // print leaderboard
    interaction.reply(getLeaderboard(table, "Strands Leaderboard 💡🔵🟡"));
}

function getLeaderboard(table,title) {
    // find longest value in each column
    let widths = [];
    for (let i = 0; i < table[0].length; i ++) {
        let longest = 0;
        for (let j = 0; j < table.length; j++) {
            if (table[j][i].length > longest) longest = table[j][i].length;
        }
        widths.push(longest);
    }
    
    // compose reply
    let reply = title + "\n```\n";
    for (let i = 0; i < table.length; i++) {
        for (let j = 0; j < table[i].length; j++) {
            if (isNaN(table[i][j])) reply += table[i][j].padEnd(widths[j] + 2);
            else reply += table[i][j].padStart(widths[j]) + "  ";
        }
        reply += "\n";
    }
    reply += "```";
    console.log(reply);
    return reply;
}