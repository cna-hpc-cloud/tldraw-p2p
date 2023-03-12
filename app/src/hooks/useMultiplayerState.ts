import type { TDBinding, TDShape, TDUser, TldrawApp } from '@tldraw/tldraw'
import { Room } from '@y-presence/client'
import { useCallback, useEffect, useState } from 'react'
import { awareness, doc, undoManager, yBindings, yShapes } from '../store'
import type { TldrawPresence } from '../types'

const room = new Room(awareness, {} as TldrawPresence)

export function useMultiplayerState(roomId: string) {
	const [app, setApp] = useState<TldrawApp>()
	const [loading, setLoading] = useState(true)

	/**
	 * Store TldrawApp in our state.
	 * Pause default undo/redo and use our implementation instead
	 * (onUndo and onRedo)
	 */
	const onMount = useCallback(
		(app: TldrawApp) => {
			app.loadRoom(roomId)
			app.pause()
			setApp(app)
		},
		[roomId]
	)

	/**
	 * Update Yjs CRDT docs when there is local app state changes.
	 * Provider will automatically propagate to other peers
	 */
	const onChangePage = useCallback(
		(
			_: TldrawApp,
			shapes: Record<string, TDShape | undefined>,
			bindings: Record<string, TDBinding | undefined>
		) => {
			undoManager.stopCapturing()
			doc.transact(() => {
				for (const [id, shape] of Object.entries(shapes)) {
					if (shape) {
						yShapes.set(shape.id, shape)
					} else {
						yShapes.delete(id)
					}
				}
				for (const [id, binding] of Object.entries(bindings)) {
					if (binding) {
						yBindings.set(binding.id, binding)
					} else {
						yBindings.delete(id)
					}
				}
			})
		},
		[]
	)

	/**
	 * Custom undo implementation
	 */
	const onUndo = useCallback(() => {
		undoManager.undo()
	}, [])

	/**
	 * Custom redo implementation
	 */
	const onRedo = useCallback(() => {
		undoManager.redo()
	}, [])

	/**
	 * Callback to update user's (self) presence
	 */
	const onChangePresence = useCallback((app: TldrawApp, user: TDUser) => {
		if (!app.room) return
		room.setPresence({ id: app.room.userId, tdUser: user })
	}, [])

	/**
	 * Update app users whenever there is a change in the room users
	 */
	useEffect(() => {
		if (!app || !room) return

		const unsubOthers = room.subscribe('others', (users) => {
			if (!app.room) return

			const ids = new Set(
				users.filter((user) => user.presence).map((user) => user.presence?.tdUser.id)
			)

			for (const user of Object.values(app.room.users)) {
				if (user && !ids.has(user.id) && user.id !== app.room?.userId) {
					app.removeUser(user.id)
				}
			}

			app.updateUsers(
				users
					.filter((user) => user.presence)
					.map((other) => other.presence?.tdUser)
					.filter(Boolean)
			)
		})

		return () => {
			unsubOthers()
		}
	}, [app])

	/**
	 * Update app state whenever there is a change in Yjs CRDT docs
	 * (both local and remote changes)
	 */
	useEffect(() => {
		if (!app) return

		function handleDisconnect() {
			console.log('disconnecting')
			// provider.disconnect()
		}

		window.addEventListener('beforeunload', handleDisconnect)

		function handleChanges() {
			app?.replacePageContent(
				Object.fromEntries(yShapes.entries()),
				Object.fromEntries(yBindings.entries()),
				{}
			)
		}

		async function setup() {
			yShapes.observe(handleChanges)
			yBindings.observe(handleChanges)
			handleChanges()
			setLoading(false)
		}

		setup()

		return () => {
			window.removeEventListener('beforeunload', handleDisconnect)
			yShapes.unobserve(handleChanges)
			yBindings.unobserve(handleChanges)
		}
	}, [app])

	return {
		onMount,
		onChangePage,
		onUndo,
		onRedo,
		loading,
		onChangePresence
	}
}
