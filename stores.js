const fs = require('fs');
const path = require('path');

const utils = require('./utils');
const Store = require('./store');
const Safe = require('./safe');
const log = require('./log');

const Stores = class Stores {
    /**
     * intializes the stores class
     * @function
     * @param {Settings} the global settings
     */
    constructor (settings) {
        this.settings = settings;
        this.currentStore = null;
        this.stores = this.settings.get('stores', []);
    }

    /**
     * add a new store to the stores list
     * @param {string} store name 
     * @param {string} master password 
     * @param {string} store base path
     * @function
     * @returns {Promise}
     */
    create (name, password, storeBasePath) {
        return new Promise((resolve, reject) => {
            const storePath = path.join(storeBasePath, name);
            const storeBase = path.join(storePath, 'store.json');
            const storeTest = path.join(storePath, 'test.json');

            if (fs.existsSync(storePath)) {
                reject('A store folder with this name already exists!');
                return;
            }

            try {
                fs.mkdirSync(storePath);
            } catch (error) {
                reject(error);
                return;
            }

            try {
                const testObj = Safe.encrypt('password', password);
                fs.writeFileSync(storeTest, JSON.stringify(testObj, undefined, 4));
                fs.writeFileSync(storeBase, JSON.stringify({name, indexes: []}, undefined, 4));
            } catch (error) {
                reject(error);
                return;
            }

            const store = {name, path: storePath};
            this.getSettings().append('stores', store);
            this.stores.push(store);

            resolve(store);
        });
    }

    /**
     * add an existing store
     * @param {string} store path 
     * @function
     * @returns {Promise}
     */
    add (storePath) {
        return new Promise((resolve, reject) => {
            try {
                const storeInfo = require(path.join(storePath, 'store.json'));
                const store = {name: storeInfo.name, path: storePath};

                this.getSettings().append('stores', store);
                this.stores.push(store);

                resolve();
            } catch (error) {
                reject('Unable to read store info');
            }
        });
    }

    /**
     * removes a store
     * @param {object} store object 
     * @param {string} could be 'delete' or 'reference' 
     */
    remove (delStore, delType) {
        return new Promise((resolve, reject) => {
            if (delType === 'delete') {
                try {
                    fs.unlinkSync(delStore.path);
                } catch (error) {
                    reject('Cannot delete the selected store! Please try again or remove the files manually.');
                    return;
                }
            }

            const stores = this.stores.filter(store => {
                return !(store.name === delStore.name && store.path === delStore.path);
            });

            this.stores = stores;
            this.getSettings().set('stores', stores);

            resolve();
        });
    }

    /**
     * get the list of available stores
     * @function
     * @returns {array} array of stores
     */
    getStores () {
        return this.stores;
    }

    /**
     * returns the currently open password store
     * @function
     * @returns {Store} the current store
     */
    getCurrent () {
        return this.currentStore;
    }

    /**
     * return the settings object
     * @function
     * @returns {Settings}
     */
    getSettings () {
        return this.settings;
    }

    /**
     * open / set as the current opened store
     * @param {object} store object 
     * @function
     * @returns {Store} the opened store object
     */
    open (storePath, password) {
        return new Promise((resolve, reject) => {
            const testPath = path.join(storePath, 'test.json');
            const testJSON = require(testPath);
            const testData = Safe.decrypt(testJSON, password);

            if (testData.check) {
                this.currentStore = new Store(storePath, password);
                resolve(this.currentStore);
            } else {
                reject('Wrong master password');
            }
        });
    }

    /**
     * close the current store
     * @function
     * @returns {Stores}
     */
    close () {
        this.currentStore = null;
        return this;
    }

    /**
     * validates the store name
     * @param {string} store name 
     * @function
     * @returns {boolean}
     */
    validate (name) {
        if (!name.length) {
            log.warning('Invalid store name', 1);

            return false;
        }

        if (!/^[a-zA-Z0-9\s]*$/.test(name)) {
            log.warning('Store name can contain only letters, numbers and spaces', 1);
            return false;
        }

        const stores = this.getSettings().get('stores');
        const storesNames = stores ? stores.map(store => store.name) : [];
        if (storesNames.indexOf(name) > -1) {
            log.warning('A store with this name already exists', 1);
            return false;
        }

        return true;
    }
};

module.exports = Stores;
