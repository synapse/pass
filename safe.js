const crypto = require('crypto');

module.exports = {
    encrypt: (data, pass) => {
        let password = new Buffer.alloc(32);
        password.write(pass, 'utf8');

        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', password, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag();

        var eHash = crypto.createHash('sha1');
        eHash.setEncoding('hex');
        eHash.update(data, 'utf8');

        return `${encrypted}:${iv.toString('hex')}:${tag.toString('hex')}:${eHash.digest('hex')}`;
    },
    decrypt: (encoded, pass) => {
        let password = new Buffer.alloc(32);
        password.write(pass, 'utf8');

        const chunks = encoded.split(':');
        const data = chunks[0];
        const iv = new Buffer.from(chunks[1], 'hex');
        const tag = new Buffer.from(chunks[2], 'hex');
        const hash = chunks[3];

        const decipher = crypto.createDecipheriv('aes-256-gcm', password, iv);
        decipher.setAuthTag(tag);
        let decrypted = null;

        try {
            decrypted = decipher.update(data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
        } catch (error) {

        }

        var dHash = crypto.createHash('sha1');
        dHash.setEncoding('hex');
        dHash.update(decrypted, 'utf8');

        return {
            data: decrypted,
            check: dHash.digest('hex') === hash
        };
    }
};
