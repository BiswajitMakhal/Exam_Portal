const { Server } = require("socket.io");
const logger = require("../utils/logger");

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    logger.info(`New client connected for live exam: ${socket.id}`);

    socket.on("joinExam", ({ examId, candidateId }) => {
      const roomName = `exam_${examId}`;
      socket.join(roomName);

      socket.join(`user_${candidateId}`);

      logger.info(`Candidate ${candidateId} joined room: ${roomName}`);
    });

    socket.on("timeUp", ({ examId, candidateId }) => {
      logger.info(
        `Time is up for Candidate ${candidateId} in Exam ${examId}. Triggering auto-submit.`,
      );

      io.to(`user_${candidateId}`).emit("forceSubmit", {
        message: "Your time is up! Exam is automatically submitting...",
      });
    });

    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

module.exports = { initSocket };
