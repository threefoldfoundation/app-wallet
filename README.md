# Rivine wallet

## Development

Run `npm start -- --configuration_file "/path/to/config_file.json"`

## Production build

Run `npm run build:zip`. A `wallet.zip` file will be generated in this folder.

## Other tools

- Sort translations: `npm run sort_translations`


## Testing

To test it, either upload it as an embedded app on your rogerthat server or add this to index.html above main.js to test it in the browser:

```html
<script>
  if (typeof rogerthat === 'undefined') {
    function nothing() {
    }

    var context = {
      type: 'payment-request',
      data: {
        context: JSON.stringify({
          type: 'payment-request',
          data: {
            to: 'adfsafdafa',
            amount: 900000000000,
            precision: 9,
            currency: 'TFT',
            test_mode: true,
            memo: 'this is a fancy memo',
          }
        }),
        result: JSON.stringify({
          transactionid: '1b9ec247fd02890dff5e456cb13332935c507678757d7bc7396c027b824b2398'
        })
      }
    };

    rogerthat = {
      context: func => func({context}),
      api: {
        call: nothing,
        callbacks: {
          resultReceived: nothing,
        }
      },
      callbacks: {
        ready: function (callback) {
          this._ready = callback;
        },
        serviceDataUpdated: nothing,
        userDataUpdated: nothing,
        qrCodeScanned: nothing,
      },
      user: {
        language: 'en',
        data: {},
      },
      system: {
        appId: 'example-app-id',
        appVersion: '2.1.9999'
      },
      service: {
        data: {}
      },
      security: {
        getAddress: success => success({address: '0198c17d14518655266986a55c6756dc3e79c0e7f49373f23ebaae7db9e67532ccea7043ebd9fb'}),
        listKeyPairs: success => success({
          keyPairs: [{
            algorithm: 'ed25519',
            name: 'ThreeFold',
            arbitrary_data: '{"provider_id":"threefold"}'
          }]
        })
      },
      menuItem: null,
      util: {
        uuid: () => {
          return Math.random().toString();
        }
      }
    };
    sha256 = nothing;
    setTimeout(() => rogerthat.callbacks._ready(), 250);
  }
</script>
```


In case the testnet explorer doesn't work, start your own with these commands:

Start the chain
``` bash
go get -u github.com/threefoldfoundation/tfchain/cmd/...
tfchaind --network testnet -M gctwbe --agent ""
```

Proxy to allow non-localhost addresses

```bash
git clone https://github.com/threefoldfoundation/tfchain
cd tfchain/frontend/explorer/caddy
caddy -conf Caddyfile.local
```

if prompted for a password enter `test123`
