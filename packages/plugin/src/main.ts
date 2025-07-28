import { on, showUI } from "@create-figma-plugin/utilities";
import { CloseHandler } from "./types";
import { UI_CONFIG } from "./constants";

export default function () {
  console.log("[main.ts] Plugin Main Thread Started");

  const uiOptions = {
    width: UI_CONFIG.WINDOW_WIDTH,
    height: UI_CONFIG.WINDOW_HEIGHT,
  };
  showUI(uiOptions);
  console.log("[main.ts] UI Shown", uiOptions);

  // Handle Plugin Close Request
  on<CloseHandler>("CLOSE", () => {
    console.log("[main.ts] Plugin Close Requested");
    figma.closePlugin();
  });

  console.log("[main.ts] Event listeners ready.");
}
