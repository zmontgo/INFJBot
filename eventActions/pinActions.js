const config = require('../config.json');
const Discord = require('discord.js');

function checkRole(role) {
	return config.roles.includes(role);
}

function timedifference(timestamp1, timestamp2) {
  timestamp1 = new Date(parseInt(timestamp1));
  timestamp2 = new Date(parseInt(timestamp2));

  var difference = timestamp2.getTime() - timestamp1.getTime();

  difference = Math.floor(difference / 1000 / 60 / 60); // Find difference in hours (time / milliseconds / minutes / hours)

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
		if(reaction._emoji.name == config.emotes.pinMessage) {

			const sentMessage = reaction.message;
			const currentChannel = sentMessage.channel;

			const fullUser = await sentMessage.guild.fetchMember(sentMessage.member.id); // The guild member info from the message's ID

			// Make sure a user is pinning their own message
			if(user.id !== sentMessage.author.id) return currentChannel.send("You can only pin your own messages!");

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
		}
	}
}

module.exports = pinActions;
