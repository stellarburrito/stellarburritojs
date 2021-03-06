const StellarSdk = require('stellar-sdk')
const config = require('./config')
let server
const env = config.env
const errorManager = require('./error')
const memoCreator = require('./memo')
const Fee = require('./fee')
let fee

class Account {
    /**
     *
     * @param {string} key -> Pass a public or a private key
     */
    constructor(key) {
        fee = new Fee()
        if (typeof env != 'undefined' && env === "testnet") {
            StellarSdk.Network.useTestNetwork()
            server = new StellarSdk.Server(config.testnet_horizon)
        } else {
            StellarSdk.Network.usePublicNetwork()
            server = new StellarSdk.Server(config.pubnet_horizon)
        }
        if (typeof key != 'undefined') {
            if (StellarSdk.StrKey.isValidEd25519SecretSeed(key)) {
                this.privateKey = key
                this.publicKey = StellarSdk.Keypair.fromSecret(key).publicKey()
            } else if (StellarSdk.StrKey.isValidEd25519PublicKey(key)) {
                this.publicKey = key
                this.privateKey = null
            } else {
                throw ('Wrong key! Please provide a correct PublicKey or a correct PrivateKey')
            }
        } else {
            this.publicKey = null
            this.privateKey = null
        }
        this.balances = []
        this.data = []
        this.offers = []
        this.flags = []
        this.signers = []
        this.sequence = null
        this.inflation_destination = null
        this.home_domain = null
        this.thresholds = []
        this.trustlines = []
        this.transactions = []
        this.payments = []
        this.effects = []
        this.operations = []
        this.trades = []
    }

    newKeypair() {
        let key = StellarSdk.Keypair.random()
        this.privateKey = key.secret()
        this.publicKey = key.publicKey()
    }

    async Load() {
        return new Promise((resolve, reject) => {
            if (!StellarSdk.StrKey.isValidEd25519PublicKey(this.publicKey)) {
                throw 'Please verify your publicKey'
                return
            }
            this.balances = []
            this.data = []
            this.offers = []
            this.flags = []
            this.signers = []
            this.sequence = null
            this.inflation_destination = null
            this.home_domain = null
            this.thresholds = []
            this.trustlines = []
            let that = this
            server.accounts()
                .accountId(this.publicKey)
                .call()
                .then(function (page) {
                    for (let i = 0; i < page.balances.length; i++) {
                        if (typeof page.balances[i].asset_issuer != 'undefined')
                            that.trustlines.push({
                                asset_code: page.balances[i].asset_code,
                                asset_issuer: page.balances[i].asset_issuer
                            })
                        that.balances.push(page.balances[i])
                    }
                    that.data = page.data_attr
                    that.thresholds = page.thresholds
                    for (let i = 0; i < page.signers.length; i++)
                        that.signers.push(page.signers)
                    that.flags = page.flags
                    that.inflation_destination = page.inflation_destination
                    that.home_domain = page.home_domain
                    that.sequence = page.sequence
                    resolve(this)
                })
                .catch(function (error) {
                    reject(error)
                    return
                })
        })
    }

    async loadPayments(limit = 10, order = 'desc', cursor = 'now') {
        return new Promise((resolve, reject) => {
            this.payments = []
            let that = this
            server.payments()
                .forAccount(this.publicKey)
                .order(order)
                .limit(limit)
                .cursor()
                .call()
                .then(function (page) {
                    let i = 0
                    while (i < page.records.length) {
                        if (page.records[i].type === "payment")
                            that.payments.push(page.records[i])
                        i++
                    }
                    resolve()
                })
                .catch(function (err) {
                    reject('StellarBurrito_HORIZON_ERR can\'t load payments \n\r' + err)
                })
        })
    }

    async loadTrades(limit = 10, order = 'desc', cursor = 'now') {
        return new Promise((resolve, reject) => {
            this.trades = []
            let that = this
            server.trades()
                .forAccount(this.publicKey)
                .order(order)
                .limit(limit)
                .cursor()
                .call()
                .then(function (page) {
                    let i = 0
                    while (i < page.records.length) {
                        that.trades.push(page.records[i])
                        i++
                    }
                    resolve()
                })
                .catch(function (err) {
                    reject('StellarBurrito_HORIZON_ERR can\'t load payments \n\r' + err)
                })
        })
    }

    async loadEffects(limit = 10, order = 'desc', cursor = 'now') {
        return new Promise((resolve, reject) => {
            this.effects = []
            let that = this
            server.effects()
                .forAccount(this.publicKey)
                .order(order)
                .limit(limit)
                .cursor()
                .call()
                .then(function (page) {
                    let i = 0
                    while (i < page.records.length) {
                        that.effects.push(page.records[i])
                        i++
                    }
                    resolve()
                })
                .catch(function (err) {
                    reject('StellarBurrito_HORIZON_ERR can\'t load payments \n\r' + err)
                })
        })
    }

    async loadTransactions(limit = 10, order = 'desc', cursor = 'now') {
        return new Promise((resolve, reject) => {
            this.transactions = []
            let that = this
            server.transactions()
                .forAccount(this.publicKey)
                .order(order)
                .limit(limit)
                .cursor()
                .call()
                .then(function (page) {
                    let i = 0
                    while (i < page.records.length) {
                        that.transactions.push(page.records[i])
                        i++
                    }
                    resolve()
                })
                .catch(function (err) {
                    reject('StellarBurrito_HORIZON_ERR can\'t load payments \n\r' + err)
                })
        })
    }

    async setOptions(payload) {
        return new Promise((resolve, reject) => {
            let des = StellarSdk.Keypair.fromSecret(this.privateKey)
            server.loadAccount(des.publicKey())
                .catch(StellarSdk.NotFoundError, function (error) {
                    reject({
                        message: 'The creator account for doesn\'t exists.',
                        error
                    });
                })
                .then(function (sourceAccount) {
                    let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                        .addOperation(StellarSdk.Operation.setOptions(payload))
                        .build();
                    transaction.sign(des);
                    return server.submitTransaction(transaction)
                })
                .then(function (result) {
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Set Inflation Destination
     * set inflation destination for the given account
     *
     * @param {string} destination - The public key of inflation destination
     * @param {number} timeout - Timeout in seconds
     */
    async setInlationDestination(destination) {
        return new Promise((resolve, reject) => {
            if (typeof destination == 'object' && destination.constructor.name == "Account")
                destination = destination.publicKey
            else if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination))
                reject('Invalid destination ' + errorManager('keyPair', -1))
            let that = this
            this.setOptions({inflationDest: destination})
                .then(function (result) {
                    that.inflation_destination = destination
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Set Home domain
     * set home domain for the given account
     *
     * @param {string} homeDomain - The homedomain that you want to set
     * @param {number} timeout - Timeout in seconds
     */
    async setHomeDomain(homeDomain) {
        return new Promise((resolve, reject) => {
            let that = this
            this.setOptions({homeDomain})
                .then(function (result) {
                    that.Load(that.publicKey)
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Set Flag
     * set Flag for the given account
     *
     * @param {string} Flag -1 for Authorization required 2 for Authorization revocable 4 forAuthorization immutable
     * @param {number} timeout - Timeout in seconds
     */
    async setFlag(Flag) {
        return new Promise((resolve, reject) => {
            let that = this
            if (Flag != 1 && Flag != 2 && Flag != 4)
                reject({
                    message: 'Allowed flag values ==> 1 , 2 , 4',
                    error: 'Incorrect flag.'
                })
            this.setOptions({setFlags: Flag})
                .then(function (result) {
                    that.Load(that.publicKey)
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Clear Flag
     * Clear a specific flag for the given account
     *
     * @param {string} Flag -1 for Authorization required 2 for Authorization revocable 4 forAuthorization immutable
     * @param {number} timeout - Timeout in seconds
     */
    async clearFlag(Flag) {
        return new Promise((resolve, reject) => {
            let that = this
            if (Flag != 1 && Flag != 2 && Flag != 4)
                reject({
                    message: 'Allowed flag values ==> 1 , 2 , 4',
                    error: 'Incorrect flag.'
                })
            this.setOptions({clearFlags: Flag})
                .then(function (result) {
                    that.Load(that.publicKey)
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Set Signer
     * Set a new signer for the given account
     *
     * @param {string} signer - The public key of the new signer
     * @param {number} weight - weight for the signer 0-255
     * @param {number} timeout - Timeout in seconds
     */
    async setSigner(signer, weight) {
        return new Promise((resolve, reject) => {
            if (typeof signer == 'object' && signer.constructor.name == "Account")
                signer = signer.publicKey
            else if (!StellarSdk.StrKey.isValidEd25519PublicKey(signer))
                reject('Invalid signer ' + errorManager('keyPair', -1))
            let payload = {
                ed25519PublicKey: signer,
                weight
            }
            let that = this
            this.setOptions(payload, timeout)
                .then(function (result) {
                    that.Load(that.publicKey)
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Set lowthreshold
     * Set lowthreshold for the given account
     *
     * @param {number} lowThreshold - The value of Threshold 0-255
     * @param {number} timeout - Timeout in seconds
     */
    async setLowThreshold(lowThreshold) {
        return new Promise((resolve, reject) => {
            let that = this
            this.setOptions({lowThreshold})
                .then(function (result) {
                    that.lowThreshold = lowThreshold
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Set mediumthreshold
     * Set mediumthreshold for the given account
     *
     * @param {number} medThreshold - The value of Threshold 0-255
     * @param {number} timeout - Timeout in seconds
     */
    async setMediumThreshold(medThreshold) {
        return new Promise((resolve, reject) => {
            let that = this
            this.setOptions({medThreshold})
                .then(function (result) {
                    that.medThreshold = medThreshold
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Set highThreshold
     * Set highthreshold for the given account
     *
     * @param {number} highThreshold - The value of Threshold 0-255
     * @param {number} timeout - Timeout in seconds
     */
    async setHighThreshold(highThreshold) {
        return new Promise((resolve, reject) => {
            let that = this
            this.setOptions({highThreshold})
                .then(function (result) {
                    that.highThreshold = highThreshold
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * Set master weight
     * Set Master key weight for the given account
     * @param {number} masterWeight - The weight of master key 0-255
     * @param {number} timeout - Timeout in seconds
     */
    async setMasterWeight(masterWeight) {
        return new Promise((resolve, reject) => {
            let that = this
            this.setOptions({masterWeight})
                .then(function (result) {
                    that.masterWeight = masterWeight
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * bump sequenge
     * Bump sequence of the given account
     * @param {number} bumpTo - The sequence number from 0-9223372036854775807
     * @param {number} timeout - Timeout in seconds
     */
    async bumpSequence(bumpTo) {
        return new Promise((resolve, reject) => {
            let that = this
            this.setOptions({bumpTo})
                .then(function (result) {
                    that.sequence = bumpTo
                    resolve(result)
                })
                .catch(function (error) {
                    reject('Tx error_' + error)
                })
        })
    }

    /**
     * payment function
     * Account pays receiver an amount of coin.
     * you can specify more than one receiver and use custom asset and custom memo
     * @param {string} opts#destination - The public key of the receiver
     * @param {string} opts#amount - The amount of coins that sender pays to receiver
     * @param {string} opts#assetCode - The assetCode of the asset that you want to trust
     * @param {string} opts#issuer - The amount of coin that you want to trust from this issuer
     * @param {string} opts#memoType - The type of memo of the transaction that you want create (text,id,return)
     * @param {string} opts#memo - The content of memo of the change trust transaction that you want create (text,id,return)
     * @param {Fee} opts#fee - Priority for tx for fee calculation, default min_accepted_fee ->100
     */
    async Pay(opts = {}) {
        return new Promise((resolve, reject) => {
            let destination = opts.destination || 'error'
            let amount = opts.amount || 'error'
            let memoType = opts.memoTypeTrust || 'text'
            let memo = opts.memoTrust || 'default'
            let issuer = opts.issuer || 'native'
            let assetCode = opts.assetCode || 'native'
            let fees = opts.fee || 'undefined'
            let memoFinal, asset;
            memoFinal = memoCreator(memoType, memo)
            if (memoFinal.error) {
                reject(memoFinal.memo)
                return
            }


            if (typeof destination == 'object' && destination.constructor.name == "Account")
                destination = destination.publicKey
            if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
                reject('Invalid destination ' + errorManager('keyPair', -1))
                return
            }
            memoFinal = memoFinal.memo
            let des
            try {
                des = StellarSdk.Keypair.fromSecret(this.privateKey)
            } catch (err) {
                reject(errorManager('keyPair', -1))
                return
            }
            if (issuer == "native" && assetCode == "native")
                asset = new StellarSdk.Asset.native()
            else {
                if (typeof issuer == 'object' && issuer.constructor.name == "Account")
                    issuer = issuer.publicKey

                if (!StellarSdk.StrKey.isValidEd25519PublicKey(issuer)) {
                    reject('Invalid issuer ' + errorManager('keyPair', -1))
                    return
                }
                try {
                    asset = new StellarSdk.Asset(assetCode, issuer)
                } catch (err) {
                    reject(err)
                    return
                }
            }
            if (fees === 'undefined') {
                let fee = new Fee()
                fees = parseInt(fee.min_accepted_fee)
            } else fees = parseInt(fees)
            let fee = fees

            server.loadAccount(des.publicKey())
                .then(function (sourceAccount) {
                    let builder = new StellarSdk.TransactionBuilder(sourceAccount, {fee})
                    if (typeof destination == "string")
                        builder.addOperation(StellarSdk.Operation.payment({
                            destination,
                            asset,
                            amount
                        }))
                    else {
                        for (var w = 0; w < destination.length; w++) {
                            builder.addOperation(StellarSdk.Operation.payment({
                                destination: destination[w],
                                asset,
                                amount
                            }))
                        }
                    }
                    builder.addMemo(memoFinal)
                    let transaction = builder.build()
                    transaction.sign(des)
                    server.submitTransaction(transaction)
                        .then(function (result) {
                            resolve(result)
                        })
                        .catch(function (error) {
                            (typeof error.response.data.extras != 'undefined') ? reject(errorManager('payment', error.response.data.extras.result_codes.operations[0])) : reject(err)
                            return
                        })
                })
                .catch((error) => {
                    console.log(error)
                    reject(errorManager('loadAccount', -1))
                    return
                })
        })
    }

    /**
     * payment function
     * Account pays receiver an amount of coin.
     * you can specify more than one receiver and use custom asset and custom memo
     * @param {string} opts#destination - The public key of the receiver
     * @param {string} opts#amount - The amount of coins that sender pays to receiver
     * @param {string} opts#assetCode - The assetCode of the asset that you want to trust
     * @param {string} opts#issuer - The amount of coin that you want to trust from this issuer
     * @param {string} opts#memoType - The type of memo of the transaction that you want create (text,id,return)
     * @param {string} opts#memo - The content of memo of the change trust transaction that you want create (text,id,return)
     * @param {Fee} opts#fee - Priority for tx for fee calculation, default min_accepted_fee ->100
     */
    async pathPayment(opts = [{}]) {
        return new Promise(async (resolve, reject) => {
            let des
            try {
                des = StellarSdk.Keypair.fromSecret(this.privateKey)
            } catch (err) {
                reject(errorManager('keyPair', -1))
                return
            }
            let sendAsset = []
            let sendMax = []
            let destination = []
            let destAsset = []
            let destAmount = []
            let path = []
            let fees = []

            let fee = new Fee()
            await fee.Load()
            server.loadAccount(this.publicKey)
                .then(function (sourceAccount) {
                    let builder = new StellarSdk.TransactionBuilder(sourceAccount, {fee:fee.highPriority})
                    for (let i = 0; i < opts.length; i++) {
                        sendAsset.push(opts[i].sendAsset || 'error')
                        sendMax.push(opts[i].sendMax || 'error')
                        destination.push(opts[i].destination || 'text')
                        destAsset.push(opts[i].destAsset || 'default')
                        destAmount.push(opts[i].destAmount || 'native')
                        path.push(opts[i].path || 'native')
                        fees.push(opts[i].fee || 'undefined')
                        console.log(destination[i])
                        if (typeof destination[i] == 'object' && destination[i].constructor.name == "Account")
                            destination[i] = destination[i].publicKey
                        if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination[i])) {
                            reject('Invalid destination at ' + i + errorManager('keyPair', -1))
                            return
                        }
                        builder.addOperation(StellarSdk.Operation.pathPayment({
                            sendAsset: sendAsset[i],
                            sendMax: sendMax[i],
                            destination: destination[i],
                            destAsset: destAsset[i],
                            destAmount: destAmount[i],
                            path: path[i]
                        }))
                    }
                    let transaction = builder.build()
                    transaction.sign(des)
                    server.submitTransaction(transaction)
                        .then(function (result) {
                            resolve(result)
                        })
                        .catch(function (error) {
                            (typeof error.response.data.extras != 'undefined') ? reject(errorManager('payment', error.response.data.extras.result_codes.operations[0])) : reject(error)
                            return
                        })
                })
                .catch((error) => {
                    console.log(error)
                    reject(errorManager('loadAccount', -1))
                    return
                })
        })
    }

    async createTestAccount() {
        return new Promise((resolve, reject) => {
            let pair = StellarSdk.Keypair.random()
            let that = this
            let url = 'https://friendbot.stellar.org/?addr=' + pair.publicKey()
            require('request')(url, function (error, res, body) {
                if (!error) {
                    that.privateKey = pair.secret()
                    that.publicKey = pair.publicKey()
                    resolve()
                    return
                } else {
                    if (typeof error.response != 'undefined')
                        reject(errorManager('createAccount', error.response.data.extras.result_codes.operations[0]))
                    else
                        reject(error)
                    return
                }
            });
        })
    }

    /**
     * @author Andrea Borio andrea.borio(at)outlook.com
     *
     * Create new account function
     * privKey, memoTypeCreate, memoCreate are mandatory
     * Add a trustline on the new account overloading this function
     *
     * @param {string} memoTypeCreate - The type of memo the create transaction that you want create (text,id,return)
     * @param {string} memoCreate - The content of memo the create transaction that you want create
     * @param {string} memoTypeTrust - The type of memo the transaction that you want create (text,id,return)
     * @param {string} startingBalance - The strarting balance of created account
     * @param {string} memoTrust - The content of memo the change trust transaction that you want create (text,id,return)
     * @param {string} issuer - The public key of the issuer
     * @param {string} assetCode - The assetCode of the asset that you want to trust
     * @param {string} trustLimit - The amount of coin that you want to trust from this issuer
     */
    async createAccount(opts = {}) {
        return new Promise((resolve, reject) => {
            let memoTypeCreate = opts.memoTypeCreate || 'text'
            let memoCreate = opts.memoCreate || 'default'
            let startingBalance = opts.startingBalance || '1.501'
            let memoTypeTrust = opts.memoTypeTrust || 'text'
            let memoTrust = opts.memoTrust || 'default'
            let issuer = opts.issuer || 'unsetted'
            let assetCode = opts.assetCode || 'unsetted'
            let trustLimit = opts.trustLimit || 'unsetted'
            let timeout = opts.timeout || 15
            let memoFinalCreate = memoCreator(memoTypeCreate, memoCreate)
            if (memoFinalCreate.error) {
                reject(memoFinalCreate.memo)
                return
            }
            if (startingBalance < config.base_reserve) {
                reject(errorManager('createAccount', -3))
                return
            }
            memoFinalCreate = memoFinalCreate.memo
            let des
            try {
                des = StellarSdk.Keypair.fromSecret(this.privateKey)
            } catch (err) {
                reject(errorManager('keyPair', -1))
                return
            }
            let newAccount = StellarSdk.Keypair.random()
            server.loadAccount(des.publicKey())
                .catch(StellarSdk.NotFoundError, function (error) {
                    reject(errorManager('loadAccount', -1) + ' your private key')
                    return
                })
                .then(function (sourceAccount) {
                    let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                        .addOperation(StellarSdk.Operation.createAccount({
                            destination: newAccount.publicKey(),
                            startingBalance: startingBalance
                        }))
                        .addMemo(memoFinalCreate)
                        .build()
                    transaction.sign(des)
                    return server.submitTransaction(transaction)
                })
                .then(function (result) {
                    server.loadAccount(newAccount.publicKey())
                        .catch(StellarSdk.NotFoundError, function (err) {
                            reject(errorManager('createAccount', -5))
                            return
                        })
                        .then(function (sourceAccount) {
                            let Acc = new Account(newAccount.secret())
                            if (assetCode === 'unsetted') {
                                resolve(Acc)
                                return
                            }
                            Acc.changeTrust(issuer, assetCode, trustLimit)
                                .then(function (result) {
                                    resolve(Acc)
                                    return
                                })
                                .catch(function (error) {
                                    (typeof error.response != 'undefined') ? reject(errorManager('changeTrust', err.response.data.extras.result_codes.operations[0])) : reject(error)
                                    return
                                })
                        })
                })
                .catch(function (err) {
                    (typeof err.response != 'undefined') ? reject(errorManager('createAccount', err.response.data.extras.result_codes.operations[0])) : reject(err)
                    return
                })
        })
    }

    /**
     * changeTrust function
     *
     *
     * @param {string} issuer - The public key of the issuer
     * @param {string} assetCode - The assetCode of the asset that you want to trust
     * @param {string} trustLimit - The amount of coin that you want to trust from this issuer
     *
     *
     */

    async changeTrust(issuer, assetCode, trustLimit) {
        return new Promise((resolve, reject) => {
            if (typeof issuer == 'object' && issuer.constructor.name == "Account")
                issuer = issuer.publicKey
            else if (!StellarSdk.StrKey.isValidEd25519PublicKey(issuer)) {
                reject('Invalid issuer ' + errorManager('keyPair', -1))
                return
            }
            let des = StellarSdk.Keypair.fromSecret(this.privateKey)
            server.loadAccount(des.publicKey())
                .catch(StellarSdk.NotFoundError, function (error) {
                    reject(errorManager('loadAccount', -1) + ' your private key')
                    return
                })
                .then(function (sourceAccount) {
                    let asset
                    try {
                        asset = new StellarSdk.Asset(assetCode, issuer)
                    } catch (err) {
                        reject(err)
                        return
                    }
                    let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                        .addOperation(StellarSdk.Operation.changeTrust({
                            asset,
                            limit: trustLimit
                        }))
                        .build();
                    transaction.sign(des);
                    return server.submitTransaction(transaction)
                })
                .then(function (result) {
                    resolve(result)
                })
                .catch(function (err) {
                    if (typeof err.response != 'undefined')
                        reject(errorManager('changeTrust', err.response.data.extras.result_codes.operations[0]))
                    else
                        reject(err)
                    return
                })
        })
    }

    /**
     * mergeAccount function
     * @param {string} destintation - The destination for merge account
     *
     *
     */

    async mergeAccount(destination) {
        return new Promise((resolve, reject) => {
            if (typeof destination == 'object' && destination.constructor.name == "Account")
                destination = destination.publicKey
            else if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination))
                reject('Invalid destination ' + errorManager('keyPair', -1))
            let des = StellarSdk.Keypair.fromSecret(this.privateKey)
            server.loadAccount(des.publicKey())
                .catch(StellarSdk.NotFoundError, function (error) {
                    reject(errorManager('loadAccount', -1) + ' your private key')
                    return
                })
                .then(function (sourceAccount) {
                    let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                        .addOperation(StellarSdk.Operation.accountMerge({
                            destination
                        }))
                        .build();
                    transaction.sign(des);
                    return server.submitTransaction(transaction)
                })
                .then(function (result) {
                    resolve(result)
                })
                .catch(function (error) {
                    if (typeof error.response != 'undefined')
                        reject(errorManager('changeTrust', error.response.data.extras.result_codes.operations[0]))
                    else
                        reject(error)
                    return
                })
        })
    }

    /**
     * manageData function
     *
     *
     * @param {string} name - Name of data <64Bytes || 64 Char in UTF8
     * @param {string} value - Value of data <64 Bytes || 64 Char in UTF8
     *
     *
     */
    async manageData(name, value, timeout = 15) {
        return new Promise((resolve, reject) => {
            let des = StellarSdk.Keypair.fromSecret(this.privateKey)
            server.loadAccount(des.publicKey())
                .catch(StellarSdk.NotFoundError, function (error) {
                    reject(errorManager('loadAccount', -1) + ' your private key')
                    return
                })
                .then(function (sourceAccount) {
                    let transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                        .addOperation(StellarSdk.Operation.manageData({
                            name,
                            value
                        }))
                        .build();
                    transaction.sign(des);
                    return server.submitTransaction(transaction)
                })
                .then(function (result) {
                    resolve(result)
                })
                .catch(function (error) {
                    if (typeof error.response != 'undefined')
                        reject(errorManager('changeTrust', err.response.data.extras.result_codes.operations[0]))
                    else
                        reject(error)
                })
        })
    }

    /**
     * Create Passive Offer function
     *  This is useful for offers just used as 1:1 exchanges for path payments. Use manage offer to manage this offer after using this operation to create it.
     * @param {string} opts#sellingCode {string} -Asset code that you want to sell
     * @param {string} opts#sellingIssuer {string}  - Issuer's publicKey of the Asset that you want to sell
     * @param {string} opts#amount {string} - The amount of coin that you want to sell
     * @param {JSON}   opts#price {json}- Issuer's publicKey of the Asset that you want to sell example : { 'd': 1, 'n': 1 }
     * @param {string} opts#offerId {string} - If 0 create new offer
     * @param {string} opts#buyingCode {string} - Asset code that you want to buy
     * @param {string} opts#buyingIssuer {string} - Issuer's publicKey of the Asset that you want to sell
     * @param {string} opts#source {string} - The source account (defaults to transaction source).
     * @returns {JSON} result
     */
    async createPassiveOffer(opts = {}) {
        return new Promise((resolve, reject) => {
            console.log(opts)
            let sellingCode = opts.sellingCode || 'native'
            let sellingIssuer = opts.sellingIssuer || 'native'
            let amount = opts.amount || '0'
            let price = opts.price || {'d': 1, 'n': 1}
            let offerId = opts.offerId || '0'
            let buyingCode = opts.buyingCode || 'native'
            let buyingIssuer = opts.buyingIssuer || 'native'
            if (typeof sellingIssuer == 'object' && sellingIssuer.constructor.name == "Account")
                sellingIssuer = sellingIssuer.publicKey
            else if (!StellarSdk.StrKey.isValidEd25519PublicKey(sellingIssuer) && sellingIssuer !== 'native') {
                reject('Invalid issuer ' + errorManager('keyPair', -1))
                return
            }
            if (typeof buyingIssuer == 'object' && buyingIssuer.constructor.name == "Account")
                buyingIssuer = buyingIssuer.publicKey
            else if (!StellarSdk.StrKey.isValidEd25519PublicKey(buyingIssuer) && buyingIssuer !== 'native') {
                reject('Invalid destination ' + errorManager('keyPair', -1))
                return
            }
            let buying, selling, des
            try {
                (buyingCode === "native" || buyingIssuer === "native") ? buying = new StellarSdk.Asset.native() : buying = new StellarSdk.Asset(buyingCode, buyingIssuer)
            } catch (error) {
                reject('StellarBurrito_ASSET_ERR Buying \n\r' + error)
            }
            try {
                (sellingCode === "native" || sellingCode === "native") ? selling = new StellarSdk.Asset.native() : selling = new StellarSdk.Asset(sellingCode, sellingIssuer)
            } catch (error) {
                reject('StellarBurrito_ASSET_ERR Selling \n\r' + error)
            }
            try {
                des = StellarSdk.Keypair.fromSecret(this.privateKey)
            } catch (err) {
                reject(errorManager('keyPair', -1))
                return
            }
            server.loadAccount(des.publicKey())
                .then(function (sourceAccount) {
                    let builder = new StellarSdk.TransactionBuilder(sourceAccount)
                        .addOperation(StellarSdk.Operation.createPassiveOffer({
                            selling,
                            buying,
                            amount,
                            price,
                            offerId
                        }))
                        .build()
                    builder.sign(des)
                    server.submitTransaction(builder)
                        .then(function (result) {
                            resolve(result)
                        })
                        .catch(function (error) {
                            (typeof error.response != 'undefined') ? reject(errorManager('manageOffer', error.response.data.extras.result_codes.operations[0])) : reject(error)
                            return
                        })
                })
                .catch((error) => {
                    reject(errorManager('loadAccount', -1))
                })
        })
    }

    /**
     * Manage Offer function
     * @param {string} opts#sellingCode {string} -Asset code that you want to sell
     * @param {string} opts#sellingIssuer {string}  - Issuer's publicKey of the Asset that you want to sell
     * @param {string} opts#amount {string} - The amount of coin that you want to sell
     * @param {JSON} opts#price {json}- Issuer's publicKey of the Asset that you want to sell
     * @param {string} opts#offerId {string} - If 0 create new offer
     * @param {string} opts#buyingCode {string} - Asset code that you want to buy
     * @param {string} opts#buyingIssuer {string} - Issuer's publicKey of the Asset that you want to sell
     * @param {string} opts#source {string} - The source account (defaults to transaction source).
     * @returns {JSON} result
     */
    async manageOffer(opts = {}) {
        return new Promise((resolve, reject) => {
            let sellingCode = opts.sellingCode || 'native'
            let sellingIssuer = opts.sellingIssuer || 'native'
            let amount = opts.amount || '0'
            let price = opts.price || {'d': 1, 'n': 1}
            let offerId = opts.offerId || '0'
            let buyingCode = opts.buyingCode || 'native'
            let buyingIssuer = opts.buyingIssuer || 'native'
            if (typeof sellingIssuer == 'object' && sellingIssuer.constructor.name == "Account")
                sellingIssuer = sellingIssuer.publicKey
            else if (!StellarSdk.StrKey.isValidEd25519PublicKey(sellingIssuer) && sellingIssuer !== 'native') {
                reject('Invalid issuer ' + sellingIssuer + ' ' + errorManager('keyPair', -1))
                return
            }
            if (typeof buyingIssuer == 'object' && buyingIssuer.constructor.name == "Account")
                buyingIssuer = buyingIssuer.publicKey
            else if (!StellarSdk.StrKey.isValidEd25519PublicKey(buyingIssuer) && buyingIssuer !== 'native') {
                reject('Invalid destination ' + errorManager('keyPair', -1))
                return
            }
            let buying, selling, des
            try {
                (buyingCode === "native" || buyingIssuer === "native") ? buying = new StellarSdk.Asset.native() : buying = new StellarSdk.Asset(buyingCode, buyingIssuer)
            } catch (error) {
                reject('StellarBurrito_ASSET_ERR Buying \n\r' + error)
            }
            try {
                (sellingCode == "native" || sellingCode == "native") ? selling = new StellarSdk.Asset.native() : selling = new StellarSdk.Asset(sellingCode, sellingIssuer)
            } catch (error) {
                reject('StellarBurrito_ASSET_ERR Selling \n\r' + error)
            }
            try {
                des = StellarSdk.Keypair.fromSecret(this.privateKey)
            } catch (err) {
                reject(errorManager('keyPair', -1))
                return
            }
            server.loadAccount(des.publicKey())
                .then(function (sourceAccount) {
                    let builder = new StellarSdk.TransactionBuilder(sourceAccount)
                        .addOperation(StellarSdk.Operation.manageOffer({
                            selling,
                            buying,
                            amount,
                            price,
                            offerId
                        }))
                        .build()
                    builder.sign(des)
                    server.submitTransaction(builder)
                        .then(function (result) {
                            resolve(result)
                        })
                        .catch(function (error) {
                            (typeof error.response != 'undefined') ? reject(errorManager('manageOffer', error.response.data.extras.result_codes.operations[0])) : reject(error)
                            return
                        })
                })
                .catch((error) => {
                    reject(errorManager('loadAccount', -1))
                })
        })
    }

    async loadOffers(limit = 10) {
        return new Promise((resolve, reject) => {
            let that = this
            server.offers('accounts', this.publicKey)
                .limit(limit)
                .call()
                .then(page => {
                    that.offers = page.records
                    resolve()
                })
                .catch(function (error) {
                    reject(error)
                    return
                })

        })
    }

    async loadOperations(limit = 10) {
        return new Promise((resolve, reject) => {
            this.operations = []
            let that = this
            server.operations('accounts', this.publicKey)
                .limit(limit)
                .call()
                .then(page => {
                    that.operations = page.records
                    resolve()
                })
                .catch(function (error) {
                    reject(error)
                    return
                })

        })
    }
}

module.exports = Account