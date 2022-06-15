import React from "react";
import { Tldraw, useFileSystem } from "@tldraw/tldraw";
import { useMultiplayerState } from "./hooks/useMultiplayerState";
import { roomID } from "./store";

const App: React.FC = () => {
  const fileSystemEvents = useFileSystem();
  const multiplayerEvents = useMultiplayerState(roomID);

  return (
    <div className="tldraw">
      <Tldraw 
        autofocus
        disableAssets
        showPages={false} 
        showMultiplayerMenu={false} 
        {...multiplayerEvents}
        {...fileSystemEvents}
      />
    </div>
  );
};

export default App;
