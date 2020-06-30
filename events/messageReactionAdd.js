const pinActions = require('../eventActions/pinActions');

module.exports = async (client, reaction, user) => {
  // Handle reaction to a message in pin channel
  pinActions.userPinsMessage(client, reaction, user);
};
