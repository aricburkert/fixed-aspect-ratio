const nodes: SceneNode[] = [];

const loadFonts = async () => await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
loadFonts().then(() => {

  const currentSelection = figma.currentPage.selection[0] ? figma.currentPage.selection[0] : null;
  const parent = currentSelection ? currentSelection.parent : null;
  const selectionIndex = currentSelection && parent ? parent.children.indexOf(currentSelection) : null;

  // Catch multiple elements selected
  if(currentSelection && figma.currentPage.selection.length > 1) {
    figma.notify("Please select a single element");
    figma.closePlugin();
  }

  if(currentSelection) {
    const originX = currentSelection.x;
    const originY = currentSelection.y;

    if(figma.currentPage.selection.length > 1) {
      figma.notify("Please select a single element");
      figma.closePlugin();
      return null;
    }

    // Create inner frame
    let innerFrame = figma.createFrame();
    innerFrame.name = '---';
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
    outerFrame.name = `${currentSelection.name} (Fixed Aspect Ratio)`;
    outerFrame.fills = [];
    outerFrame.layoutMode = 'VERTICAL';
    outerFrame.resize(currentSelection.width,outerFrame.height);
    outerFrame.primaryAxisSizingMode = 'AUTO';
    outerFrame.counterAxisSizingMode = 'FIXED';
    outerFrame.appendChild(innerFrame);

    let finalFrame = rotateFrames(innerFrame, outerFrame, currentSelection);

    finalFrame.appendChild(currentSelection);
    'layoutPositioning' in currentSelection ? currentSelection.layoutPositioning = 'ABSOLUTE' : null;
    'resize' in currentSelection ? currentSelection.resize(finalFrame.width, finalFrame.height) : null;
    'constraints' in currentSelection ? currentSelection.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH'} : null;
    currentSelection.x = 0;
    currentSelection.y = 0;

    if(parent && parent.type === 'FRAME') {
      selectionIndex !== null ? parent.insertChild(selectionIndex, finalFrame) : parent.appendChild(finalFrame);
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
  } else {
    figma.notify('Please select an element to make a fixed aspect ratio');
  }

  figma.closePlugin();
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

  return currentOuter;
}

function makeNewOuterFrame (currentSelection: SceneNode,currentOuter: FrameNode) {
  const newOuter = figma.createFrame();
  newOuter.name = `${currentSelection.name} (Fixed Aspect Ratio)`;
  newOuter.fills = [];
  newOuter.layoutMode = 'VERTICAL';
  newOuter.resize(currentSelection.width,currentOuter.height);
  newOuter.primaryAxisSizingMode = 'AUTO';
  newOuter.counterAxisSizingMode = 'FIXED';
  newOuter.appendChild(currentOuter);
  currentOuter.name = '---';
  currentOuter.layoutAlign = 'STRETCH';
  
  return newOuter;
  }