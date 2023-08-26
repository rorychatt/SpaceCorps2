const tabButtons = document.querySelectorAll('.tab-button');
const contentIframe = document.querySelector('.content-iframe');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const contentUrl = button.getAttribute('data-content');
    contentIframe.src = contentUrl;
  });
});
