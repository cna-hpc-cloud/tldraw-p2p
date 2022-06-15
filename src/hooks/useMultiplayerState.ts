import { TDBinding, TDShape, TDUser, TldrawApp } from "@tldraw/tldraw";
import { useCallback, useEffect, useState } from "react";
import { Room } from "@y-presence/client";
import {
  awareness,
  doc,
  provider,
  undoManager,
  yBindings,
  yShapes
} from "../store";
import type { TldrawPresence } from "../types";

const room = new Room(awareness);

export function useMultiplayerState(roomId: string) {
  const [app, setApp] = useState<TldrawApp>();
  const [loading, setLoading] = useState(true);

  /**
   * Store TldrawApp in our state.
   * Pause default undo/redo and use our implementation instead
   * (onUndo and onRedo)
   */
  const onMount = useCallback(
    (app: TldrawApp) => {
      app.loadRoom(roomId);
      app.pause();
      setApp(app);
    },
    [roomId]
  );

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
      undoManager.stopCapturing();
      doc.transact(() => {
        Object.entries(shapes).forEach(([id, shape]) => {
          if (!shape) {
            yShapes.delete(id);
          } else {
            yShapes.set(shape.id, shape);
          }
        });
        Object.entries(bindings).forEach(([id, binding]) => {
          if (!binding) {
            yBindings.delete(id);
          } else {
            yBindings.set(binding.id, binding);
          }
        });
      });
    },
    []
  );

  /**
   * Custom undo implementation
   */
  const onUndo = useCallback(() => {
    undoManager.undo();
  }, []);

  /**
   * Custom redo implementation
   */
  const onRedo = useCallback(() => {
    undoManager.redo();
  }, []);

  /**
   * Callback to update user's (self) presence
   */
  const onChangePresence = useCallback((app: TldrawApp, user: TDUser) => {
    if (!app.room) return;
    room.setPresence<TldrawPresence>({ id: app.room.userId, tdUser: user });
  }, []);

  /**
   * Update app users whenever there is a change in the room users
   */
  useEffect(() => {
    if (!app || !room) return;

    const unsubOthers = room.subscribe<TldrawPresence>("others", (users) => {
      if (!app.room) return;

      const ids = users
        .filter((user) => user.presence)
        .map((user) => user.presence!.tdUser.id);

      Object.values(app.room.users).forEach((user) => {
        if (user && !ids.includes(user.id) && user.id !== app.room?.userId) {
          app.removeUser(user.id);
        }
      });

      app.updateUsers(
        users
          .filter((user) => user.presence)
          .map((other) => other.presence!.tdUser)
          .filter(Boolean)
      );
    });

    return () => {
      unsubOthers();
    };
  }, [app]);

  /**
   * Update app state whenever there is a change in Yjs CRDT docs 
   * (both local and remote changes)
   */
  useEffect(() => {
    if (!app) return;

    function handleDisconnect() {
      provider.disconnect();
    }

    window.addEventListener("beforeunload", handleDisconnect);

    function handleChanges() {
      app?.replacePageContent(
        Object.fromEntries(yShapes.entries()),
        Object.fromEntries(yBindings.entries()),
        {}
      );
    }

    async function setup() {
      yShapes.observe(handleChanges);
      yBindings.observe(handleChanges);
      handleChanges();
      setLoading(false);
    }

    setup();

    return () => {
      window.removeEventListener("beforeunload", handleDisconnect);
      yShapes.unobserve(handleChanges);
      yBindings.unobserve(handleChanges);
    };
  }, [app]);

  return {
    onMount,
    onChangePage,
    onUndo,
    onRedo,
    loading,
    onChangePresence
  };
}
