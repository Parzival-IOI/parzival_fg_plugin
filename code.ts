if (figma.editorType === 'figma') {

  figma.showUI(__html__, { themeColors: true, width: 500, height: 300,  title: "Parzival's Plugin" });

  figma.ui.onmessage =  async (msg: {type: string, description: string, format: string, base64: string}) => {

    if (msg.type === 'generate') {
      console.log("Uploading image...", msg.base64);
      const response = await fetch('http://localhost:5000/v1/api/gpt/sixer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsIm5hbWUiOiJzdHJpbmciLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3NDYzNjIzMDcsImV4cCI6MTc0NjM3MzEwN30.jcGnueoOyKCNCdnD8M5PRKLkZpvm1Ry03xeYeiR9ucQ`
        },
        body: JSON.stringify({
          prompt: msg.description,
          model: 'gpt-4o',
          max_tokens: "100",
          baseimage: msg.base64,
        })
      });

      const data = await response.text();
      console.log(data);

      figma.ui.postMessage({type: 'response', response: data});

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

      // Export the frame
      const exportBytes = await tempFrame.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 }
      });

      // Move nodes back to original page
      for (const node of [...tempFrame.children]) {
        figma.currentPage.appendChild(node);
      }

      // Remove temp frame
      tempFrame.remove();

      // Convert to base64
      const base64 = figma.base64Encode(exportBytes);

      figma.ui.postMessage({type: 'image', image: base64});
    }
    else if (msg.type === 'test') {
      console.log("test");
      if (figma.currentUser) {
        console.log("ID:", figma.currentUser.id);
        console.log("Username:", figma.currentUser.name);
        figma.ui.postMessage({type: 'test', test: figma.currentUser});
      } else {
        console.log("No user info available (possibly in anonymous mode).");
      }
      
    }
    else {
      figma.closePlugin();
    }
  };
}
