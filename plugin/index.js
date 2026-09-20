(() => {
	const { metro } = vendetta
	const FluxDispatcher = metro.common && metro.common.FluxDispatcher

	const LOG_PREFIX = '[AlwaysDeveloperMode]'
	const PROTO_UPDATE_TYPE = 'USER_SETTINGS_PROTO_UPDATE'
	const SETTINGS_UPDATE_TYPE = 'USER_SETTINGS_UPDATE'

	let fluxInterceptor

	function forceAppearance(appearance) {
		if (!appearance || typeof appearance !== 'object') return false
		if (appearance.developerMode === true) return false
		appearance.developerMode = true
		return true
	}

	function forcePayloadDeveloperMode(payload) {
		if (!payload || (payload.type !== PROTO_UPDATE_TYPE && payload.type !== SETTINGS_UPDATE_TYPE)) {
			return false
		}

		const settings = payload.settings
		if (!settings) return false

		const viaProto = forceAppearance(settings.proto && settings.proto.appearance)
		const viaSettings = forceAppearance(settings.appearance)
		return viaProto || viaSettings
	}

	function getStoredDeveloperMode() {
		try {
			const store = metro.findByStoreName('UserSettingsProtoStore')
			return store && store.settings && store.settings.appearance
				? store.settings.appearance.developerMode
				: undefined
		} catch {
			return undefined
		}
	}

	function findSetting(name) {
		try {
			for (const exports of metro.findByPropsAll(name)) {
				const value = exports && exports[name]
				if (
					value &&
					typeof value.getSetting === 'function' &&
					typeof value.updateSetting === 'function'
				) {
					return value
				}
			}
		} catch {}
		return undefined
	}

	function findActionCreators() {
		try {
			for (const exports of metro.findByPropsAll('PreloadedUserSettingsActionCreators')) {
				const creators = exports && exports.PreloadedUserSettingsActionCreators
				if (creators && creators.ProtoClass) return creators
			}
		} catch {}
		return undefined
	}

	function protoMessageType(protoClass, localName) {
		const fields = protoClass && protoClass.fields
		const field = fields && fields.find(f => f.localName === localName)
		if (!field) return undefined

		const getter = Object.values(field).find(value => typeof value === 'function')
		return getter && getter()
	}

	function enableViaActionCreators(creators) {
		const appearanceType = protoMessageType(creators.ProtoClass, 'appearance')
		if (!appearanceType) return false

		const current = creators.getCurrentValue && creators.getCurrentValue()
		const currentAppearance = current && current.appearance
		const appearance = currentAppearance
			? appearanceType.create({ ...currentAppearance, developerMode: true })
			: appearanceType.create({ developerMode: true })

		if (appearance.developerMode !== true) appearance.developerMode = true

		const proto = creators.ProtoClass.create()
		proto.appearance = appearance

		FluxDispatcher.dispatch({
			type: PROTO_UPDATE_TYPE,
			local: true,
			partial: true,
			settings: { type: 1, proto },
		})

		return true
	}

	function onLoad() {
		try {
			const developerMode = findSetting('DeveloperMode')
			const creators = developerMode ? undefined : findActionCreators()

			console.log(
				`${LOG_PREFIX} Loading (setting: ${Boolean(developerMode)}, action creators: ${Boolean(creators)})`,
			)

			const forceNow = () => {
				try {
					if (developerMode) {
						developerMode.updateSetting(true)
						return true
					}

					if (creators) return enableViaActionCreators(creators)

					return false
				} catch (error) {
					console.warn(`${LOG_PREFIX} Failed to enable Developer Mode.`, error)
					return false
				}
			}

			if (!forceNow()) {
				console.warn(
					`${LOG_PREFIX} Could not find Discord's Developer Mode setting. Nothing was forced.`,
				)
				return
			}

			if (FluxDispatcher) {
				try {
					if (!Array.isArray(FluxDispatcher._interceptors)) FluxDispatcher._interceptors = []

					fluxInterceptor = payload => {
						try {
							forcePayloadDeveloperMode(payload)
						} catch (error) {
							console.warn(`${LOG_PREFIX} Failed to force Developer Mode in a flux payload.`, error)
						}
					}

					FluxDispatcher._interceptors.unshift(fluxInterceptor)
					console.log(`${LOG_PREFIX} Flux interceptor registered.`)
				} catch (error) {
					console.warn(`${LOG_PREFIX} Could not register the flux interceptor.`, error)
				}
			} else {
				console.warn(`${LOG_PREFIX} Flux dispatcher unavailable; skipping the interceptor.`)
			}

			console.log(`${LOG_PREFIX} Stored developer mode value: ${getStoredDeveloperMode()}`)
			console.log(`${LOG_PREFIX} Developer Mode is now forced on.`)
		} catch (error) {
			console.error(`${LOG_PREFIX} Failed to load.`, (error && (error.stack || error.message)) || error)
			throw error
		}
	}

	function onUnload() {
		try {
			if (fluxInterceptor && FluxDispatcher && Array.isArray(FluxDispatcher._interceptors)) {
				FluxDispatcher._interceptors = FluxDispatcher._interceptors.filter(
					interceptor => interceptor !== fluxInterceptor,
				)
			}
		} catch (error) {
			console.warn(`${LOG_PREFIX} Cleanup failed.`, error)
		}

		console.log(`${LOG_PREFIX} Stopped. Developer Mode is no longer forced.`)
	}

	return { onLoad, onUnload }
})()
