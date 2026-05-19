export default function decorate(block) {
  // Read the block content (2 rows: key and value)
  const rows = [...block.children];
 
  // Extract key and value from block rows
  const keyRow = rows[0];
  const valueRow = rows[1];
  
  const cssKey = keyRow?.textContent?.trim() || '';
  const cssValue = valueRow?.textContent?.trim() || '';
 
  // Clear the block
  block.innerHTML = '';

  // Set data attributes
  block.setAttribute('data-key', cssKey);
  block.setAttribute('data-value', cssValue);

  // Create key div
  const keyDiv = document.createElement('div');
  keyDiv.className = 'font-key';
  keyDiv.textContent = `${cssKey.split(" ").join("-")}`;

  // Create value div
  const valueDiv = document.createElement('div');
  valueDiv.className = 'font-value';
  valueDiv.textContent = `${cssKey}`;

  // Append to block
  block.appendChild(keyDiv);
  block.appendChild(valueDiv);
}
