import { Server } from "socket.io";
import Ride from "../models/ride.model.js";
import Chat from "../models/chat.model.js";

export const initSocket = (server) => {

    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true
        }
    });


    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        socket.on("joinRideRoom", async ({ rideId, userId }) => {
            try {
                const ride = await Ride.findById(rideId);
                if (!ride) return socket.emit("error", "Ride not found");

                const isDriver = ride.driver.userId === userId;

                const isPassenger = ride.passengers.some(
                    p => p.userId === userId && p.status === "confirmed"
                );

                if (!isDriver && !isPassenger) {
                    return socket.emit("error", "Unauthorized");
                }

                const room = `ride_${rideId}`;

                socket.join(room);

                console.log(`${userId} joined ${room}`);

                socket.emit("joinedRoom", room);

            } catch (err) {
                console.error(err);
            }
        });


        socket.on("sendMessage", async ({ rideId, userId, message }) => {
            try {
                const ride = await Ride.findById(rideId);
                if (!ride) return;

                const isDriver = ride.driver.userId === userId;

                const isPassenger = ride.passengers.some(
                    p => p.userId === userId && p.status === "confirmed"
                );

                if (!isDriver && !isPassenger) return;

                const newMessage = await Chat.create({
                    rideId,
                    senderId: userId,
                    message
                });

                const room = `ride_${rideId}`;

                io.to(room).emit("receiveMessage", newMessage);

            } catch (err) {
                console.error(err);
            }
        });


        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
    });
};
