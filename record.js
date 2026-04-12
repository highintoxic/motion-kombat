const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const fs = require("fs");
const path = require("path");

let stream;
let sampleNumber;
let gestureType;
let previousSampleNumber;

// Error handling middleware
app.use((err, req, res, next) => {
	console.error("Express error:", err.stack);
	res.status(500).send("Something went wrong!");
});

app.use("/record", express.static(__dirname + "/public/mobile/record/"));

// Validate command line arguments and initialize
try {
	if (process.argv.length < 4) {
		throw new Error("Missing required arguments: gestureType and sampleNumber");
	}

	gestureType = process.argv[2];
	sampleNumber = parseInt(process.argv[3]);

	if (!gestureType || gestureType.trim() === "") {
		throw new Error("Invalid gesture type provided");
	}

	if (isNaN(sampleNumber) || sampleNumber < 0) {
		throw new Error("Invalid sample number provided");
	}

	previousSampleNumber = sampleNumber;

	// Ensure data directory exists
	const dataDir = path.join(__dirname, "data", "game");
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
		console.log("Created data directory:", dataDir);
	}

	const filePath = path.join(
		dataDir,
		`sample_${gestureType}_${sampleNumber}.txt`
	);
	stream = fs.createWriteStream(filePath, { flags: "a" });

	stream.on("error", (err) => {
		console.error("Stream error:", err);
	});

	console.log(
		`Initialized recording for gesture: ${gestureType}, sample: ${sampleNumber}`
	);
} catch (error) {
	console.error("Initialization error:", error.message);
	console.log("Usage: node record.js <gestureType> <sampleNumber>");
	process.exit(1);
}

io.on("connection", function (socket) {
	console.log("Client connected:", socket.id);

	socket.on("motion data", function (data) {
		try {
			if (!data) {
				console.warn("Received empty motion data");
				return;
			}

			if (sampleNumber !== previousSampleNumber) {
				// Close previous stream if it exists
				if (stream && !stream.destroyed) {
					stream.end();
				}

				const dataDir = path.join(__dirname, "data", "game");
				const filePath = path.join(
					dataDir,
					`sample_${gestureType}_${sampleNumber}.txt`
				);
				stream = fs.createWriteStream(filePath, { flags: "a" });

				stream.on("error", (err) => {
					console.error("Stream error:", err);
				});

				previousSampleNumber = sampleNumber;
				console.log(`Created new stream for sample ${sampleNumber}`);
			}

			if (stream && !stream.destroyed) {
				stream.write(`${data}\r\n`, (err) => {
					if (err) {
						console.error("Write error:", err);
					}
				});
			} else {
				console.error("Stream is not available for writing");
			}
		} catch (error) {
			console.error("Error handling motion data:", error);
		}
	});

	socket.on("end motion data", function () {
		try {
			if (stream && !stream.destroyed) {
				stream.end();
				console.log(`Ended recording for sample ${sampleNumber}`);
			}
			sampleNumber += 1;
			console.log(`Next sample number: ${sampleNumber}`);
		} catch (error) {
			console.error("Error ending motion data:", error);
		}
	});

	socket.on("connected", function (data) {
		console.log("Front end connected with data:", data);
	});

	socket.on("disconnect", function () {
		console.log("Client disconnected:", socket.id);
	});

	socket.on("error", function (error) {
		console.error("Socket error:", error);
	});
});

const PORT = process.env.PORT || 3000;

http.listen(PORT, (err) => {
	if (err) {
		console.error("Failed to start server:", err);
		process.exit(1);
	}
	console.log(`Server listening on port ${PORT}`);
});

// Graceful shutdown handling
process.on("SIGINT", () => {
	console.log("\nReceived SIGINT. Graceful shutdown...");

	if (stream && !stream.destroyed) {
		stream.end();
		console.log("Closed file stream");
	}

	http.close(() => {
		console.log("HTTP server closed");
		process.exit(0);
	});
});

process.on("SIGTERM", () => {
	console.log("Received SIGTERM. Graceful shutdown...");

	if (stream && !stream.destroyed) {
		stream.end();
		console.log("Closed file stream");
	}

	http.close(() => {
		console.log("HTTP server closed");
		process.exit(0);
	});
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught Exception:", err);

	if (stream && !stream.destroyed) {
		stream.end();
	}

	process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
