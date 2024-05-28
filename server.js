const { Telegraf } = require('telegraf'); // Import Telegraf library
const axios = require('axios'); // Import axios for HTTP requests
require('dotenv').config(); // Load environment variables from .env file


const http = require('http');

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});

const bot = new Telegraf(process.env.BOT_TOKEN); // Initialize Telegraf bot with token from environment variable

// Helper function to create inline keyboard from Voiceflow choices
function createInlineKeyboard(choices) {
    return {
        reply_markup: {
            inline_keyboard: choices.map(choice => [{
                text: choice.name,
                callback_data: choice.value || choice.name
            }])
        }
    };
}

async function interact(ctx, chatID, request) {
    try {
        const response = await axios({
            method: "POST",
            url: `https://general-runtime.voiceflow.com/state/user/${chatID}/interact`,
            headers: {
                Authorization: process.env.VOICEFLOW_API_KEY
            },
            data: {
                request
            }
        });

        console.log("Voiceflow response:", response.data); // Debugging: Log the response from Voiceflow

        for (const trace of response.data) {
            console.log("Trace type:", trace.type); // Debugging: Log the trace type
            switch (trace.type) {
                case "text":
                case "speak":
                    await ctx.reply(trace.payload.message);
                    break;
                case "visual":
                    await ctx.replyWithPhoto(trace.payload.image);
                    break;
                case "choice":
                    const inlineKeyboard = createInlineKeyboard(trace.payload.choices);
                    await ctx.reply(trace.payload.message || "Please choose:", inlineKeyboard);
                    break;
                case "end":
                    await ctx.reply("Conversation is over");
                    break;
                default:
                    console.log("Unknown trace type:", trace.type);
            }
        }
    } catch (error) {
        console.error("Error in interact function:", error);
    }
}

bot.start(async (ctx) => {
    let chatID = ctx.message.chat.id;
    await interact(ctx, chatID, { type: "launch" });
});

const ANY_WORD_REGEX = new RegExp(/(.+)/i);
bot.hears(ANY_WORD_REGEX, async (ctx) => {
    let chatID = ctx.message.chat.id;
    await interact(ctx, chatID, {
        type: "text",
        payload: ctx.message.text
    });
});



// Handle callback queries from inline keyboard buttons
bot.on('callback_query', async (ctx) => {
    let chatID = ctx.callbackQuery.message.chat.id;
    let callbackData = ctx.callbackQuery.data;
    await interact(ctx, chatID, {
        type: "text",
        payload: callbackData
    });
    await ctx.answerCbQuery(); // Acknowledge the callback query
});

bot.launch(); // Start the bot

process.once('SIGINT', () => bot.stop('SIGINT')); // Handle graceful shutdown on SIGINT
process.once('SIGTERM', () => bot.stop('SIGTERM')); // Handle graceful shutdown on SIGTERM

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});