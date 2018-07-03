const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const NodeGit = require('nodegit');

const Safe = require('./safe');
const log = require('./log');

const Store = class Store {
    constructor (storePath, password) {
        this.path = storePath; // the store path
        this.password = password; // the store master password
        this.storeBasePath = path.join(this.path, 'store.json'); // the store info json path

        try {
            // try to read the store info
            this.store = require(this.storeBasePath);
        } catch (error) {
            log.error('Unable to read the password store info', error);
            log.nl();
        }
    }

    /**
     * adds a new record to the password store
     * @param {string} type
     * @param {object} info
     * @param {object} oldInfo
     * @function
     * @returns {Promise}
     */
    add (type, info, oldInfo) {
        return new Promise((resolve, reject) => {
            delete info.confirm;

            const data = {
                label: info.label,
                tags: info.tags.split(',').map(tag => tag.trim()),
                type,
                safe: Safe.encrypt(JSON.stringify(info), this.password)
            };

            const storeFileName = info.label.replace(/ +/g, '-').toLowerCase() + '.json';
            const storePathType = path.join(this.path, type);
            const storePath = path.join(storePathType, storeFileName);

            if (!fs.existsSync(storePathType)) {
                try {
                    fs.mkdirSync(storePathType);
                } catch (error) {
                    reject(error);
                    return;
                }
            }

            // if we're updating a store
            const oldStoreFileName = oldInfo.label.replace(/ +/g, '-').toLowerCase() + '.json';
            if (typeof oldInfo !== 'undefined' && oldStoreFileName !== storeFileName) {
                try {
                    fs.unlinkSync(path.join(storePathType, oldStoreFileName));
                    this.removeIndex(`./${oldInfo.type}/${oldStoreFileName}`);
                } catch (error) {
                    reject(error);
                    return;
                }
            }

            try {
                fs.writeFileSync(storePath, JSON.stringify(data, undefined, 4));

                this.addIndex({
                    label: info.label,
                    type,
                    path: storePath.replace(this.path, '.')
                });

                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * remove a password storage record
     * @function
     */
    remove () {

    }

    /**
     * find a password storage record based on a search term
     * @param {string} term
     */
    find (term) {
        return new Promise((resolve, reject) => {
            let found = [];
            if (!term) {
                resolve(found);
                return;
            }

            this.store.indexes.forEach(index => {
                try {
                    const storeData = require(path.resolve(this.path, index.path));
                    const storeSafeString = Safe.decrypt(storeData.safe, this.password);
                    const storeSafeData = JSON.parse(storeSafeString.data);

                    if (storeSafeString.check) {
                        for (let key in storeSafeData) {
                            if (typeof storeSafeData[key] === 'string' && storeSafeData[key].toLowerCase().indexOf(term.toLowerCase()) > -1) {
                                found.push({...storeSafeData, type: index.type});
                                break;
                            }
                        }
                    }
                } catch (error) {
                    // reject(error);
                    found.push({label: `Password store file missing (${index.path})! try running a reindex to fix this`, type: 'Unknown'});
                }
            });

            resolve(found.map(pass => {
                return {name: `${pass.label} (${pass.type})`, value: pass};
            }));
        });
    }

    /**
     * list all the records inside the password store
     * @function
     * @returns {Promise}
     */
    list () {
        return new Promise((resolve, reject) => {
            log.info(`Store contains ${this.store.indexes.length} records:`);
            let list = {};

            this.store.indexes.forEach(index => {
                try {
                    const storeData = require(path.resolve(this.path, index.path));
                    const storeSafeString = Safe.decrypt(storeData.safe, this.password);
                    const storeSafeData = JSON.parse(storeSafeString.data);

                    if (storeSafeString.check) {
                        if (typeof list[index.type] === 'undefined') list[index.type] = [];
                        list[index.type].push(storeSafeData);
                    }
                } catch (error) {
                    reject(error);
                }
            });

            for (let keys = Object.keys(list), j = 0, end = keys.length; j < end; j++) {
                const last = j >= end - 1;
                log.simple(`${last ? '└──' : '├──'} ${chalk.yellowBright.bold(keys[j])} (${chalk.yellowBright.bold(list[keys[j]].length)}):`);

                list[keys[j]].forEach((record, i) => {
                    log.simple(`${last ? '    ' : '│   '}${i >= list[keys[j]].length - 1 ? '└──' : '├──'} ${chalk.white(record.label)}`);
                });
            }

            log.nl();
        });
    }

    open (path) {

    }

    addIndex (index) {
        if (this.store.indexes.indexOf(index) === -1) {
            this.store.indexes.push(index);
            this.save();
        }
    }

    removeIndex (path) {
        this.store.indexes = this.store.indexes.filter(index => {
            return index.path !== path;
        });
        this.save();
    }

    reindex () {

    }

    /**
     * save the stores info
     * @function
     * @returns {Store}
     */
    save () {
        try {
            fs.writeFileSync(this.storeBasePath, JSON.stringify(this.store, undefined, 4));
        } catch (error) {
            log.error('There was a problem while saving the settings', error);
            log.nl();
        }
        return this;
    }

    sync (options) {
        return new Promise((resolve, reject) => {
            const sync = Safe.decrypt(this.store.sync, this.password);

            if (!sync.check) {
                reject('Unable to decrypt repo credentials!');
                return;
            }

            try {
                const data = JSON.parse(sync.data);
                let repository, index, remote, oid;

                NodeGit.Repository.open(this.path).then(repo => {
                    repository = repo;
                    return repo.getRemote('origin');
                }).then(rmt => {
                    remote = rmt;
                    return repository.fetch(rmt, {
                        callbacks: {
                            credentials: (url, username) => {
                                return NodeGit.Cred.userpassPlaintextNew(data.username, data.password);
                            }
                        }
                    });
                }).then(() => {
                    return repository.checkoutBranch('master');
                }).then(() => {
                    // refresh the current indexes
                    return repository.refreshIndex();
                }).then(idx => {
                    index = idx;
                    // stage all files
                    return index.addAll();
                }).then(() => {
                    return index.write();
                }).then(() => {
                    return index.writeTree();
                }).then(o => {
                    oid = o;
                    return NodeGit.Reference.nameToId(repository, 'HEAD');
                }).then(head => {
                    return repository.getCommit(head);
                }).then(parent => {
                    // initialize a git author
                    const author = NodeGit.Signature.create(data.username, data.email, Math.round(Date.now() / 1000), 60);
                    // commit the updates
                    return repository.createCommit('HEAD', author, author, 'Update', oid, [parent]);
                }).then(() => {
                    // push the newly created commit
                    return remote.push(['refs/heads/master:refs/heads/master'], {
                        callbacks: {
                            credentials: (url, userName) => {
                                return NodeGit.Cred.userpassPlaintextNew(data.username, data.password);
                            },
                            transferProgress: progress => {
                                console.log('progress: ', progress);
                            }
                        }
                    });
                }).then(() => {
                    resolve();
                }).catch(error => {
                    reject('Unable to open password store repository!', error);
                });
            } catch (error) {
                reject('Unable to parse repo credentials data!', error);
            }
        });
    }

    /**
     * initialize the git repo for the current password storage
     * @param {object} options
     * @function
     * @returns {Promise}
     */
    syncInit (options) {
        return new Promise((resolve, reject) => {
            let repository, remote;

            // initialize the git repo for this password storage
            NodeGit.Repository.init(this.path, 0).then(repo => {
                repository = repo;
                // get all the remotes for this password storage
                return repo.getRemotes();
            }).then(remotes => {
                // saving the credetials
                this.store.sync = Safe.encrypt(JSON.stringify(options), this.password);
                this.save();

                // remove origin remote if available
                if (remotes.length) {
                    return this.syncRemoveRemote();
                }

                return Promise.resolve();
            }).then(() => {
                return this.syncAddRemote(options.origin);
            }).then(rmt => {
                remote = rmt;
                // initialize a git author
                const author = NodeGit.Signature.create(options.username, options.email, Math.round(Date.now() / 1000), 60);
                // create an initial commit
                return repository.createCommitOnHead([], author, author, 'Initial commit');
            }).then(() => {
                // push the first commit
                return remote.push(['refs/heads/master:refs/heads/master'], {
                    callbacks: {
                        credentials: (url, userName) => {
                            return NodeGit.Cred.userpassPlaintextNew(options.username, options.password);
                        }
                    }
                });
            }).then(() => {
                resolve();
            }).catch(error => {
                reject('Unable to inialize password store git repo!', error);
            });
        });
    }

    /**
     * adds a git remote to the current password storage repository
     * @param {string} origin
     * @function
     * @returns {Promise}
     */
    syncAddRemote (origin) {
        return new Promise((resolve, reject) => {
            NodeGit.Repository.open(this.path).then(repository => {
                return NodeGit.Remote.create(repository, 'origin', origin);
            }).then(remote => {
                resolve(remote);
            }).catch(error => {
                reject(error);
            });
        });
    }

    /**
     * removes the origin git remote from the current password storage repository
     * @param {string} origin
     * @function
     * @returns {Promise}
     */
    syncRemoveRemote () {
        return new Promise((resolve, reject) => {
            NodeGit.Repository.open(this.path).then(repository => {
                return NodeGit.Remote.delete(repository, 'origin');
            }).then(() => {
                resolve();
            }).catch(error => {
                reject(error);
            });
        });
    }
};

module.exports = Store;
