# Always Developer Mode

A [Revenge](https://github.com/revenge-mod) plugin that keeps Discord's **Developer Mode**
(Settings → Advanced) forced on.

Some custom themes have a bug where applying them turns Developer Mode off. This plugin makes sure
it stays on.

## Features

- Forces `developerMode: true` on every `USER_SETTINGS_PROTO_UPDATE` / `USER_SETTINGS_UPDATE`
  payload, so theme applies, server syncs and manual toggles cannot persist it as off.
- Turns Developer Mode on at startup if it is off.
- Removes the interceptor when the plugin is disabled.

## Install

1. Open **Revenge → Settings → Plugins → Install a plugin**.
2. Paste this source URL:

   ```
   https://raw.githubusercontent.com/OldManJenkins12/revenge-always-developer-mode/main/plugin/
   ```

3. Install and enable the plugin.

To verify it is working, open Settings → Advanced and check that Developer Mode is on, or
long-press a message and check that **Copy ID** is available.

## How it works

Discord stores Developer Mode as `developerMode` inside the `appearance` message of
`PreloadedUserSettings`, and exposes it through the `UserSettings.DeveloperMode` setting.
Appearance changes are dispatched as `USER_SETTINGS_PROTO_UPDATE` Flux events.

The plugin:

1. Registers a Flux interceptor that rewrites `developerMode` to `true` in every appearance update
   before Discord handles it. This is also what runs whenever a theme is applied.
2. Calls `UserSettings.DeveloperMode.updateSetting(true)` when it loads.
3. Falls back to rebuilding the appearance proto with `PreloadedUserSettingsActionCreators` and
   dispatching a local proto update if the setting module cannot be found.

It logs its progress with the `[AlwaysDeveloperMode]` prefix.

## Layout

```
plugin/
├── manifest.json   polymanifest (name, authors, main, hash, vendetta icon)
└── index.js        the plugin bundle, a single IIFE expression
scripts/
└── update-manifest.ts   recomputes the sha256 hash in manifest.json from index.js
```

`index.js` must start with `(` with no leading whitespace: Revenge evaluates plugins as
`vendetta => { return <index.js> }`, and a leading newline would trigger automatic semicolon
insertion and break the `return`.

## Development

After changing `plugin/index.js`, refresh the manifest hash (Revenge uses it to detect updates):

```sh
bun run hash
```

To serve the plugin locally for testing:

```sh
bun run serve        # python3 -m http.server 8080 --directory plugin
```

and use `http://<your-computer-ip>:8080/` as the source URL. Revenge appends `manifest.json` and
`index.js` to whatever source URL you give it.

A source URL can point at any static host as long as `manifest.json` and `index.js` are reachable
under the same URL prefix.

## Disclaimer

This is an unofficial community plugin. It is not affiliated with Discord or the Revenge project.
Modifying your Discord client may violate Discord's Terms of Service; use at your own risk.

## License

GPL-3.0. See [LICENSE](LICENSE).
