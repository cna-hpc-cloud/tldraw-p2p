import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { webRTCDirect } from '@libp2p/webrtc-direct'
import { createLibp2p } from 'libp2p'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

const createNode = async () => {
	return await createLibp2p({
		addresses: {
			listen: ['/ip4/0.0.0.0/tcp/0']
		},
		transports: [webRTCDirect()],
		streamMuxers: [mplex()],
		connectionEncryption: [noise()],
		// we add the Pubsub module we want
		pubsub: gossipsub({ allowPublishToZeroPeers: true, emitSelf: true })
	})
}

const topic = 'news'
const [node1, node2, node3] = await Promise.all([createNode(), createNode(), createNode()])

// Add node's 2 data to the PeerStore
await node1.peerStore.addressBook.set(node2.peerId, node2.getMultiaddrs())
await node1.peerStore.addressBook.set(node3.peerId, node3.getMultiaddrs())
await node1.dial(node2.peerId)
await node1.dial(node3.peerId)

node1.pubsub.addEventListener('message', (evt) => {
	console.log(`node1 received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
})
await node1.pubsub.subscribe(topic)

// Will not receive own published messages by default
node2.pubsub.addEventListener('message', (evt) => {
	console.log(`node2 received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
})
await node2.pubsub.subscribe(topic)

node3.pubsub.addEventListener('message', (evt) => {
	console.log(`node3 received: ${uint8ArrayToString(evt.detail.data)} on topic ${evt.detail.topic}`)
})
await node3.pubsub.subscribe(topic)

// node2 publishes "news" every second
setInterval(() => {
	node2.pubsub
		.publish(topic, uint8ArrayFromString('Bird bird bird, bird is the word!'))
		.catch((error) => {
			console.error(error)
		})
}, 1000)
