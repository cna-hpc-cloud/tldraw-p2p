import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { peerIdFromString } from '@libp2p/peer-id'
import { webRTCDirect } from '@libp2p/webrtc-direct'
import { createLibp2p } from 'libp2p'

// const star = webRTCStar({ wrtc: wrtc })

const node = await createLibp2p({
	pubsub: gossipsub({ allowPublishToZeroPeers: true }),
	transports: [webRTCDirect()],
	streamMuxers: [mplex()],
	connectionEncryption: [noise()]
})

await node.start()
await node.dial(peerIdFromString('12D3KooWJwX1EwSNwkaEVeZwsQrC4pakjpK4Ee4GhaFc9PDbMdQv'))

const topic = 'my-topic'
await node.pubsub.subscribe(topic)

node.pubsub.addEventListener('message', (msg) => {
	const decodedMessage = new TextDecoder().decode(msg.detail.data)
	const { topic } = msg.detail
	console.log(`${Math.floor(Date.now() / 1000)} Received message [${topic}] ${decodedMessage}`)
})

// node.addEventListener("peer:connect", async (_) => {
// 	const msg = new TextEncoder().encode("banana2")
// 	await node.pubsub.publish(topic, msg)
// })

// Listen for new peers
node.addEventListener('peer:discovery', (evt) => {
	// const peer = evt.detail
	// dial them when we discover them
	node.dial(evt.detail.id).catch((_) => {
		console.log(`Could not dial ${evt.detail.id}`)
	})
})

console.log(`libp2p id is ${node.peerId.toString()}`)
