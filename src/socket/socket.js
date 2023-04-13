const socketIo = require("socket.io");
const _ = require("lodash");
const { User } = require("../models");
const UserList = [];
let socketHandle = null;
const Action = {
  follow: async (from, to) => {
    const from_user = await User.findById(from);
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }

    socketHandle.id = room.roomId;
    socketHandle.broadcast.emit(`notification-${to}`, {
      type: "follow",
      message: from_user.username + " is following you!",
      to,
    });
  },
  mail: async (from, to) => {
    const from_user = await User.findById(from);
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }
    socketHandle.id = room.roomId;
    socketHandle.broadcast.emit(`notification-${to}`, {
      type: "mail",
      message: from_user.username + " has sent you a message!",
      to,
    });
  },
  addLocation: async (from, to) => {
    const from_user = await User.findById(from);
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }
    
    socketHandle.id = room.roomId;
    socketHandle.broadcast.emit(`notification-${to}`, {
      type: "addlocation",
      message: from_user.username + " has added new location!",
      to,
    });
  },
  shoutout: async (from, to) => {
    const from_user = await User.findById(from);
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }

    socketHandle.id = room.roomId;
    socketHandle.broadcast.emit(`notification-${to}`, {
      type: "shoutout",
      message: from_user.username + " has given you a shoutout!",
      to,
    });
  },
  defaultNotification: async (from, to, notification) => {
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }

    socketHandle.id = room.roomId;
    socketHandle.broadcast.emit(`notification-${to}`, {
      type: "default",
      message: notification.description,
      to,
    });
  },
};

module.exports = {
  Socket: (app) => {
    const io = socketIo(app, {
      cors: {
        origin: "*",
      },
    });
    // Add this before the app.get() block
    io.on("connection", (socket) => {
      console.log("connected", socket.rooms);
      socketHandle = socket;
      socket.on("login", ({ userid }) => {
        if (!userid) {
          return;
        }

        if (!_.find(UserList, { userid: userid }))
          UserList.push({
            userid: userid,
            roomId: socket.id,
          });
        else {
          _.find(UserList, { userid: userid }).roomId = socket.id;
        }

        socket.emit("roomId", socket.id);
      });
      socket.on("disconnect", function (reason) {
        console.log(reason);
      });
    });
  },
  Action,
};