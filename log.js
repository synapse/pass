const chalk = require('chalk');

const simple = (message, indent = 3, data) => {
    if (data) {
        console.log(' '.repeat(indent) + message, data);
    } else {
        console.log(' '.repeat(indent) + message);
    }
};

const warning = (message, indent = 3, data) => {
    if (data) {
        console.log(chalk.hex('#E9AC20')(' '.repeat(indent) + '⚠  ' + message), data);
    } else {
        console.log(chalk.hex('#E9AC20')(' '.repeat(indent) + '⚠  ' + message));
    }
};

const success = (message, indent = 3, data) => {
    if (data) {
        console.log(chalk.hex('#7ED321')(' '.repeat(indent) + '✓ ' + message), data);
    } else {
        console.log(chalk.hex('#7ED321')(' '.repeat(indent) + '✓ ' + message));
    }
};

const info = (message, indent = 3, data) => {
    if (data) {
        console.log(chalk.hex('#8FD3DF')(' '.repeat(indent) + '\u24d8  ' + message), data);
    } else {
        console.log(chalk.hex('#8FD3DF')(' '.repeat(indent) + '\u24d8  ' + message));
    }
};

const error = (message, indent = 3, data) => {
    if (data) {
        console.log(chalk.hex('#D5143A')(' '.repeat(indent) + '✕ ' + message), data);
    } else {
        console.log(chalk.hex('#D5143A')(' '.repeat(indent) + '✕ ' + message));
    }
};

const nl = () => {
    console.log('\n');
};

module.exports = {
    simple,
    warning,
    info,
    success,
    error,
    nl
};
