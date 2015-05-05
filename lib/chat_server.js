


var NicknameManager = function() {
  this.nicknames = {};
  var guestnumber = 1;

  this.assignName = function(socket) {
    this.nicknames[socket.id] = "Guest" + guestnumber++;
    // guestnumber++;
    socket.emit('nicknameChangeResult', {
      success: true,
      message: 'Nickname assigned is ' + this.nicknames[socket.id] + '.',
      newName: this.nicknames[socket.id]
    });
  }

  this.notClashWithNameConvention = function(socket, newName) {
    if (newName.match(/^Guest\d+$/)) {
      socket.emit('nicknameChangeResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
      return false;
    }

    return true;
  }

  this.nameDoesntExist = function(socket, newName) {
    for (var prop in this.nicknames) {
      if (this.nicknames[prop] === newName) {
          socket.emit('nicknameChangeResult', {
            success: false,
            message: 'Name already exists.'
          });
          return false;
      }
      return true;
    }
  }
}


var createChat = function (server) {
  var io = require("socket.io")(server);
  var nicknameMgr = new NicknameManager();
  var sockets = {};
  var currentRooms = {};

  function joinRoom(socket, room) {
    socket.join(room);
    currentRooms[socket.id] = room;
    socket.emit('updateRoom', room);
    io.to(room).emit('receivedMessage', nicknameMgr.nicknames[socket.id] + " has joined " + room + ".");
    updateUserListInRoom(room);
  }

  function handleRoomChangeRequest(socket, room) {
    var oldRoom = currentRooms[socket.id];
    if (oldRoom) {
      delete currentRooms[socket.id];
      socket.leave(oldRoom);
      io.to(oldRoom).emit('receivedMessage', nicknameMgr.nicknames[socket.id] + " has left the room.");
      updateUserListInRoom(oldRoom);
    }

    joinRoom(socket, room);
  }

  function updateUserListInRoom(room) {
    var userList = [];
    for (var id in currentRooms) {
      if (currentRooms[id] === room) { userList.push(nicknameMgr.nicknames[id]); }
    }
    io.to(room).emit('updateUserList', userList);
  }

  io.on('connection', function(socket) {
    sockets[socket.id] = socket;
    nicknameMgr.assignName(socket);
    joinRoom(socket, 'lobby');

    socket.on('message', function (message) {
        io.to(currentRooms[socket.id]).emit('receivedMessage', nicknameMgr.nicknames[socket.id] + ": " + message);
    });

    socket.on('nicknameChangeRequest', function(newName) {
      if (nicknameMgr.notClashWithNameConvention(socket, newName) && nicknameMgr.nameDoesntExist(socket, newName)) {
        io.to(currentRooms[socket.id]).emit('receivedMessage', nicknameMgr.nicknames[socket.id] + " has changed name to " + newName + ".");
        //we are not handling empty new name
        nicknameMgr.nicknames[socket.id] = newName;
        socket.emit('nicknameChangeResult', {
          success: true,
          message: 'Nickname changed successfully.',
          newName: newName
        });
        updateUserListInRoom(currentRooms[socket.id]);
      }
    });

    socket.on('changeRoomRequest', function(room) {
      handleRoomChangeRequest(socket, room);
    });

    socket.on('disconnect', function() {
      io.to(currentRooms[socket.id]).emit('receivedMessage', nicknameMgr.nicknames[socket.id] + " has logged off.");
      delete nicknameMgr.nicknames[socket.id];
      delete sockets[socket.id];
      delete currentRooms[socket.id];
    });
  });

};

exports.createChat = createChat;
