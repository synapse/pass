const os = require('os');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');

const log = require('./log');

const Settings = class Settings {
    constructor () {
        this.settings = null;

        this.passPath = path.join(os.homedir(), '.pass');
        this.passSettingsPath = path.join(this.passPath, 'settings.json');
        this.defaultStores = path.join(this.passPath, 'stores');
    }

    /**
     * loads the current settings if any
     * @function
     */
    load () {
        return new Promise((resolve, reject) => {
            // check if the Pass settings are present
            if (!fs.existsSync(this.passPath)) {
                try {
                    fs.mkdirSync(this.passPath);
                    fs.writeFileSync(this.passSettingsPath, '{}');
                } catch (error) {
                    reject(error);
                }
            }

            // check if the default stores folder exists
            if (!fs.existsSync(this.defaultStores)) {
                try {
                    fs.mkdirSync(this.defaultStores);
                } catch (error) {
                    reject(error);
                }
            }

            try {
                this.settings = require(this.passSettingsPath);
                resolve(this.settings);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * sets a setting
     * @param {string} key 
     * @param {*} value 
     * @function
     * @returns {Settings}
     */
    set (key, value) {
        this.settings[key] = value;
        this.save();

        return this;
    }

    /**
     * returns a setings value
     * @param {string} key to return
     * @returns {*} returned value
     */
    get (key, defaultValue) {
        if (typeof this.settings[key] !== 'undefined') return this.settings[key];
        return defaultValue;
    }

    remove (key) {
        if (typeof this.settings[key] !== 'undefined') {
            delete this.settings[key];
            this.save();
        }

        return this;
    }

    /**
     * append a value to a Array type key
     * @param {string} key 
     * @param {*} value 
     * @function
     * @returns Settings
     */
    append (key, value) {
        let list = this.get(key);
        if (typeof list === 'undefined') list = [];

        if (list.constructor === Array) {
            list.push(value);
            this.set(key, list);
        } else {
            log.error(`Error while appending settings value in key '${key}'! The selected key is not of type 'Array'`);
            log.nl();
        }

        return this;
    }

    /**
     * check if the settings are loaded
     * @function
     * @returns {boolean} returns true or false if the settings exist and loaded
     */
    loaded () {
        return this.loaded;
    }

    /**
     * ask user for the master password
     * @function
     */
    askPassword () {
        return new Promise((resolve, reject) => {
            inquirer.prompt([{
                type: 'password',
                name: 'password',
                message: 'Enter master password'
            }]).then(answers => {
                this.masterPassword = answers.password;
            }).catch(error => {
                log.error('There was a problem while reading the inputed Master Password', error);
                log.nl();
                reject();
            });
        });
    }

    /**
     * save the settings
     * @function
     * @returns {Settings}
     */
    save () {
        try {
            fs.writeFileSync(this.passSettingsPath, JSON.stringify(this.settings, undefined, 4));
        } catch (error) {
            log.error('There was a problem while saving the settings', error);
            log.nl();
        }
        return this;
    }
}

module.exports = Settings;
