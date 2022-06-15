import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from 'y-indexeddb'
import { TDBinding, TDShape } from "@tldraw/tldraw";

const VERSION = "doandidinding";

// Create the doc
export const doc = new Y.Doc();

export const roomID = `y-tldraw-${VERSION}`;

// Create a websocket provider
export const provider = new WebrtcProvider(roomID, doc);

// We persist the document content across sessions
export const indexeddbProvider = new IndexeddbPersistence('y-indexeddb', doc)

// Export the provider's awareness API
export const awareness = provider.awareness;

export const yShapes: Y.Map<TDShape> = doc.getMap("shapes");
export const yBindings: Y.Map<TDBinding> = doc.getMap("bindings");

// Create an undo manager for the shapes and binding maps
export const undoManager = new Y.UndoManager([yShapes, yBindings]);
