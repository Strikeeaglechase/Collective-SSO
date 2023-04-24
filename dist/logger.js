import fs from "fs";
const path = "./logs/";
const LOG_TIME = 1000;
class Logger {
    constructor(opts) {
        this.options = opts;
        this.cb = {
            info: this.info.bind(this),
            warn: this.warn.bind(this),
            error: this.error.bind(this),
        };
    }
    // Genorates the [time/date] header all logs have
    getDateHeader() {
        function addZero(n) {
            const str = n.toString();
            return str.length >= 2 ? str.substring(0, 2) : "0" + str;
        }
        function THeader(date) {
            return `[${addZero(date.getHours())}:${addZero(date.getMinutes())}]`;
        }
        function DHeader(date) {
            return `[${addZero(date.getDate())}/${addZero(date.getMonth() + 1)}]`;
        }
        const date = new Date();
        const t = DHeader(date) + THeader(date);
        return t;
    }
    // Checks to make sure that the log file exists, then either creates a new log file or opens a write stream to an old one
    checkLogFile() {
        if (!this.options.logToFile)
            return;
        const curDate = new Date();
        const logName = `${curDate.getMonth() + 1}-${curDate.getDate()}-${curDate.getFullYear()}.txt`;
        const folderPath = this.options.filePath ? this.options.filePath : path;
        if (logName == this.currentLogFile)
            return;
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath);
        }
        const fullPath = `${folderPath}${logName}`;
        if (!fs.existsSync(fullPath)) {
            fs.writeFileSync(fullPath, "Log created\n");
            console.log(`Created new log file ${fullPath}`);
        }
        else {
            console.log(`Resuming with old log file ${fullPath}`);
        }
        this.writeStream = fs.createWriteStream(fullPath, {
            flags: "a",
        });
        this.currentLogFile = logName;
    }
    // Base log command
    log(level, message) {
        this.checkLogFile();
        const header = `[${level}]${this.getDateHeader()}`;
        const formattedMessage = `${header} ${message}`;
        console.log(formattedMessage);
        if (this.writeStream)
            this.writeStream.write(formattedMessage + "\n");
        // If a message given to the logger is not a string, we want to log the raw format of the 
        // object as well to prevent Objects such as errors from always appearing as [object Object]
        if (typeof message != "string") {
            // Print out raw message
            console.log(message);
        }
    }
    // Shorthand functions for the log method
    info(message) {
        this.log("INFO", message);
    }
    warn(message) {
        this.log("WARN", message);
    }
    error(message) {
        this.log("ERROR", message);
    }
}
export default Logger;
