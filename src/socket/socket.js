const socketIo = require("socket.io");
const _ = require("lodash");
const { User } = require("../models");
const UserList = [];
let socketHandle = null;
const Action = {
  follow: async (from, to, flag) => {
    const from_user = await User.findById(from);
    const to_user = await User.findById(to);
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }
    socketHandle.id = room.roomId;

    switch (flag) {
      case "removing":
        socketHandle.broadcast.emit(`notification-${to}`, {
          type: "follow",
          message: from_user.businessname + " removed you!",
          to,
        });
        break;
      case "accepting":
        socketHandle.broadcast.emit(`notification-${to}`, {
          type: "follow",
          message: from_user.businessname + " accepted you!",
          to,
        });
        break;
      case "declining":
        socketHandle.broadcast.emit(`notification-${to}`, {
          type: "follow",
          message: from_user.businessname + " declined you!",
          to,
        });
        break;
      default:
        socketHandle.broadcast.emit(`notification-${to}`, {
          type: "follow",
          message: from_user.businessname + " has started following you!",
          to,
        });
        break;
    }

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
      message: `You have received a new message from ${from_user?.businessname}`,
      to,
    });
  },

  notice: async (from, to) => {
    const from_user = await User.findById(from);
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }
    socketHandle.id = room.roomId;
    socketHandle.broadcast.emit(`notification-${to}`, {
      type: "notice",
      message: `You have received a new notice from ${from_user?.businessname}`,
      to,
    });
  },

  addLocation: async (from, to, notification) => {
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }
    socketHandle.id = room.roomId;
    socketHandle.broadcast.emit(`notification-${to}`, {
      type: "addlocation",
      message: notification.description,
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
      message: `You have been shouted out by ${from_user.businessname}`,
      to,
    });
  },

  post: async (from, to) => {
    const from_user = await User.findById(from);
    const room = _.find(UserList, { userid: from });
    if (!room) {
      throw new Error("Room not found");
    }

    socketHandle.id = room.roomId;
    socketHandle.broadcast.emit(`notification-${to}`, {
      type: "post",
      message: `You have new activity from ${from_user.businessname}`,
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