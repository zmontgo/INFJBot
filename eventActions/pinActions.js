const config = require('../config.json');
const Discord = require('discord.js');

function checkRole(role) {
	return role === config.roles.pinRole;
}

function timedifference(timestamp1, timestamp2) {
  timestamp1 = new Date(parseInt(timestamp1));
  timestamp2 = new Date(parseInt(timestamp2));

  var difference = timestamp2.getTime() - timestamp1.getTime();

  difference = Math.floor(difference ); // Find difference in hours (time / milliseconds / minutes / hours) 1000 / 60 / 60

  return difference;
}

function attachIsImage(msgAttach) {
	var url = msgAttach.url;
	//True if this url is a png or jpg image. Gifs don't work.
	if (url.indexOf("png", url.length - "png".length /*or 3*/) !== -1) return true;
	else if (url.indexOf("jpg", url.length - "jpg".length /*or 3*/) !== -1) return true;
	else if (url.indexOf("jpeg", url.length - "jpeg".length /*or 4*/) !== -1) return true;
	else return false;
}

class pinActions {
	static async userPinsMessage(client, reaction, user) {
		// Check if we are in the pin channel and the reaction emote is the proper emote
		if(reaction.message.channel.id == config.channels.availablechannel && reaction._emoji.name == config.emotes.pinMessage) {

			const sentMessage = reaction.message;
			const currentChannel = sentMessage.channel;

			// Make sure a user is pinning their own message
			if(user.id != sentMessage.author.id && !user.hasPermission('MANAGE_MESSAGES')) return currentChannel.send("You can only pin your own messages!");

			let fullUser = await sentMessage.guild.fetchMember(sentMessage.member.id); // The entire user info from the message's ID

			try {
				var pinchannel = client.channels.get(config.channels.pinchannel); // This is the channel that the messages are sent to

				if (fullUser._roles.find(checkRole)) {
					pinchannel.fetchMessages().then(messages => {
						const botmessages = messages.filter(msg => msg.author.id === client.user.id && timedifference(msg.createdTimestamp, Date.now()) <= 24);

						var bool = false;

						botmessages.forEach(message => {
							try {
								message.embeds.forEach((embed) => {
									if (embed.footer.text === sentMessage.author.id) {
										bool = true;
										return;
									}
								});
							} catch (err) {
								// Pass
							}
						});

						if (bool == false) {
							let customEmbed = new Discord.RichEmbed()
							.setColor('#750384')
							.setTitle(sentMessage.author.tag)
							.setThumbnail(sentMessage.author.avatarURL)
							.setDescription(
								sentMessage.content
							)
							.setFooter(sentMessage.author.id);

							if (sentMessage.attachments.size > 0) {
								sentMessage.attachments.forEach(attachment => {
									if (sentMessage.attachments.every(attachIsImage)) {
										customEmbed.setImage(attachment.url);
									} else {
										customEmbed.addField("Attachement URL", attachment.url);
									}
								});
							}

							// Send the message and stop typing
							sentMessage.clearReactions()
								.then(pinchannel.send(customEmbed))
								.then(currentChannel.send("Your message has been sent in " + pinchannel + "!"))
								.catch(() => console.error('Error with sending message.'));
						} else {
							return currentChannel.send("Looks like your last message was sent less than 24 hours ago! Try again later!").then((msg) => msg.delete(5000).catch());
						}
					})
					.catch(console.error);
				} else {
					return currentChannel.send("Looks like you don't have the privileges to pin that message!").then((msg) => msg.delete(5000).catch());
				}
			} catch (err) {
				console.error("Error! " + err);
			}
		} else {
			console.log("Someone tried pinning message outside channel " + availablechannel);
		}
	}

	// Unpin message via command
	static async userUnpinsMessage(message, user){
		if(message.channel.id === config.channels.availablechannel) {

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
