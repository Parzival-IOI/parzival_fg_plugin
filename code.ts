if (figma.editorType === 'figma') {

  figma.showUI(__html__, { themeColors: true, width: 500, height: 300,  title: "Parzival's Plugin" });

  figma.ui.onmessage =  async (msg: {type: string, description: string}) => {

    if (msg.type === 'execute') {

      figma.ui.postMessage("hi");
    }
    else if (msg.type === 'screenshot') {

      const originalNodes = [...figma.currentPage.children];
      if (originalNodes.length === 0) {
        figma.notify("No objects on current page.");
        return;
      }

      // Create temporary frame to export
      const tempFrame = figma.createFrame();
      tempFrame.name = "TempExportFrame";
      tempFrame.clipsContent = false;
      tempFrame.layoutMode = "NONE";
      tempFrame.x = 10000;
      tempFrame.y = 10000;

      // Move all nodes into temp frame (temporarily)
      for (const node of originalNodes) {
        tempFrame.appendChild(node);
      }

      console.log(figma.currentPage.children)

      // Export the frame
      const exportBytes = await tempFrame.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 }
      });

      console.log(figma.currentPage.children)


      // Move nodes back to original page
      for (const node of [...tempFrame.children]) {
        figma.currentPage.appendChild(node);
      }

      // Remove temp frame
      tempFrame.remove();

      // Convert to base64
      const base64 = figma.base64Encode(exportBytes);

      figma.ui.postMessage(base64);
    }
    else {
      figma.closePlugin();
    }
  };
}

if (figma.editorType === 'figjam') {
  figma.showUI(__html__);

  figma.ui.onmessage = async (msg: {type: string, count: number}) => {
    if (msg.type === 'create-shapes') {
      
    }

    figma.closePlugin();
  };
}
