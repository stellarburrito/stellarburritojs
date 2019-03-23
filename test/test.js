const Account = require('../account')
const ledgers = require('../ledger')
const chai = require('chai')
    .use(require('chai-as-promised'))
const expect = chai.expect;
let Asset = require('../asset')
let config = require('../config')
let aliceAccount = new Account()
bobAccount = new Account()
carlAccount = new Account()
donaldAccount = new Account()
let privKeyCreate = new Account()
let testaccount = new Account(config.testaccount)
function random() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 12; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
step('Create new test account', () => {
    describe('Create new test account', function () {
        it('Account.createTestAccount', (done) => {
            aliceAccount.createTestAccount().then((result) => {
                bobAccount.createTestAccount().then((result) => {
                    carlAccount.createTestAccount()
                    .then((result) => {
                        donaldAccount.createTestAccount()
                            .then((result) => {
                                testaccount.createTestAccount()
                                    .then((result) => {
                                        expect(1).to.equal(1);
                                        done();
                                    })
                            })
                    })
                })
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(50000)
    })
})
step('Create new account', () => {
    describe('Create new account', function () {
        it('Account.createAccount', (done) => {
            let resolvingPromise = testaccount.createAccount()
            resolvingPromise.then((result) => {
                privKeyCreate = new Account(result.privateKey)
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})

step('Trust new asset', () => {
    describe('Change Trust', function () {
        it('Account.changeTrust', (done) => {
            const resolvingPromise = aliceAccount.changeTrust('GDDOYLS5X52UTIUKVX2CDLEI4OF5YIBB4SE4MDPWRTGS7W23ZZLVKWTJ', 'qY3g1IyY7qUW', '100000000')
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Manage Data', () => {
    describe('Manage data', function () {
        it('Account.manageData', (done) => {
            aliceAccount.manageData('stellar', 'burrito')
                .then((result) => {
                    expect(1).to.equal(1);
                    done()
                })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(25000)
    })
})
step('Merge account', () => {
    describe('StellarBurrito test', function () {
        it('Account.mergeAccount', (done) => {
            const resolvingPromise = privKeyCreate.mergeAccount(aliceAccount)
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
aliceAccount.createPassiveOffer()
step('Create new asset', () => {
    describe('Create New Asset', function () {
        it('assetOperations.createAsset', (done) => {
            asset = random()
            let newAsset = new Asset()
            const resolvingPromise = newAsset.createAsset({ issuer: carlAccount, distributor: donaldAccount, amount: '100000', assetCode: asset })
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Pay from alice to bob', () => {
    it('paymentOperations.Pay', (done) => {
        describe('StellarBurrito test', function () {
            const resolvingPromise = carlAccount.Pay({ destination: donaldAccount, amount: '0.000001' })
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get payments history', () => {
    it('history.paymentHistory', (done) => {
        describe('StellarBurrito test', function () {
            const resolvingPromise = aliceAccount.loadPayments()
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get transactions history', () => {
    describe('StellarBurrito test', function () {
        it('history.paymentHistory', (done) => {
            const resolvingPromise = aliceAccount.loadTransactions()
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get trades history', () => {
    describe('StellarBurrito test', function () {
        it('history.paymentHistory', (done) => {
            const resolvingPromise = aliceAccount.loadTrades()
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get offers', () => {
    describe('StellarBurrito test', function () {
        it('history.paymentHistory', (done) => {
            const resolvingPromise = aliceAccount.loadOffers()
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get ledger', () => {
    it('ledger.getLedgers', (done) => {
        describe('StellarBurrito test', function () {
            const resolvingPromise = ledgers.getLedgers(1, 'asc')
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Create Passive Offer', () => {
    describe('StellarBurrito test', function () {
        it('offerOperations.createPassiveOffer', (done) => {
            const resolvingPromise = donaldAccount.createPassiveOffer({ sellingCode: asset, sellingIssuer: carlAccount, amount: '4', price: { 'd': 1, 'n': 1 } })
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Manage Offer', () => {
    describe('StellarBurrito test', function () {
        it('offerOperations.createPassiveOffer', (done) => {
            const resolvingPromise = donaldAccount.manageOffer({ sellingCode: asset, sellingIssuer: carlAccount, amount: '4', price: { 'd': 1, 'n': 1 } })
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get Account', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getAccount', (done) => {
            aliceAccount.Load().then((result) => {
                console.log(aliceAccount)
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get Balances', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getBalances', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.balances)
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get Data', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getData', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.data)
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get Flags', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getFlags', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.flags)
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Get Home Domain', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getHomeDomain', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.home_domain)
                expect(1).to.equal(1);
                done();
            }).catch((error) => {
                console.log(error)
                expect(1).to.equal(4)
                done()
            })
        }).timeout(30000)
    })
})
step('Get Inflation Destination', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getInflationDestination', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.inflation_destination)
                expect(1).to.equal(1);
                done();
            }).catch((error) => {
                console.log(error)
                expect(1).to.equal(4)
                done()
            })
        }).timeout(30000)
    })
})
step('Get Signers ', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getSigners', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.signers)
                expect(1).to.equal(1);
                done();
            }).catch((error) => {
                console.log(error)
                expect(1).to.equal(4)
                done()
            })
        }).timeout(30000)
    })
})
step('Get Thresholds ', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getThresholds', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.thresholds)
                expect(1).to.equal(1);
                done();
            }).catch((error) => {
                console.log(error)
                expect(1).to.equal(4)
                done()
            })
        }).timeout(30000)
    })
})
step('Get Trustlines ', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getTrustlines', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.trustlines)
                expect(1).to.equal(1);
                done();
            }).catch((error) => {
                console.log(error)
                expect(1).to.equal(4)
                done()
            })
        }).timeout(30000)
    })
})
step('Get SequenceNumber ', () => {
    describe('StellarBurrito test', function () {
        it('accountStatus.getSequenceNumber', (done) => {
            const resolvingPromise = aliceAccount.Load()
            resolvingPromise.then((result) => {
                console.log(aliceAccount.sequence)
                expect(1).to.equal(1);
                done();
            }).catch((error) => {
                console.log(error)
                expect(1).to.equal(4)
                done()
            })
        }).timeout(30000)
    })
})
step('Set Flag ', () => {
    describe('StellarBurrito test', function () {
        it('accountOptions.setFlag', (done) => {
            const resolvingPromise = carlAccount.setFlag('1')
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            }).catch((error) => {
                console.log(error)
                expect(1).to.equal(4)
                done()
            })
        }).timeout(30000)
    })
})
step('Clear Flag ', () => {
    describe('StellarBurrito test', function () {
        it('accountOptions.clearFlags', (done) => {
            const resolvingPromise = carlAccount.clearFlag('2')
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Set HomeDomain ', () => {
    describe('StellarBurrito test', function () {
        it('accountOptions.setHomeDomain', (done) => {
            const resolvingPromise = aliceAccount.setHomeDomain('StellarBurrito')
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Set InflationDestination ', () => {
    describe('StellarBurrito test', function () {
        it('accountOptions.setInflationDestination', (done) => {
            const resolvingPromise = aliceAccount.setInlationDestination(bobAccount)
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
        }).timeout(30000)
    })
})
step('Set Master Weight ', () => {
    describe('StellarBurrito test', function () {
        it('accountOptions.setMasterWeight', (done) => {
            const resolvingPromise = aliceAccount.setMasterWeight(240)
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Set Low Threshold ', () => {
    describe('StellarBurrito test', function () {
        it('accountOptions.setLowThreshold', (done) => {
            const resolvingPromise = aliceAccount.setLowThreshold(50)
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Set Medium Threshold ', () => {
    describe('StellarBurrito test', function () {
        it('accountOptions.setMediumThreshold', (done) => {
            const resolvingPromise = aliceAccount.setMediumThreshold(50)
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            })
                .catch((error) => {
                    console.log(error)
                    expect(1).to.equal(4)
                    done()
                })
        }).timeout(30000)
    })
})
step('Set High Threshold ', () => {
    describe('StellarBurrito test', function () {
        it('accountOptions.setHighThreshold', (done) => {
            const resolvingPromise = aliceAccount.setHighThreshold(50)
            resolvingPromise.then((result) => {
                expect(1).to.equal(1);
                done();
            }).catch((error) => {
                console.log(error)
                expect(1).to.equal(4)
                done()
            })
        }).timeout(30000)
    })
})

