const tabButtons = document.querySelectorAll('.tab-button');
const contentIframes = document.querySelectorAll('.content-iframe');

tabButtons.forEach((button, index) => {
  button.addEventListener('click', () => {
    // Hide all iframes
    contentIframes.forEach(iframe => {
      iframe.hidden = true;
    });
    
    // Show the selected iframe
    if (contentIframes[index]) {
      contentIframes[index].hidden = false;
    }
  });
});
