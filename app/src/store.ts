import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import wrtc from '@koush/wrtc'
import { mplex } from '@libp2p/mplex'
import { webRTCStar } from '@libp2p/webrtc-star'
import type { TDBinding, TDShape } from '@tldraw/tldraw'
import { createLibp2p } from 'libp2p'
import { WebrtcProvider } from 'y-webrtc'
import * as Y from 'yjs'

const VERSION = 'doandidinding'

// Create the doc
export const doc = new Y.Doc()

export const roomID = `y-tldraw-${VERSION}`

async function main() {
	const star = webRTCStar({ wrtc })

	const node = await createLibp2p({
		pubsub: gossipsub({ allowPublishToZeroPeers: true }),
		transports: [star.transport],
		streamMuxers: [mplex()],
		connectionEncryption: [noise()],
		peerDiscovery: [star.discovery]
	})
	await node.start
}

// eslint-disable-next-line unicorn/prefer-top-level-await
main().catch((_) => {
	console.log('ERROR gan')
})

// export const provider = new Provider(doc, node, 'Zeta')

// Create a websocket provider
export const provider = new WebrtcProvider(roomID, doc)

// We persist the document content across sessions
// export const indexeddbProvider = new IndexeddbPersistence('y-indexeddb', doc)

// Export the provider's awareness API
export const awareness = provider.awareness

export const yShapes: Y.Map<TDShape> = doc.getMap('shapes')
export const yBindings: Y.Map<TDBinding> = doc.getMap('bindings')

// Create an undo manager for the shapes and binding maps
export const undoManager = new Y.UndoManager([yShapes, yBindings])
