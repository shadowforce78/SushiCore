const { Client, Collection, Partials } = require("discord.js");
const CommandsHandler = require("./handler/CommandsHandler");
const { warn, error, info, success } = require("../utils/Console");
const CommandsListener = require("./handler/CommandsListener");
const ComponentsHandler = require("./handler/ComponentsHandler");
const ComponentsListener = require("./handler/ComponentsListener");
const EventsHandler = require("./handler/EventsHandler");
const mongoose = require("mongoose");
const Database = require("../utils/Database");

class DiscordBot extends Client {
    collection = {
        application_commands: new Collection(),
        message_commands: new Collection(),
        message_commands_aliases: new Collection(),
        components: {
            buttons: new Collection(),
            selects: new Collection(),
            modals: new Collection(),
            autocomplete: new Collection()
        }
    }
    rest_application_commands_array = [];
    login_attempts = 0;
    login_timestamp = 0;
    statusMessages = [
        { name: 'SushiCore API', type: 4 },
        { name: 'MongoDB Database', type: 4 },
        { name: 'Notes Manager', type: 4 }
    ];

    commands_handler = new CommandsHandler(this);
    components_handler = new ComponentsHandler(this);
    events_handler = new EventsHandler(this);
    database = new Database();
    
    // Configuration directement dans la classe
    config = {
        database: {
            url: process.env.MONGO_URL || 'mongodb://localhost:27017/SushiCore'
        },
        development: {
            enabled: false,
            guildId: process.env.GUILD_ID || null,
        },
        commands: {
            prefix: process.env.DISCORD_PREFIX || '!!',
            message_commands: true,
            application_commands: {
                chat_input: true,
                user_context: true,
                message_context: true
            }
        }
    };

    constructor() {
        super({
            intents: 53608447,
            partials: [
                Partials.Channel,
                Partials.GuildMember,
                Partials.Message,
                Partials.Reaction,
                Partials.User
            ],
            presence: {
                activities: [{
                    name: 'keep this empty',
                    type: 4,
                    state: 'Online'
                }]
            }
        });
        
        new CommandsListener(this);
        new ComponentsListener(this);
    }

    startStatusRotation = () => {
        let index = 0;
        setInterval(() => {
            this.user.setPresence({ activities: [this.statusMessages[index]] });
            index = (index + 1) % this.statusMessages.length;
        }, 4000);
    }

    connectToDatabase = async () => {
        try {
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(this.config.database.url, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true
                });
                success('Successfully connected to MongoDB database');
            } else {
                info('Already connected to MongoDB database');
            }
        } catch (err) {
            error('Failed to connect to MongoDB database:');
            error(err);
        }
    }

    connect = async () => {
        warn(`Attempting to connect to the Discord bot... (${this.login_attempts + 1})`);

        this.login_timestamp = Date.now();

        try {
            // Connexion à MongoDB d'abord
            await this.connectToDatabase();
            
            await this.login(process.env.DISCORD_TOKEN);
            this.commands_handler.load();
            this.components_handler.load();
            this.events_handler.load();
            this.startStatusRotation();

            warn('Attempting to register application commands... (this might take a while!)');
            await this.commands_handler.registerApplicationCommands(this.config.development);
            success('Successfully registered application commands. For specific guild? ' + (this.config.development.enabled ? 'Yes' : 'No'));
        } catch (err) {
            error('Failed to connect to the Discord bot, retrying...');
            error(err);
            this.login_attempts++;
            setTimeout(this.connect, 5000);
        }
    }
}

module.exports = DiscordBot;
