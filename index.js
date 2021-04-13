var express = require('express');
var Btc =  require('bitcoinjs-lib');
var buffer  = require('buffer');
const axios = require('axios');
const fetch = require('node-fetch');
const TestNet = Btc.networks.testnet;
const apiUrl = 'https://api.blockcypher.com/v1/';
const app = express();

const FLIP_BTC_ADDRESS = 'mmMr7uPKQx9ZLFKBw9vLg3JiMYrP2pDFtC';
const FLIP_BTC_PUBKEY = '030d33c7efe344c217fa294f3eccbb1e49e72ff1386ac15e8e2810c8dce4cd3fb2';
const FLIP_BTC_PRIVKEY = 'cPWN37f73LWVfZbRcy4wnRkxeUE8A6UVHymuAEqZxmg3rVSEcRib';

app.get('/createAccount',function(req,res){
    let keyPair = Btc.ECPair.makeRandom({network: TestNet});
    let privateKey = keyPair.toWIF();
    let publickey = keyPair.publicKey.toString('hex');
    let { address } = Btc.payments.p2pkh({pubkey: keyPair.publicKey, network: TestNet});
    res.send('Addresss : ' + address + ' PublicKey : ' + publickey + ' PrivateKey : ' + privateKey);
});

app.get('/getBalance',async function(req,res){
    let address = req.query.address;
    await axios.get(apiUrl + 'btc/test3/addrs/' + address)
        .then((data)=>{
            res.send('Balance : ' + data.data.balance);
        })
        .catch((err)=>{
            res.send(err);
        });
});

app.get('/sendBTC',async function(req,res){
    let sendPrivKey = req.query.sendPrivKey;
    let targetAddress = req.query.targetAddress;
    let sendAddress = req.query.sendAddress;
    let amount = req.query.amount;
    /*console.log('SendAdd : ' + sendAddress);
    console.log('SendPriv : ' + sendPrivKey);
    console.log('targetAdd : ' + targetAddress);
    console.log('amount : ' + amount);*/
    let keys = new Btc.ECPair.fromWIF(sendPrivKey, TestNet);
    var newtx = {
        inputs: [{addresses : [sendAddress]}],
        outputs: [{addresses : [targetAddress], value: Number(amount)}]
    };
    /*console.log('Keys: ' + JSON.stringify(keys));
    console.log('newtx : ' + JSON.stringify(newtx));*/
    (async () => {
        const rawResponse = await fetch(apiUrl + 'btc/test3/txs/new', {
            method: 'POST',
            headers: {
            },
            body: JSON.stringify(newtx)
        });
        const tmptx = await rawResponse.json();
        tmptx.pubkeys = [];
        tmptx.signatures = tmptx.tosign.map(function(tosign){
            tmptx.pubkeys.push(keys.getPublicKeyBuffer().toString("hex"));
            return keys.sign(new buffer.Buffer(tosign, "hex")).toDER().toString("hex");
        });
        axios.post(apiUrl + 'btc/test3/txs/send',tmptx)
            .then(function(finaltx) {
                console.log(finaltx.data.tx);
            });
    })();
});

app.listen(3000, 'localhost', function(){
    console.log('listening localhost:3000');
});
