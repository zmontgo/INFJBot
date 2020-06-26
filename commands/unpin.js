const pinActions = require('../eventActions/pinActions');
const config = require('../config.json');

module.exports.execute = async (client, message) => {
	if(message.channel.id === config.channels.accountability) {
		// Call to method elsewhere
		pinActions.userUnpinsMessage(message, message.author);
	}
};

module.exports.config = {
	name: 'messageUnpin', // Chose this name for organizational sake
	aliases: ['unpin'],
	description: 'This command has me remove your latest pinned message! Be careful, I can\'t tell if I pinned it or someone else.',
	usage: ['unpin']
};