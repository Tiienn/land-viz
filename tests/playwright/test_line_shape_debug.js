// Add this to console to check the points
const store = window.__ZUSTAND_STORE__;
if (store) {
  const state = store.getState();
  const shapes = state.shapes;
  console.log('All shapes:', shapes.map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    pointCount: s.points.length,
    points: s.points
  })));
}
