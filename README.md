# WalletConnect session issue - messing up with session when using ethers

to start project

1. Setup Wallet Connect projekt ID inside App.tsx - you can get it from https://cloud.walletconnect.com/sign-in
2. Run commands:

```
yarn
yarn dev --host
```

You should see something like:

```

  VITE v4.4.8  ready in 543 ms

  ➜  Local:   http://localhost:5174/
  ➜  Network: http://192.168.3.19:5174/
  ➜  Network: http://169.254.101.12:5174/
  ➜  press h to show help


```

then open for example `http://192.168.3.19:5174/` on your phone

## Steps to reproduce:

0. Use mobile device and open app
1. Connect MetaMask or Trust
2. Make sure that is listed on a session list
3. Try to send usdc - see that it open MetaMask and propt transaction
4. Connect any another wallet (for example Rainbow)
5. Try to send USDC transaction again from first connected wallet (MetaMask/Trust)
6. You will see that it opens last connected wallet rather then original wallet
