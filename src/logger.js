let debugMode = false;

export const setDebugMode = (value) => {
    debugMode = value;
};

export const log = (msg, level = "info") => {
    const icons = {
        info: "INF ",
        success: "SUC ",
        warn: "WRN ",
        error: "ERR ",
        debug: "DBG ",
    };

    if (level === "debug" && !debugMode) return;
    console.log(`| ${icons[level] || ""} —— ${msg}`);
};
