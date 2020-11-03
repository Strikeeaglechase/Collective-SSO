const fs = require("fs");
let curLogName = "";
let logStream;
const path = "../logs/";

function checkLog() {
	const curDate = new Date();
	const logName = `${
		curDate.getMonth() + 1
	}-${curDate.getDate()}-${curDate.getFullYear()}.txt`;
	if (curLogName != logName) {
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}
		const fullPath = `${path}${logName}`;
		if (!fs.existsSync(fullPath)) {
			fs.writeFileSync(fullPath, "Log created");
			console.log(`Created new log file ${fullPath}`);
		} else {
			console.log(`Resuming with old log file ${fullPath}`);
		}
		logStream = fs.createWriteStream(fullPath, {
			flags: "a",
		});
		curLogName = logName;
	}
}

function addZero(n) {
	const str = n.toString();
	return str.length >= 2 ? str.substring(0, 2) : "0" + str;
}

function THeader(date) {
	return `[${addZero(date.getHours())}:${addZero(date.getMinutes())}]`;
}

// Date stuff
function DHeader(date) {
	return `[${addZero(date.getDate())}/${addZero(
		date.getMonth() + 1
	)}/${addZero(date.getFullYear())}]`;
}

module.exports = function (msg) {
	checkLog();
	const date = new Date();
	const t = DHeader(date) + THeader(date);
	console.log(`${t} ${msg}`);
	logStream.write(`${t} ${msg}\n`);
};