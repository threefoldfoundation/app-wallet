# Rivine wallet

## Development

Run `npm start -- --configuration_file "/path/to/config_file.json"`

## Production build

Run `npm run build:zip`. A `wallet.zip` file will be generated in this folder.

## Other tools

- Sort translations: `npm run sort_translations`


## Testing

To test it, either upload it as a branding on your rogerthat server or add this to index.html above main.js to test it in the browser:

```html
<script>
  if (typeof rogerthat === 'undefined') {
    function nothing() {
    }

    rogerthat = {
      context: func => func({context: null}),
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
        getAddress: success => success({address: '015df22a2e82a3323bc6ffbd1730450ed844feca711c8fe0c15e218c171962fd17b206263220ee'})
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
cd tfchain
caddy -conf caddy/Caddyfile.local
```

if prompted for a password enter `test123`
