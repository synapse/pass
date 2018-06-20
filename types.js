const inquirer = require('inquirer');

const typeList = [
    {name: 'Passsword', value: 'password'},
    {name: 'Email Account', value: 'emailAccount'},
    {name: 'Credit Card', value: 'creditCard'},
    {name: 'Identity', value: 'identity'},
    {name: 'Secure Note', value: 'secureNote'}
];

const labels = {
    label: 'Label',
    username: 'Username',
    password: 'Password',
    website: 'Website',
    cardholderName: 'Cardholder Name',
    type: 'Type',
    number: 'Number',
    cvv: 'CVV',
    expiryDate: 'Expiry Date',
    validFrom: 'Valid From',
    issuingBank: 'Issuing Bank',
    phoneLocal: 'Phone (local)',
    phoneTollFree: 'Phone (toll free)',
    phoneIntl: 'Phone (international)',
    pin: 'PIN',
    creditLimit: 'Credit Limit',
    cashWithdrawalLimit: 'Cash Withdrawal Limit',
    interestRate: 'Interest Rate',
    issueNumber: 'Issue Number',
    notes: 'Notes',
    tags: 'Tags',
    contactInfo: 'CONTACT INFORMATION',
    additionalDetails: 'ADDITIONAL DETAILS'
};

const types = {
    password: (answers) => {
        return [
            {
                type: 'input',
                name: 'label',
                message: 'Label',
                default: (answers && answers.label) ? answers.label : null
            }, {
                type: 'input',
                name: 'username',
                message: 'Username',
                default: (answers && answers.username) ? answers.username : null
            }, {
                type: 'input',
                name: 'password',
                message: 'Password',
                default: (answers && answers.password) ? answers.password : null
            }, {
                type: 'input',
                name: 'website',
                message: 'Website',
                default: (answers && answers.website) ? answers.website : null
            }, {
                type: 'input',
                name: 'notes',
                message: 'Notes',
                default: (answers && answers.notes) ? answers.notes : null
            }, {
                type: 'input',
                name: 'tags',
                message: 'Tags',
                default: (answers && answers.tags) ? answers.tags : null
            }, {
                type: 'confirm',
                name: 'confirm',
                message: 'Are the password info correct?',
                default: false
            }
        ];
    },
    creditCard: (answers) => {
        return [
            {
                type: 'input',
                name: 'label',
                message: 'Label',
                default: (answers && answers.label) ? answers.label : null
            }, {
                type: 'input',
                name: 'cardholderName',
                message: 'Cardholder Name',
                default: (answers && answers.cardholderName) ? answers.cardholderName : null
            }, {
                type: 'list',
                name: 'type',
                message: 'Type',
                default: (answers && answers.type) ? answers.type : null,
                choices: ['VISA', 'MasterCard', 'American Express', 'Diners Club', 'Carte Blanche', 'Discover', 'JCB', 'MasterCard Maestro', 'VISA Electron', 'Laser', 'UnionPay', 'Other']
            }, {
                type: 'input',
                name: 'number',
                message: 'Number',
                default: (answers && answers.number) ? answers.number : null
            }, {
                type: 'input',
                name: 'cvv',
                message: 'CVV',
                default: (answers && answers.cvv) ? answers.cvv : null
            }, {
                type: 'input',
                name: 'expiryDate',
                message: 'Expiry Date (mm/yyyy)',
                default: (answers && answers.expiryDate) ? answers.expiryDate : null
            }, {
                type: 'input',
                name: 'validFrom',
                message: 'Valid From (mm/yyyy)',
                default: (answers && answers.validFrom) ? answers.validFrom : null
            }, {
                type: 'confirm',
                name: 'addContactInfo',
                message: 'Would you like to add some contact info? (bank, phone, etc.)',
                default: (answers && answers.addContactInfo) ? answers.addContactInfo : false
            }, {
                type: 'input',
                name: 'issuingBank',
                message: 'Issuing Bank',
                default: (answers && answers.contactInfo.issuingBank) ? answers.contactInfo.issuingBank : null,
                when: currenAnswers => {
                    return currenAnswers.addContactInfo;
                }
            }, {
                type: 'input',
                name: 'phoneLocal',
                message: 'Phone (local)',
                default: (answers && answers.contactInfo.phoneLocal) ? answers.contactInfo.phoneLocal : null,
                when: currenAnswers => {
                    return currenAnswers.addContactInfo;
                }
            }, {
                type: 'input',
                name: 'phoneTollFree',
                message: 'Phone (toll free)',
                default: (answers && answers.contactInfo.phoneTollFree) ? answers.contactInfo.phoneTollFree : null,
                when: currenAnswers => {
                    return currenAnswers.addContactInfo;
                }
            }, {
                type: 'input',
                name: 'phoneIntl',
                message: 'Phone (international)',
                default: (answers && answers.contactInfo.phoneIntl) ? answers.contactInfo.phoneIntl : null,
                when: currenAnswers => {
                    return currenAnswers.addContactInfo;
                }
            }, {
                type: 'input',
                name: 'website',
                message: 'Website',
                default: (answers && answers.contactInfo.website) ? answers.contactInfo.website : null,
                when: currenAnswers => {
                    return currenAnswers.addContactInfo;
                }
            }, {
                type: 'confirm',
                name: 'addAdditionalDetails',
                message: 'Would you like to add additional details? (pin, credit info, etc.)',
                default: (answers && answers.addAdditionalDetails) ? answers.addAdditionalDetails : false
            }, {
                type: 'input',
                name: 'pin',
                message: 'PIN',
                default: (answers && answers.additionalDetails.pin) ? answers.additionalDetails.pin : null,
                when: currenAnswers => {
                    return currenAnswers.addAdditionalDetails;
                }
            }, {
                type: 'input',
                name: 'creditLimit',
                message: 'Credit Limit',
                default: (answers && answers.additionalDetails.creditLimit) ? answers.additionalDetails.creditLimit : null,
                when: currenAnswers => {
                    return currenAnswers.addAdditionalDetails;
                }
            }, {
                type: 'input',
                name: 'cashWithdrawalLimit',
                message: 'Cash Withdrawal Limit',
                default: (answers && answers.additionalDetails.cashWithdrawalLimit) ? answers.additionalDetails.cashWithdrawalLimit : null,
                when: currenAnswers => {
                    return currenAnswers.addAdditionalDetails;
                }
            }, {
                type: 'input',
                name: 'interestRate',
                message: 'Interest Rate',
                default: (answers && answers.additionalDetails.interestRate) ? answers.additionalDetails.interestRate : null,
                when: currenAnswers => {
                    return currenAnswers.addAdditionalDetails;
                }
            }, {
                type: 'input',
                name: 'issueNumber',
                message: 'Issue Number',
                default: (answers && answers.additionalDetails.issueNumber) ? answers.additionalDetails.issueNumber : null,
                when: currenAnswers => {
                    return currenAnswers.addAdditionalDetails;
                }
            }, {
                type: 'input',
                name: 'notes',
                message: 'Notes',
                default: (answers && answers.notes) ? answers.notes : null
            }, {
                type: 'input',
                name: 'tags',
                message: 'Tags',
                default: (answers && answers.tags) ? answers.tags : null
            }, {
                type: 'confirm',
                name: 'confirm',
                message: 'Are the credit card info correct?',
                default: false
            }
        ];
    }
};

const ask = (storeType, callback, answers) => {
    inquirer.prompt(types[storeType](answers)).then(answers => {
        if (!answers.confirm) {
            ask(storeType, callback, answers);
        } else {
            // clean these keys
            ['addContactInfo', 'addAdditionalDetails', 'confirm'].forEach(clean => {
                delete answers[clean];
            });

            // we want a more details object structure for the credit card
            if (storeType === 'creditCard') {
                if (typeof answers.contactInfo === 'undefined') answers.contactInfo = {};
                if (typeof answers.additionalDetails === 'undefined') answers.additionalDetails = {};

                ['issuingBank', 'phoneLocal', 'phoneTollFree', 'phoneIntl', 'website'].forEach(info => {
                    if (typeof answers[info] !== 'undefined') {
                        answers.contactInfo[info] = answers[info];
                        delete answers[info];
                    }
                });
                ['pin', 'creditLimit', 'cashWithdrawalLimit', 'interestRate', 'issueNumber'].forEach(info => {
                    if (typeof answers[info] !== 'undefined') {
                        answers.additionalDetails[info] = answers[info];
                        delete answers[info];
                    }
                });
            }

            callback(answers);
        }
    });
};

const getLabel = label => {
    if (typeof labels[label] === 'undefined') return label;
    return labels[label];
};

const printInfo = info => {
    console.log(`\n   ${'RECORD DETAILS:'.padStart(25)}`);

    for (let key in info) {
        switch (key) {
        case 'type':
        case 'addContactInfo':
        case 'addAdditionalDetails':
            continue;

        case 'contactInfo':
        case 'additionalDetails':
            console.log(`\n  ${getLabel(key).padStart(25)}:`);
            for (let subkey in info[key]) {
                console.log(`   ${getLabel(subkey).concat(':').padStart(25)} ${info[key][subkey]}`);    
            }
            break;

        default:
            console.log(`   ${getLabel(key).concat(':').padStart(25)} ${info[key]}`);
            break;
        }
    }
    console.log('\n');
};

module.exports = {
    ask,
    typeList,
    types,
    getLabel,
    printInfo
};

/*
    creditCard: {
            cardholderName: '',
            type: '',
            number: '',
            verificationNumner: '',
            expiryDate: '',
            validFrom: '',
            contactInfo: {
                issuingBank: '',
                phoneLocal: '',
                phoneTollFree: '',
                phoneIntl: '',
                website: ''
            },
            additionalDetails: {
                pin: '',
                creditLimit: '',
                cashWithdrawalLimit: '',
                interestRate: '',
                issueNumber: ''
            },
            notes: '',
            tags: [],
            attachments: []
        },
        emailAccount: {
            type: '', // IMAP, POP3, Either IMAP or POP3
            username: '',
            password: '',
            server: '',
            portNumber: '',
            security: '',
            authMethod: '',
            smtp: {
                server: '',
                portNumber: '',
                username: '',
                password: '',
                security: '',
                authMethod: ''
            }
        },
        identity: {
            firstName: '',
            lastName: '',
            sex: '',
            birthDate: '',
            occupation: '',
            company: '',
            department: '',
            jobTitle: '',
            address: {
                street: '',
                city: '',
                state: '',
                zip: '',
                country: ''
            },
            contact: {
                defaultPhone: '',
                homePhone: '',
                cell: '',
                business: ''
            },
            internetDetails: {
                username: '',
                email: '',
                website: '',
                skype: ''
            },
            notes: '',
            tags: [],
            attachments: []
        },
        secureNote: {
            notes: '',
            tags: [],
            attachments: []
        }
*/