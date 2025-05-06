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

      const nodes = figma.currentPage.selection;
      if (nodes.length === 0) {
        figma.notify("No objects selected.");
        return;
      }

      let left = Infinity;
      let top = Infinity;
      let right = -Infinity;
      let bottom = -Infinity;

      for (const node of nodes) {
        console.log(node.name)
        const x = node.absoluteTransform[0][2];
        const y = node.absoluteTransform[1][2];
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + node.width);
        bottom = Math.max(bottom, y + node.height);
      }

      const originalNodes = [...figma.currentPage.children];

      const tempFrame = figma.createFrame();
      tempFrame.name = "TempExportFrame";
      tempFrame.clipsContent = false;
      tempFrame.layoutMode = "NONE";
      tempFrame.x = 10000;
      tempFrame.y = 10000;
      //tempFrame.resize(right - left, bottom - top);
      tempFrame.fills = [];


      console.log(`left ${left}, right ${right}, top ${top}, bottom ${bottom}`);


      for (const node of originalNodes) {

        const clone_top = node.absoluteTransform[1][2];
        const clone_left = node.absoluteTransform[0][2];
        const clone_right = node.absoluteTransform[0][2] + node.width;
        const clone_bottom = node.absoluteTransform[1][2] + node.height;

        if (
          //( left <= clone_right && right >= clone_left) &&
          //( top <= clone_bottom && bottom >= clone_top)
          left <= clone_left && right >= clone_right &&
          top <= clone_top && bottom >= clone_bottom
        ) {

          console.log(`name ${node.name} clone_left ${clone_left}, clone_right ${clone_right}, clone_top ${clone_top}, clone_bottom ${clone_bottom}`);
          
          if ("clone" in node) {
            const clone = node.clone();

            const originalX = node.absoluteTransform[0][2];
            const originalY = node.absoluteTransform[1][2];

            // Position relative to tempFrame
            clone.x = originalX - left;
            clone.y = originalY - top;
            tempFrame.appendChild(clone);
          }
        }
      }
      
      const exportBytes = await tempFrame.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 }
      });

      tempFrame.remove();

      


      const base64 = figma.base64Encode(exportBytes);

      figma.ui.postMessage({type: 'image', image: base64});
      
    }
    else {
      figma.closePlugin();
    }
  };
}
