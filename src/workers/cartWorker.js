self.addEventListener('message', (e) => {
  const { items } = e.data;
  const total = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  self.postMessage({ total });
});