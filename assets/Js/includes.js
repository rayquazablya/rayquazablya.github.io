async function include(selector, url) {
  const element = document.querySelector(selector);
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Не удалось загрузить ${url}`);
  }

  element.innerHTML = await response.text();
}

Promise.all([
  include('#header', './components/header.html'),
  include('#footer', './components/footer.html'),
]).catch(console.error);