figma.parameters.on('input', ({ result }) => {
  if (figma.currentPage.selection.length === 0) {
    result.setError('Please select one or more elements first');
    return;
  }
  result.setSuggestions([
    { name: "1:1", data: 1 },
    { name: "1:2", data: 0.5 },
    { name: "2:1", data: 2 },
    { name: "2:3", data: 0.66666667 },
    { name: "3:2", data: 1.5 },
    { name: "3:4", data: 0.75 },
    { name: "4:3", data: 1.33333333 },
    { name: "4:5", data: 0.8 },
    { name: "5:4", data: 1.25 },
    { name: "9:16", data: 0.5625 },
    { name: "16:9", data: 1.77777778 },
    { name: "Golden Ratio (Landscape)", data: 1.61803398875 },
    { name: "Golden Ratio (Portrait)", data: 1.61803398875 }
  ])
})

figma.on('run', ({parameters}: RunEvent) => {
  const loadFonts = async () => await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  
  if(parameters) {
    loadFonts().then(() => {
      newRatio(parameters.newRatio);
      checkAndLock(figma.currentPage.selection); 
      figma.closePlugin()
    });
  } else {
    loadFonts().then(() => {
      checkAndLock(figma.currentPage.selection);  
      figma.closePlugin()
    });
  }
})

function rotateFrames(innerFrame: FrameNode, outerFrame: FrameNode, currentSelection:SceneNode) {
  const selectionHeight = currentSelection.height;
  const heightPercentage = currentSelection.height / currentSelection.width;
  let currentOuter = outerFrame;
  let currentInner = innerFrame;
  let newOuter: FrameNode;

  // Speed optimization
  if(heightPercentage > 0.34) {
    currentInner.rotation = 20;
  }
  if(heightPercentage >= 0.5) {
    currentInner.rotation = 30;
  }
  if(heightPercentage > 0.57) {
    currentInner.rotation = 35;
  }
  if(heightPercentage >= 0.64) {
    currentInner.rotation = 40;
  }
  if(heightPercentage > 0.7) {
    currentInner.rotation = 44.9;
    newOuter = makeNewOuterFrame(currentSelection, currentOuter);
    currentInner = currentOuter;
    currentOuter = newOuter;
  }
  if(heightPercentage > 1.05) {
    currentInner.rotation = 44.9;
    newOuter = makeNewOuterFrame(currentSelection, currentOuter);
    currentInner = currentOuter;
    currentOuter = newOuter;
  }
  if(heightPercentage > 1.365) {
    currentInner.rotation = 44.9;
    newOuter = makeNewOuterFrame(currentSelection, currentOuter);
    currentInner = currentOuter;
    currentOuter = newOuter;
  }
  if(heightPercentage > 1.63) {
    currentInner.rotation = 44.9;
    newOuter = makeNewOuterFrame(currentSelection, currentOuter);
    currentInner = currentOuter;
    currentOuter = newOuter;
  }
  if(heightPercentage > 1.86) {
    currentInner.rotation = 44.9;
    newOuter = makeNewOuterFrame(currentSelection, currentOuter);
    currentInner = currentOuter;
    currentOuter = newOuter;
  }
  if(heightPercentage > 2.06) {
    currentInner.rotation = 44.9;
    newOuter = makeNewOuterFrame(currentSelection, currentOuter);
    currentInner = currentOuter;
    currentOuter = newOuter;
  }

  while (currentOuter.height < selectionHeight) {
    currentInner.rotation += 0.01
    
    if (currentInner.rotation >= 44.9) {
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

function checkAndLock(selection: any) {
  for(const item of selection) {
    // Catch if selection is a component set, variant or component
    if((item && item.type === 'COMPONENT_SET')) {
      figma.notify("Cannot lock aspect ratio of a Component Set.");
      figma.closePlugin();
      return;
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
}

function lockAspect(selection: any, parent: any, selectionIndex: any) {
  const nodes: SceneNode[] = [];
  const originX = selection.x;
  const originY = selection.y;

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

function greatestCommonDenominator (width:number, height:number) {
  if(height === 0) {
    return width;
  } else {
    let gcd: number = greatestCommonDenominator(height, width%height);
    return gcd;
  }
}

function getAspectRatio (width:number,height:number) {
  const gcd = greatestCommonDenominator(width,height);
  return `${width/gcd}:${height/gcd}`;
}

function newRatio (ratio: number) {
  const selection = figma.currentPage.selection;
  
  for(const item of selection) {
    if('resize' in item) {
      item.resize(item.width, Math.round(item.width / ratio));
    }
  }
}