# StellarBurrito
StellarBurrito is an opensource wrapper for js stellar-sdk 
![Mymage](https://i.ibb.co/dDRV0Rm/logo.png)  


### Getting Started
##### Create a testnet account  
This will create a new account on **testnet** with 10 000 XLM
```javascript
let Account=require('stellarburrito').Account
let Alice= new Account()
await Alice.createTestAccount()
 ```
 ##### Pay
Let's pay 10 XLM From Alice to Bob
 ```javascript
 let Account=require('stellarburrito').Account
 let Alice= new Account('SDIMQ463MVOETWAOBXLSUSSZNKMA7GOCZBS4QKVYJJC53IPUAOW2QRTR')
 let Bob = new Account('GBQWXG6TVJ52GGW77WM6ZJKZKWG5O5Q6T4KKTMPXTW6NNH66J4ZOBNYJ')
 await Alice.Pay({destination:Bob,amount:'10'})
  ```