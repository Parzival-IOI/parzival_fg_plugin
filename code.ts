type builder = {
  name: string,
  x: number,
  y: number,
  width: number,
  height: number,
  type: string,
  text: {
    text: string,
    font: string,
    fontWeight: string,
    fontSize: number,
    lineHeight: number,
    letterSpacing: number,
    alignment: string
  } | null,
  image: {
      link: string
  } | null,
  fill: 
    { 
        type: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND" | "IMAGE" | "VIDEO", 
        color: 
        { 
            r: number, 
            g: number, 
            b: number 
        },
    }[],
  opacity: number,
  cornerRadious: {
    topLeftRadius: number
    topRightRadius: number
    bottomLeftRadius: number
    bottomRightRadius: number
    totalRadius: number
  },
  rotation: number,
  arc: {
    startingAngle: number
    endingAngle: number
    innerRadius: number
  } | null,
  pointCount: number | null,
  strokeWeight: number | null,
  strokeAlign: "OUTSIDE" | "CENTER" | "INSIDE" | null,
  strokes: {
    type: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND" | "IMAGE" | "VIDEO",
    color: 
    { 
        r: number, 
        g: number, 
        b: number 
    } 
  }[] | null,
  ratio: number | null,
}[]


if (figma.editorType === 'figma') {

  figma.showUI(__html__, { themeColors: true, width: 600, height: 600,  title: "Design Roaster" });

  figma.ui.onmessage =  async (msg: {type: string, description: string, format: string, image: any, scaffold: builder}) => {

    if (msg.type === 'generate') {

    }
    else if (msg.type === 'screenshot') {

      try {

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
        tempFrame.fills = [];

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

      } catch (e: any) {
        console.log(e)
        figma.notify(e.message)
      }
    }
    else if (msg.type === 'screenshot-component') {

      try {

        const nodes = figma.currentPage.selection;
        if (nodes.length === 0) {
          figma.notify("No objects selected.");
          return;
        }

        const sizes: {left: number, right: number, top: number, bottom: number}[]= []
        let left = Infinity;
        let top = Infinity;

        for (const node of nodes) {
          //console.log(node.name)
          const x = node.absoluteTransform[0][2];
          const y = node.absoluteTransform[1][2];
          //for relative position
          left = Math.min(left, x);
          top = Math.min(top, y);
          //for each component position mapping
          sizes.push({left: x, right: x + node.width, top: y, bottom: y + node.height});
        }


        const originalNodes = [...figma.currentPage.children];

        //create group for export picture
        const tempFrame = figma.createFrame();
        tempFrame.name = "TempExportFrame";
        tempFrame.clipsContent = false;
        tempFrame.layoutMode = "NONE";
        tempFrame.x = 10000;
        tempFrame.y = 10000;
        tempFrame.fills = [];

        //console.log(`left ${left}, right ${right}, top ${top}, bottom ${bottom}`);

        // loop all component/node in page
        for (const node of originalNodes) {

          const clone_top = node.absoluteTransform[1][2];
          const clone_left = node.absoluteTransform[0][2];
          const clone_right = node.absoluteTransform[0][2] + node.width;
          const clone_bottom = node.absoluteTransform[1][2] + node.height;

          for(const size of sizes) {
            //check if node in selected node relative XY position
            if (
                size.left <= clone_left && size.right >= clone_right &&
                size.top <= clone_top && size.bottom >= clone_bottom
              ) {

                //console.log(`name ${node.name} clone_left ${clone_left}, clone_right ${clone_right}, clone_top ${clone_top}, clone_bottom ${clone_bottom}`);

                // some component cannot be clone
                if ("clone" in node) {
                  const clone = node.clone();
      
                  const originalX = node.absoluteTransform[0][2];
                  const originalY = node.absoluteTransform[1][2];
      
                  // relative clone position
                  clone.x = originalX - left;
                  clone.y = originalY - top;
                  tempFrame.appendChild(clone);
                  
                  // if the node already clone once no need to clone again so break loop
                  break;
                }
            }
          
          }
        }
        
        // export png file
        const exportBytes = await tempFrame.exportAsync({
          format: 'PNG',
          constraint: { type: 'SCALE', value: 2 }
        });

        tempFrame.remove();

        // convert base 64
        const base64 = figma.base64Encode(exportBytes);

        figma.ui.postMessage({type: 'image', image: base64});

      } catch (e: any) {
        console.log(e)
        figma.notify(e.message)
      }
    }
    else if (msg.type === 'build') {
      try {

        const newPage = figma.createPage();
        newPage.name = "Design_Roaster";

        console.log("starting loop")

        for(const build of msg.scaffold) {
          console.log(build)
          let component = null;
          // check if the component is text
          if(build.type === "Rectangle"){
            component = figma.createRectangle()
            component.name = build.name
            component.x = build.x
            component.y = build.y
            component.resize(build.width, build.height);
            component.opacity = build.opacity

            //radious
            component.topLeftRadius = build.cornerRadious.topLeftRadius
            component.topRightRadius = build.cornerRadious.topRightRadius
            component.bottomLeftRadius = build.cornerRadious.bottomLeftRadius
            component.bottomRightRadius = build.cornerRadious.bottomRightRadius

            component.rotation = build.rotation

            if(build.fill !== null)
              component.fills = [{ 
                type: "SOLID",
                color: 
                { 
                  r: build.fill[0].color?.r, 
                  g: build.fill[0].color?.g, 
                  b: build.fill[0].color?.b 
                } 
              }]

          } 
          //check if the component is text
          else if (build.type === "Text") {

            component = figma.createText()
            component.name = build.name
            component.x = build.x
            component.y = build.y
            component.resize(build.width, build.height);

            component.opacity = build.opacity
            component.rotation = build.rotation

            if(build.fill !== null)
              component.fills = [{ 
                type: "SOLID", 
                color: 
                { 
                  r: build.fill[0].color?.r, 
                  g: build.fill[0].color?.g, 
                  b: build.fill[0].color?.b
                } 
              }]

            if(build.text  !== null) {
              const font : FontName = { family: build.text.font, style: build.text.fontWeight }
              await figma.loadFontAsync(font);
              component.fontName = font
              component.fontSize = build.text.fontSize
              component.lineHeight = {value: build.text.lineHeight, unit: "PIXELS"} as LineHeight
              component.letterSpacing = {value: build.text.letterSpacing, unit: "PIXELS"} as LetterSpacing
              component.characters = build.text.text
            }

          }
          else if (build.type === "Line") {
            component = figma.createLine()
            component.name = build.name
            component.x = build.x
            component.y = build.y
            component.resize(build.width, 0);
            component.rotation = build.rotation
            component.opacity = build.opacity

            component.strokeWeight = build.height
            
            if(build.strokes !== null)
              component.strokes = [{ 
                type: "SOLID", 
                color: 
                { 
                  r: build.strokes[0].color?.r, 
                  g: build.strokes[0].color?.g, 
                  b: build.strokes[0].color?.b
                } 
              }]
          }
          else if (build.type === "Ellipse") {
            component = figma.createEllipse()
            component.name = build.name
            component.x = build.x
            component.y = build.y
            component.resize(build.width, build.height);
            component.opacity = build.opacity
            
            //radious
            component.cornerRadius = build.cornerRadious.totalRadius

            if (build.arc !== null) {
              component.arcData = {
                startingAngle: build.arc?.startingAngle,
                endingAngle: build.arc?.endingAngle,
                innerRadius: build.arc?.innerRadius
              }
            }

            component.rotation = build.rotation

            if(build.fill !== null) {
              component.fills = [{ 
                type: "SOLID", 
                color: 
                { 
                  r: build.fill[0].color?.r, 
                  g: build.fill[0].color?.g, 
                  b: build.fill[0].color?.b 
                } 
              }]
            }  
          }
          else if (build.type === "Polygon") {
            component = figma.createPolygon()
            component.name = build.name
            component.x = build.x
            component.y = build.y
            component.resize(build.width, build.height);
            component.opacity = build.opacity
            component.rotation = build.rotation
            component.cornerRadius = build.cornerRadious.totalRadius

            if (build.pointCount !== null) {
              component.pointCount = build.pointCount
            }
            if(build.fill !== null) {
              component.fills = [{ 
                type: "SOLID", 
                color: 
                { 
                  r: build.fill[0].color?.r, 
                  g: build.fill[0].color?.g, 
                  b: build.fill[0].color?.b 
                } 
              }]
            }
          }
          else if (build.type === "Star") {
            component = figma.createStar()
            component.name = build.name
            component.x = build.x
            component.y = build.y
            component.resize(build.width, build.height);
            component.opacity = build.opacity
            component.rotation = build.rotation
            component.cornerRadius = build.cornerRadious.totalRadius
            
            if (build.pointCount !== null) {
              component.pointCount = build.pointCount
            }

            if (build.ratio !== null) {
              component.innerRadius = build.ratio
            }

            if(build.fill !== null) {
              component.fills = [{ 
                type: "SOLID", 
                color: 
                { 
                  r: build.fill[0].color?.r, 
                  g: build.fill[0].color?.g, 
                  b: build.fill[0].color?.b 
                } 
              }]
            }

          }


          if (component == null) {
            continue;
          }

          console.log("appending")

          newPage.appendChild(component)
        }

      } catch (e: any) {
        console.log(e)
        figma.notify(e.message)
      }

    }
    else if (msg.type === 'test') {

      const newPage = figma.createPage();

      newPage.name = "Design_Roaster";
    
    }
    else if (msg.type === 'profile') {

      if(figma.currentUser == null) {
        figma.notify("Cannot get User Profile!");
        return
      }

      const userid = figma.currentUser?.id
      const username = figma.currentUser?.name

      figma.ui.postMessage({type: 'profile', userid, username });
    
    }
    else {
      figma.closePlugin();
    }
  };
}