var Chat = function (socket) {
  this.socket = socket;
};

Chat.prototype.sendMessage = function (message) {
  this.socket.emit("message", message);
};

Chat.prototype.processCommand = function (message) {
  var input = message.slice(1).split(" ");
  if (input[0] === "nick" && input[1]) {
    this.socket.emit("nicknameChangeRequest", input[1]);
    return true;
  } else if (input[0] === "join" && input[1]) {
    this.socket.emit("changeRoomRequest", input[1]);
    return true;
  }

  return false;
};
