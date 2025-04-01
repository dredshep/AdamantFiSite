# LP Staking Incentives Documentation

## Contract Message Structure

### Staking LP Tokens

To stake LP tokens, send a snip20 send message with `{"deposit":{}}` as the attached message to the lp-staking contract.

### Unstaking LP Tokens

To unstake LP tokens, send a direct message to the lp-staking contract:

```json
{
  "redeem": {
    "amount": "amount_as_string"
  }
}
```

## Contract Addresses and Code Hashes

### Mainnet

| Contract Type    | Code ID | Code Hash                                                        | Address                                       |
| ---------------- | ------- | ---------------------------------------------------------------- | --------------------------------------------- |
| factory          | 13563   | 16ea6dca596d2e5e6eef41df6dc26a1368adaa238aa93f07959841e7968c51bd | secret1j7k7ev47rrwnzy4d2j7auu0fxww7ghtxzr686a |
| pair             | 13564   | 0dfd06c7c3c482c14d36ba9826b83d164003f2b0bb302f222db72361e0927490 | _get from factory_                            |
| token            | 13565   | 744c588ed4181b13a49a7c75a49f10b84b22b24a69b1e5f3cdff34b2c343e888 | secret1n34sgcepgdxmt8mcfgu8076uzjdrh5au6vqnzg |
| lp_staking       | 13567   | c644edd309de7fd865b4fbe22054bcbe85a6c0b8abf5f110053fe1b2d0e8a72a | secret1yauz94h0ck2lh02u96yum67cswjdapes7y62k8 |
| bulk_distributor | 13568   | 89083455710f42520356d0fbaa2d3a6f8e1362e1b67040cd59d365d02378fad5 | secret1tpt0nzsru5s9gyzz8gvtcer229vw788z7jsg29 |

### Testnet Tokens

| Address                                       | Code Hash                                                        |
| --------------------------------------------- | ---------------------------------------------------------------- |
| secret13y8e73vfl40auct785zdmyygwesvxmutm7fjx4 | af74387e276be8874f07bec3a87023ee49b0e7ebe08178c49d0a49c3c98ed60e |
| secret1yhxy7ne975jjp6y6vq6p7kus2pnwclpq0mshc9 | 9a00ca4ad505e9be7e6e6dddf8d939b7ec7e9ac8e109c8681f10db9cacb36d42 |
| secret1jzefe65dxw5ypnj6sfwmr8wv3fg56l47veq74h | 9a00ca4ad505e9be7e6e6dddf8d939b7ec7e9ac8e109c8681f10db9cacb36d42 |

## Implementation Notes

### Network Configuration

- Use environment variables to switch between testnet and mainnet configurations
- Comment out the appropriate section in the code based on the target network
- Avoid complex network switching components for now to keep implementation simple

### Contract Interaction

- All contract interactions should be implemented in the `utils/secretjs/incentives/` directory
- Follow the existing patterns from other contract interaction files
- Ensure proper error handling and transaction monitoring
