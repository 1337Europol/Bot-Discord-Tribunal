module.exports = (client) => {
    process.on('unhandledRejection', (reason, p) => {
        console.log('anticrash pas pris rejection catch');
        console.log(reason, p);
    });
    process.on("uncaughtException", (err, origin) => {
        console.log('anticrash pas pris exception catch');
        console.log(err, origin);
    });
    process.on('uncaughtExceptionMonitor', (err, origin) => {
        console.log('anticrash pas pris exception catch monitor');
        console.log(err, origin);
    });
};
