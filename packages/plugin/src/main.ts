import { on, showUI } from "@create-figma-plugin/utilities";
import { CloseHandler } from "./types";

export default function () {
  console.log("[main.ts] Plugin Main Thread Started");

  const uiOptions = { width: 320, height: 480 };
  showUI(uiOptions);
  console.log("[main.ts] UI Shown", uiOptions);

  // Handle Plugin Close Request
  on<CloseHandler>("CLOSE", () => {
    console.log("[main.ts] Plugin Close Requested");
    figma.closePlugin();
  });

  console.log("[main.ts] Event listeners ready.");
}
