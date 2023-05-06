const nodes: SceneNode[] = [];

const loadFonts = async () => await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
loadFonts().then(() => {

  for(const item of figma.currentPage.selection) {
    // Catch if selection is a component set, variant or component
    if((item && item.type === 'COMPONENT_SET')) {
      figma.notify("Cannot lock aspect ratio of a Component Set.");
      figma.closePlugin();
      return null;
    }
    const parent = item ? item.parent : null;
    const selectionIndex = item && parent ? parent.children.indexOf(item) : null;

    // If selection is a master component
    if(item && item.type === 'COMPONENT') {
      const newComponent = item.createInstance();
      const newChild = newComponent.detachInstance();
      for(const child of newChild.children) {
        child.remove();
      }
      for(const child of item.children) {
        newChild.appendChild(child);
      }
      resetFrame(item);

      item.appendChild(newChild);
      const newParent = item;
      const newSelection = newChild;

      lockAspect(newSelection, newParent, selectionIndex);

    } else if(item && selectionIndex) {
      lockAspect(item, parent, selectionIndex);

    } else {
      figma.notify('Please select an element.');
    }

    figma.closePlugin();
  }
});

function rotateFrames(innerFrame: FrameNode, outerFrame: FrameNode, currentSelection:SceneNode) {
  const selectionHeight = currentSelection.height;
  let currentOuter = outerFrame;
  let currentInner = innerFrame;
  let newOuter: FrameNode;

  while (currentOuter.height < selectionHeight) {
    currentInner.rotation += 0.01
    
    if (currentInner.rotation >= 44.99) {
    currentInner.rotation = 30;
    newOuter = makeNewOuterFrame(currentSelection, currentOuter);
    currentInner = currentOuter;
    currentOuter = newOuter;
    }
  }

  currentInner.locked = true;
  return currentOuter;
}

function makeNewOuterFrame (currentSelection: SceneNode,currentOuter: FrameNode) {
  const newOuter = figma.createFrame();
  newOuter.name = `${currentSelection.name} (Locked Aspect Ratio)`;
  newOuter.fills = [];
  newOuter.layoutMode = 'VERTICAL';
  newOuter.resize(currentSelection.width,currentOuter.height);
  newOuter.primaryAxisSizingMode = 'AUTO';
  newOuter.counterAxisSizingMode = 'FIXED';
  newOuter.appendChild(currentOuter);
  currentOuter.name = '-';
  currentOuter.layoutAlign = 'STRETCH';
  
  return newOuter;
  }

  function resetFrame(frame: ComponentNode) {
    frame.fills = [];
    frame.strokes = [];
    frame.effects = [];
    frame.layoutMode = 'VERTICAL';
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    frame.paddingTop = 0;
    frame.paddingRight = 0;
    frame.paddingBottom = 0;
    frame.paddingLeft = 0;
    frame.itemSpacing = 0;
  }

  function lockAspect(selection: any, parent: any, selectionIndex: any) {
    const originX = selection.x;
    const originY = selection.y;

    // if(figma.currentPage.selection.length > 1) {
    //   figma.notify("Please select a single element");
    //   figma.closePlugin();
    //   return null;
    // }

    // Create inner frame
    let innerFrame = figma.createFrame();
    innerFrame.name = '-';
    innerFrame.fills = [];
    innerFrame.layoutMode = 'HORIZONTAL';
    innerFrame.counterAxisSizingMode = 'AUTO';
    innerFrame.primaryAxisSizingMode = 'FIXED';
    innerFrame.layoutAlign = 'STRETCH';

    // Create 0 height text node
    const textNode = figma.createText();
    textNode.fontName = { family: 'Inter', style: 'Regular' }
    textNode.characters = 'I got no height';
    textNode.lineHeight = {value: 0, unit: 'PIXELS'};

    // Add text node to inner frame and remove it to make inner frame 0 height
    innerFrame.appendChild(textNode);
    innerFrame.children[0].remove();

    // Create the outer frame
    const outerFrame = figma.createFrame();
    outerFrame.name = `${selection.name} (Locked Aspect Ratio)`;
    outerFrame.fills = [];
    outerFrame.layoutMode = 'VERTICAL';
    outerFrame.resize(selection.width,outerFrame.height);
    outerFrame.primaryAxisSizingMode = 'AUTO';
    outerFrame.counterAxisSizingMode = 'FIXED';
    outerFrame.appendChild(innerFrame);

    let finalFrame = rotateFrames(innerFrame, outerFrame, selection);

    // Add selection inside parent frame and set size and constraints
    finalFrame.insertChild(0,selection);
    'layoutPositioning' in selection ? selection.layoutPositioning = 'ABSOLUTE' : null;
    'resize' in selection ? selection.resize(finalFrame.width, finalFrame.height) : null;
    'constraints' in selection ? selection.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH'} : null;
    selection.primaryAxisSizingMode = 'FIXED';
    selection.counterAxisSizingMode = 'FIXED';
    selection.x = 0;
    selection.y = 0;

    // Add final frame to the document
    if(parent && parent.children !== null && parent.type !== 'PAGE') {
      if(selectionIndex && selectionIndex < parent.children.length) {
        parent.insertChild(selectionIndex, finalFrame);
      } else {
        parent.appendChild(finalFrame);
      }

      finalFrame.layoutAlign = 'STRETCH';

      nodes.push(finalFrame);
      figma.currentPage.selection = nodes;
    } else {
      finalFrame.x = originX;
      finalFrame.y = originY;
      figma.currentPage.appendChild(finalFrame);
      nodes.push(finalFrame);
      figma.currentPage.selection = nodes;
    }
  }