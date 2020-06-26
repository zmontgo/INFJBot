const config = require('../config.json');

function checkRole(role) {
	return role === config.roles.pinRole;
}

function timedifference(timestamp1, timestamp2) {
  timestamp1 = new Date(parseInt(timestamp1));
  timestamp2 = new Date(parseInt(timestamp2));

  var difference = timestamp2.getTime() - timestamp1.getTime();

  difference = Math.floor(difference / 1000 / 60 / 60); // Find difference in hours (time / milliseconds / minutes / hours)

  return difference;
}

// Helper method to loop through pins. I was getting mad when I named it...
function isMessagePinnedAtAll(messageToCheck, setOfPinnedMessages){
	const fetchedMessagesIterator = setOfPinnedMessages.values();
	let msgVal = fetchedMessagesIterator.next().value;
	while(msgVal != null){
		if(msgVal.id === messageToCheck.id){
			return true;
		}
		msgVal = fetchedMessagesIterator.next().value;
	}
}

class pinActions {
	static async userPinsMessage(reaction, user) {

		/* Structure taken from tosActions.js for sake of consistency */

		// Check if we are in the pin channel and the reaction emote is the proper emote
		if(reaction.message.channel.id == config.channels.pinchannel
						&& reaction._emoji.name == config.emotes.pinMessage) {

			const sentMessage = reaction.message;
			const currentChannel = sentMessage.channel;

			let fullUser; // This will house all user info about the person who reacted

			fullUser = await sentMessage.guild.fetchMember(sentMessage.member.id);

			if (fullUser._roles.find(checkRole)) {
				let lastWasTwentyFourHours = false; // Aptly named variable.
				// Get the pinned messages within a channel
				await currentChannel.fetchPinnedMessages().then(fetchedPins => {

					// Check to see if they already have pinned messages
					const pinMsgIterator = fetchedPins.values();

					for (let i = 0; i < fetchedPins.size; i++){
						const msgVal = pinMsgIterator.next();
						if(msgVal.value.author.id == user.id) {
							if (timedifference(msgVal.value.createdTimestamp, Date.now()) >= 24) {
								lastWasTwentyFourHours = true;
							}
						} else {
							lastWasTwentyFourHours = true; // Couldn't find any messages pinned
						}

						break;
					}
				});

				if (lastWasTwentyFourHours == true) {
					// Check if there are too many existing pins
					currentChannel.fetchPinnedMessages().then(messages => {
						const numOfPins = messages.size;
						if(numOfPins === 50){
							currentChannel.send('**Uh oh!** This channel has reached its pin limit. Contact a Helper to purge the list.');
							return;
						}
					});

					// Make sure a user is pinning their own message
					if(user.id != sentMessage.author.id) return;

					currentChannel.startTyping();

					await currentChannel.fetchPinnedMessages().then(fetchedPins =>{

						// If the pushpin reaction from the bot does not exist, pin the message
						if(!isMessagePinnedAtAll(sentMessage, fetchedPins)){
							// Pin the message
							let existingMessageCount = 0;


							// Get the pinned messages within a channel
							if(isMessagePinnedAtAll(sentMessage, fetchedPins) == true) return;
							// Check to see if they already have pinned messages
							const pinMsgIterator = fetchedPins.values();

							for (let i = 0; i < fetchedPins.size; i++){
								const msgVal = pinMsgIterator.next().value;
								if(msgVal.author.id === user.id){
									existingMessageCount++;
								}
							}

							// Pin the message and stop typing
							currentChannel.stopTyping();
							sentMessage.clearReactions()
								.then(sentMessage.pin())
								.catch(() => console.error('Error with pinning message.'));

							// If they have other pinned messages, give them a good 'ol reminder.
							if (existingMessageCount > 1){
								currentChannel.send('Hey, ' + user.username + ', I just wanted to remind you that you have ' + existingMessageCount + ' other pinned messages 😄');
							}
						}

					});
				} else {
					return currentChannel.send("Looks like your last message was sent less than 24 hours ago! Try again later!").then((msg) => msg.delete(5000).catch());
				}
			} else {
				return currentChannel.send("Looks like you don't have the privileges to pin that message!").then((msg) => msg.delete(5000).catch());
			}
		}
	}

	// Unpin message via command
	static async userUnpinsMessage(message, user){
		if(message.channel.id === config.channels.pinchannel) {

			const currentChannel = message.channel;

			let hasPinnedMessage = false;

			// Get the pinned messages within a channel
			await currentChannel.fetchPinnedMessages().then(fetchedPins => {

				// Check to see if they already have pinned messages
				const pinMsgIterator = fetchedPins.values();

				for (let i = 0; i < fetchedPins.size; i++){
					const msgVal = pinMsgIterator.next();
					if(msgVal.value.author.id == user.id){
						hasPinnedMessage = true;
						msgVal.value.unpin();
						break;
					}
				}

				if(hasPinnedMessage){
					currentChannel.send('Hey, ' + user.username + ', I\'ve unpinned your most recent message as requested!');
				} else {
					currentChannel.send('Sorry, ' + user.username + '! I couldn\'t seem to find any pinned messages from you.');
				}
			});
		}
	}
}

module.exports = pinActions;
