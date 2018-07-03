const fs = require('fs');
const path = require('path');
const vorpal = require('vorpal')();
const inquirer = require('inquirer');
const chalk = require('chalk');
const clipboardy = require('clipboardy');

const Settings = require('./settings');
const Stores = require('./stores');
const StoreTypes = require('./types');
const log = require('./log');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

class Pass {
    /**
     * cli app constructor
     * @function
     */
    constructor () {
        this.settings = new Settings();
        this.stores = null;
    }

    /**
     * initializes the cli app
     * @function
     */
    init () {
        log.simple('************************************************');
        log.simple('*                                              *');
        log.simple('*  Hello and welcome to Pass password manager  *');
        log.simple('*                                              *');
        log.simple('************************************************');

        // load the current settings
        this.settings.load().then(settings => {
            // initializing the Stores object
            this.stores = new Stores(this.settings);
            const defaultStore = this.settings.get('default', null);

            if (!this.stores.getStores().length) {
                log.info('Run `create` to create a new password store or `add` to add a previously created one. To skip this process press Enter.');
            }

            if (defaultStore) {
                log.info(`A default store was set up. Pass will ask you ${defaultStore.name}'s master password.`);
            }

            log.info('Run `help` to view all possibile options');
            log.nl();

            if (defaultStore) {
                this.openDefault(defaultStore);
            } else {
                this.cli();
            }
        }).catch(error => {
            log(chalk.red(error));
        });
    }

    cli (delimiter = ':') {
        // create new password store
        vorpal
            .command('create')
            .description('Create new password storage')
            .action((args, callback) => {
                inquirer.prompt([{
                    type: 'input',
                    name: 'name',
                    message: 'Store name',
                    validate: val => {
                        return this.stores.validate(val);
                    }
                }, {
                    type: 'input',
                    name: 'path',
                    message: 'Storage path',
                    default: this.settings.defaultStores,
                    validate: val => {
                        if (!fs.existsSync(val)) {
                            log.warning('The selected path is not valid or the indicated base folder is missing', 1);
                            return false;
                        }
                        return true;
                    }
                }, {
                    type: 'password',
                    name: 'password',
                    message: 'Master Password',
                    validate: val => {
                        const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
                        if (!regex.test(val)) {
                            log.warning('Password does not match the security requirements! Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character', 1);
                            return false;
                        }
                        return true;
                    }
                }, {
                    type: 'password',
                    name: 'password2',
                    message: 'Repeat Master Password',
                    validate: (val, answer) => {
                        if (val === answer.password) return true;
                        log.warning('The password and repeat password are not the same!', 1);
                        return false;
                    }
                }]).then(answer => {
                    this.stores.create(answer.name, answer.password, answer.path).then(store => {
                        log.success('Password store created successfully');
                        callback();
                    }).catch(error => {
                        console.log(error);
                        callback();
                    });
                }).catch(error => {
                    log.error('There was a problem while reading the inputed Master Password', 3, error);
                    callback();
                });
            });

        // add existing password store
        vorpal
            .command('add')
            .description('Add a previously created password storage')
            .action((args, callback) => {
                inquirer.prompt([{
                    type: 'input',
                    name: 'path',
                    message: 'Store path',
                    validate: val => {
                        if (!fs.existsSync(path.join(val.trim(), 'store.json'))) {
                            log.warning('The selected path is not valid', 1);
                            return false;
                        }

                        const stores = this.stores.getStores();
                        for (let i = 0; i < stores.length; i++) {
                            if (stores[i].path === val.trim()) {
                                log.warning('The selected store already present in the stores list', 1);
                                return false;
                            }
                        }

                        return true;
                    }
                }]).then(answer => {
                    this.stores.add(answer.path.trim()).then(store => {
                        log.success('Store added successfully! Run `stores` command to view all available stores');
                        log.nl();
                        callback();
                    }).catch(error => {
                        log.error(error);
                        log.nl();
                        callback();
                    });
                });
            });

        // open password store
        vorpal
            .command('open')
            .description('Open a password storage')
            .action((args, callback) => {
                const stores = this.settings.get('stores');

                if (Array.isArray(stores) && stores.length) {
                    inquirer.prompt([{
                        type: 'list',
                        name: 'store',
                        message: 'Select store',
                        choices: stores.map(store => {
                            return {
                                name: store.name,
                                value: store.path
                            };
                        })
                    }, {
                        type: 'password',
                        name: 'password',
                        message: 'Master password'
                    }]).then(answer => {
                        this.stores.open(answer.store, answer.password).then(store => {
                            vorpal.delimiter(store.store.name + ':');
                            callback();
                        }).catch(error => {
                            log.warning(error);
                            log.nl();
                            callback();
                        });
                    });
                } else {
                    log.info('No available stores to open');
                    callback();
                }
            });

        vorpal
            .command('close')
            .description('Close the current password storage')
            .action((args, callback) => {
                this.stores.close();
                vorpal.delimiter(':');
                callback();
            });

        // delete a password store
        vorpal
            .command('delete')
            .description('Delete a password storage')
            .action((args, callback) => {
                const stores = this.settings.get('stores');

                inquirer.prompt([{
                    type: 'list',
                    name: 'store',
                    message: 'Select store to delete',
                    choices: stores.map(store => {
                        return {
                            name: store.name,
                            value: store
                        };
                    })
                }, {
                    type: 'list',
                    name: 'delete',
                    message: 'Are you sure you want to delete the selected password store?',
                    choices: [
                        {name: 'No', value: 'cancel'},
                        new inquirer.Separator(),
                        {name: 'Yes, also move to trash', value: 'trash'},
                        {name: 'Just remove reference', value: 'bookmark'}
                    ]
                }]).then(answer => {
                    if (['trash', 'bookmark'].indexOf(answer.delete) > -1) {
                        this.stores.remove(answer.store, answer.delete).then(() => {
                            log.success('Store removed successfully!');
                            log.nl();
                            callback();
                        }).catch(error => {
                            log.error(error);
                            log.nl();
                            callback();
                        });
                    } else {
                        callback();
                    }
                });
            });

        // view the current password store
        vorpal
            .command('current')
            .option('-p, --password', 'Shows the password')
            .description('View the current password store')
            .action((args, callback) => {
                const store = this.stores.getCurrent();
                if (store) {
                    log.info('Currently open store:\n');
                    log.info(`${'Name:'.padStart(10)} ${store.store.name}`);
                    log.info(`${'Password:'.padStart(10)} ${args.options.password ? store.password : store.password.replace(/./g, '*')}`);
                    log.info(`${'Path:'.padStart(10)} ${store.path}`);
                    log.info(`${'Records:'.padStart(10)} ${store.store.indexes.length}`);
                    log.nl();
                } else {
                    log.warning('No store open. Use `open` command top open a store.');
                    log.nl();
                }
                callback();
            });

        // list available password stores
        vorpal
            .command('stores')
            .description('List available password stores')
            .action((args, callback) => {
                const stores = this.stores.getStores();
                if (!stores.length) {
                    log.warning('There are no stores yet');
                    log.nl();
                } else {
                    log.info('Available password stores:');
                    stores.map((store, i) => {
                        log.simple(`${i + 1}) ${store.name}  `, 6, chalk.greenBright(store.path));
                    });
                    log.nl();
                }
                callback();
            });

        // set default password store
        vorpal
            .command('default')
            .description('Select a default store to automatically open when starting Pass')
            .action((args, callback) => {
                if (this.stores.getCurrent()) {
                    log.warning('Please close the current store using the `close` command before setting a new default store');
                    log.nl();
                    callback();
                    return;
                }

                let choices = this.stores.getStores().map(store => { return {...store, value: store}; });
                const defaultStore = this.settings.get('default', null);
                if (defaultStore) {
                    choices = [...choices, new inquirer.Separator(), {name: 'Remove default store', value: null}];
                }

                inquirer.prompt([{
                    type: 'list',
                    name: 'store',
                    message: 'Select store',
                    choices: choices
                }]).then(answer => {
                    if (!answer.store) {
                        this.settings.remove('default');
                        log.success('The default store was removed.');
                        log.nl();
                    } else {
                        this.settings.set('default', {path: answer.store.path, name: answer.store.name});
                        log.success('The default store was successfully set. Pass will request your Master Password the next time you open the utility.');
                        log.nl();
                    }
                    callback();
                });
            });

        // insert new store type
        vorpal
            .command('insert')
            .description('Insert a new password into the current password store')
            .action((args, callback) => {
                if (!this.stores.getCurrent()) {
                    log.warning('Open a password storage first!');
                    log.nl();
                    callback();
                    return;
                }

                inquirer.prompt([{
                    type: 'list',
                    name: 'type',
                    message: 'Select store type',
                    choices: StoreTypes.typeList
                }]).then(answer => {
                    StoreTypes.ask(answer.type, info => {
                        this.stores.getCurrent().add(answer.type, info).then(result => {
                            log.success('Password info stored successfully!');
                            callback();
                        }).catch(error => {
                            log.error(error);
                            callback();
                        });
                    });
                });
            });

        // find a password in a password store
        vorpal
            .command('find')
            .description('Search a record')
            .action((args, callback) => {
                if (!this.stores.getCurrent()) {
                    log.warning('Open a password storage first!');
                    log.nl();
                    callback();
                    return;
                }

                inquirer.prompt([{
                    type: 'autocomplete',
                    name: 'selected',
                    message: 'Find in store',
                    pageSize: 20,
                    source: (answers, input) => {
                        return this.stores.getCurrent().find(input);
                    }
                }]).then(info => {
                    const choices = [
                        {name: 'View', value: 'view'},
                        {name: 'Edit', value: 'edit'},
                        {name: 'Copy to clipboard', value: 'copy'},
                        new inquirer.Separator(),
                        {name: 'Delete', value: 'delete'}
                    ];

                    inquirer.prompt([{
                        type: 'list',
                        name: 'what',
                        message: 'What would you like to do',
                        choices: choices
                    }]).then(answer => {
                        if (answer.what === 'view') {
                            StoreTypes.printInfo(info.selected);
                            callback();
                        } else if (answer.what === 'edit') {
                            StoreTypes.ask(info.selected.type, updatedInfo => {
                                this.stores.getCurrent().add(info.selected.type, updatedInfo, info.selected).then(result => {
                                    log.success('Password info updated successfully!');
                                    log.nl();
                                    callback();
                                }).catch(error => {
                                    log.error(error);
                                    log.nl();
                                    callback();
                                });
                            }, info.selected);
                        } else if (answer.what === 'copy') {
                            clipboardy.writeSync(StoreTypes.copyInfo(info.selected));
                            log.success('Password info copied to clipboard successfully!');
                            log.nl();
                            callback();
                        } else if (answer.what === 'delete') {
                            inquirer.prompt([{
                                type: 'confirm',
                                name: 'delete',
                                message: 'Are you sure you want to delete this record?',
                                default: false
                            }]).then(confirmation => {
                                if (confirmation.delete) {
                                    console.log('Should delete the record');
                                }

                                callback();
                            }).catch(error => {
                                log.error(error);
                                log.nl();
                                callback();
                            });
                        }
                    });
                });
            });

        // lists all records inside the password store
        vorpal
            .command('list')
            .description('Lists all records inside the password store')
            .action((args, callback) => {
                if (!this.stores.getCurrent()) {
                    log.warning('Open a password storage first!');
                    log.nl();
                    callback();
                    return;
                }

                this.stores.getCurrent().list();

                callback();
            });

        // sync
        vorpal
            .command('sync')
            .description('Synchronization options')
            .action((args, callback) => {
                const store = this.stores.getCurrent();

                if (!store) {
                    log.warning('Open a password storage first!');
                    log.nl();
                    callback();
                    return;
                }

                const syncInit = () => {
                    inquirer.prompt([{
                        type: 'input',
                        name: 'origin',
                        message: 'Enter git repo origin URL'
                    }, {
                        type: 'input',
                        name: 'username',
                        message: 'Enter git repo username'
                    }, {
                        type: 'input',
                        name: 'email',
                        message: 'Enter git author email'
                    }, {
                        type: 'password',
                        name: 'password',
                        message: 'Enter git repo password'
                    }]).then(answer => {
                        store.syncInit(answer).then(() => {
                            log.success('Sync repository initialized');
                            log.nl();
                            callback();
                        }).catch(error => {
                            log.error('An error occured while initializing the password storage repository', error);
                            log.nl();
                            callback();
                        });
                    });
                };

                // if the current store settings does not have a sync repo set up
                if (typeof store.sync === 'undefined') {
                    log.info('The opened password storage does not have a sync repository setup. Follow the wizard to configure the sync process.');
                    log.nl();
                    syncInit();
                } else {
                    inquirer.prompt([{
                        type: 'list',
                        name: 'sync',
                        message: 'Select sync option',
                        choices: [
                            {name: 'Sync', value: 'sync'},
                            {name: 'Reinitialize git repository', value: 'init'},
                            new inquirer.Separator(),
                            {name: 'Remove sync repository', value: 'remove'}
                        ]
                    }]).then(answer => {
                        if (answer.sync === 'init') {
                            syncInit();
                        } else if (answer.sync === 'remove') {
                            store.syncRemove().then(() => {
                                log.success('Password storage repository removed successfully!');
                                log.nl();
                                callback();
                            }).catch(error => {
                                log.error('An error occured while removing the password storage repository', error);
                                log.nl();
                                callback();
                            });
                        } else {
                            store.sync(answer).then(() => {
                                log.success('Password storage synced successfully!');
                                log.nl();
                                callback();
                            }).catch(error => {
                                log.error('An error occured while syncing the password store', error);
                                log.nl();
                                callback();
                            });
                        }
                    });
                }
            });

        vorpal
            .delimiter(delimiter)
            .show();
    }

    /**
     * opens the default password store
     * @function
     */
    openDefault (defaultStore) {
        inquirer.prompt([{
            type: 'password',
            name: 'password',
            message: `Enter master password for the default store (${defaultStore.name})`
        }]).then(answer => {
            this.stores.open(defaultStore.path, answer.password).then(store => {
                this.cli(store.store.name + ':');
            }).catch(error => {
                log.warning('Wrong password. Use `open` to open a password store.', error);
                log.nl();
                this.cli();
            });
        });
    }

    /**
     * exits the cli app
     * @function
     */
    exit () {

    }
}

const pass = new Pass();
pass.init();
