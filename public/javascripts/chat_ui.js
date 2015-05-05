// var chat = require('./chat.js');
var socket = io.connect();
var ui = new Chat(socket);

function getMessageToSend() {
  var messageToSend = $("#chat-area").val();
  $("#chat-area").val('');
  return messageToSend;
}

function sendMessage(message) {
  ui.sendMessage(message);
}

function displayMessage(message) {
  $("#messages").prepend(message + "<br>");
}

function changeUsername(newName) {
  $("#username").text(newName);
}

function updateRoom(room) {
  $("#room").text(room);
}

function updateUsers(userList) {
  var $ul = $("#user-list");
  $ul.text("");
  for (var i = 0; i < userList.length; i++) {
    var li = "<li>" + userList[i] + "</li>";
    $ul.append(li);
  }
}

$(document).ready(function() {
  $("form").on("submit", function(e) {
    e.preventDefault();
    var message = getMessageToSend();
    if (message.match(/^\//)) {
      if (!ui.processCommand(message)) {
        displayMessage("Unrecognized command syntax.");
      }
    } else {
      sendMessage(message);
    }
  });

  socket.on("receivedMessage", function(data) {
    displayMessage(data);
  });

  socket.on("nicknameChangeResult", function(obj) {
    if (obj.success) {
      changeUsername(obj.newName);
    } else {
      displayMessage(obj.message);
    }
  });

  socket.on("updateRoom", function (room) {
    updateRoom(room);
  });

  socket.on("updateUserList", function (userList) {
    updateUsers(userList);
  });
});
